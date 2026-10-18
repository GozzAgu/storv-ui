import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const STORE = 'users/owner/stores/s1'

describe('firestore.rules: category access for store members', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'storv-ui-category-access',
      firestore: { rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8') },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'users/owner'), { uid: 'owner', role: 'superAdmin' })
      await setDoc(doc(db, STORE), { ownerId: 'owner', storeId: 's1', name: 'Ikeja' })

      const member = (uid: string, departmentId?: string) =>
        setDoc(doc(db, `${STORE}/members/${uid}`), {
          authUid: uid,
          status: 'active',
          ...(departmentId ? { departmentId } : {}),
        })
      await member('amaka', 'sales')
      await member('tunde', 'warehouse')
      await member('femi', 'warehouse')
      await member('newbie')

      await setDoc(doc(db, `${STORE}/inventoryFolders/phones`), {
        name: 'Phones',
        storeId: 's1',
        createdBy: 'owner',
        allowedDepartments: ['sales'],
        allowedStaff: ['femi'],
      })
      await setDoc(doc(db, `${STORE}/inventoryFolders/cables`), {
        name: 'Cables',
        storeId: 's1',
        createdBy: 'owner',
        allowedDepartments: [],
      })

      const item = (id: string, folderId: string) =>
        setDoc(doc(db, `${STORE}/inventoryItems/${id}`), {
          name: id,
          folderId,
          storeId: 's1',
          createdBy: 'owner',
        })
      await item('iphone', 'phones')
      await item('usb', 'cables')
      await item('orphan', 'deleted-folder')
    })
  })

  const as = (uid: string) => testEnv.authenticatedContext(uid).firestore()
  const itemsIn = (uid: string, folderId: string) =>
    query(collection(as(uid), `${STORE}/inventoryItems`), where('folderId', '==', folderId))

  it('lets the owner read everything', async () => {
    await assertSucceeds(getDoc(doc(as('owner'), `${STORE}/inventoryItems/iphone`)))
    await assertSucceeds(getDocs(collection(as('owner'), `${STORE}/inventoryItems`)))
  })

  it('lets a member of a chosen department open the category', async () => {
    await assertSucceeds(getDoc(doc(as('amaka'), `${STORE}/inventoryItems/iphone`)))
    await assertSucceeds(getDocs(itemsIn('amaka', 'phones')))
    await assertSucceeds(getCountFromServer(itemsIn('amaka', 'phones')))
  })

  it('blocks a member whose department is not chosen', async () => {
    await assertFails(getDoc(doc(as('tunde'), `${STORE}/inventoryItems/iphone`)))
    await assertFails(getDocs(itemsIn('tunde', 'phones')))
    await assertFails(getCountFromServer(itemsIn('tunde', 'phones')))
  })

  it('lets in someone the owner named, even from another department', async () => {
    await assertSucceeds(getDoc(doc(as('femi'), `${STORE}/inventoryItems/iphone`)))
    await assertSucceeds(getDocs(itemsIn('femi', 'phones')))
  })

  it('blocks a member with no department from restricted categories only', async () => {
    await assertFails(getDocs(itemsIn('newbie', 'phones')))
    await assertSucceeds(getDocs(itemsIn('newbie', 'cables')))
  })

  it('keeps open categories and products whose category is gone readable', async () => {
    await assertSucceeds(getDocs(itemsIn('tunde', 'cables')))
    await assertSucceeds(getDoc(doc(as('tunde'), `${STORE}/inventoryItems/orphan`)))
  })

  it('refuses store-wide product queries from members, so nothing locked slips through', async () => {
    await assertFails(getDocs(collection(as('tunde'), `${STORE}/inventoryItems`)))
    await assertFails(getDocs(collection(as('amaka'), `${STORE}/inventoryItems`)))
  })

  it('allows the Swap-ins tab queries: store-wide for the owner, per category for members', async () => {
    const swapIns = (uid: string, folderId?: string) =>
      query(
        collection(as(uid), `${STORE}/inventoryItems`),
        ...(folderId ? [where('folderId', '==', folderId)] : []),
        where('swapIn', '==', true)
      )
    await assertSucceeds(getDocs(swapIns('owner')))
    await assertSucceeds(getDocs(swapIns('amaka', 'phones')))
    await assertFails(getDocs(swapIns('tunde', 'phones')))
    await assertFails(getDocs(swapIns('amaka')))
  })

  it('still lets a member return a locked product to stock', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), `${STORE}/inventoryItems/iphone`), {
        dateOut: new Date('2026-10-01'),
      })
    })
    await assertSucceeds(
      updateDoc(doc(as('tunde'), `${STORE}/inventoryItems/iphone`), {
        dateOut: null,
        updatedAt: new Date(),
      })
    )
  })

  it('does not let a stranger in through a named-people list', async () => {
    await assertFails(getDoc(doc(as('outsider'), `${STORE}/inventoryItems/usb`)))
  })

  describe('changing who can open a category', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), `${STORE}/members/tunde`), {
          authUid: 'tunde',
          status: 'active',
          departmentId: 'warehouse',
          permissions: { products: { view: true, create: true, edit: true, delete: false } },
        })
      })
    })

    const phones = (uid: string) => doc(as(uid), `${STORE}/inventoryFolders/phones`)

    it('lets the owner change departments and named people', async () => {
      await assertSucceeds(
        updateDoc(phones('owner'), { allowedDepartments: ['sales', 'warehouse'] })
      )
      await assertSucceeds(updateDoc(phones('owner'), { allowedStaff: ['tunde'] }))
    })

    it('stops a member with products.edit from adding themselves', async () => {
      await assertFails(updateDoc(phones('tunde'), { allowedStaff: ['femi', 'tunde'] }))
      await assertFails(updateDoc(phones('tunde'), { allowedDepartments: ['sales', 'warehouse'] }))
      await assertFails(updateDoc(phones('tunde'), { allowedDepartments: [] }))
    })

    it('still lets that member edit the rest of the category', async () => {
      await assertSucceeds(
        updateDoc(phones('tunde'), {
          name: 'Phones & tablets',
          allowedDepartments: ['sales'],
          allowedStaff: ['femi'],
        })
      )
    })

    it('treats a missing named-people list the same as an empty one', async () => {
      await assertSucceeds(
        updateDoc(doc(as('tunde'), `${STORE}/inventoryFolders/cables`), {
          name: 'Cables',
          allowedStaff: [],
        })
      )
    })
  })
})
