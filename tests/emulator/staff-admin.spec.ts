// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import {
  applyStaffUpdate,
  assertStaffCapacity,
  parseNewStaff,
  permissionsForWrite,
  requireStoreAdminGrant,
  resolveStaffManager,
  setStaffAdminAccess,
  storeRef,
  writeNewStaff,
  type StaffManager,
} from '~/server/utils/staff-admin'
import {
  applyBranchDetails,
  applySharedSettings,
  branchDetailsUpdate,
  sharedSettingsUpdate,
} from '~/server/utils/admin-settings'

async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  return promise.then(
    () => undefined,
    (e: unknown) => (e as { statusCode?: number }).statusCode
  )
}

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Branch admin staff management (emulator)', () => {
  let app: App
  let db: Firestore

  beforeAll(() => {
    app = initializeApp({ projectId: 'storv-ui-test-staff-admin' }, `staff-admin-${randomUUID()}`)
    db = getFirestore(app)
  })

  afterAll(async () => {
    await deleteApp(app)
  })

  /** Owner on Micro with store s1 (department d1, one regular staff, one admin) and store s2. */
  async function workspace(opts: { subscription?: string; adminGrants?: Record<string, boolean> } = {}) {
    const ownerId = `owner-${randomUUID()}`
    await db.collection('users').doc(ownerId).set({ subscription: opts.subscription ?? 'storvv_micro' })
    for (const storeId of ['s1', 's2']) {
      await storeRef(db, ownerId, storeId).set({ ownerId, name: storeId })
    }
    const s1 = storeRef(db, ownerId, 's1')
    await s1.collection('departments').doc('d1').set({ name: 'Sales', createdBy: ownerId, staffCount: 2 })
    await s1.collection('departments').doc('d2').set({ name: 'Repairs', createdBy: ownerId, staffCount: 0 })
    await s1.collection('departments').doc('d1').collection('staff').doc('st1').set({
      authUid: 'staff1',
      email: 'staff1@example.com',
      firstName: 'Reg',
      lastName: 'Ular',
      createdBy: ownerId,
      status: 'active',
      permissions: permissionsForWrite({ kind: 'owner', uid: ownerId }, {
        financials: { view: true },
      }),
    })
    await s1.collection('departments').doc('d1').collection('staff').doc('stAdmin').set({
      authUid: 'admin1',
      email: 'admin1@example.com',
      createdBy: ownerId,
      status: 'active',
      admin: true,
    })
    await s1.collection('departments').doc('d1').update({ managerId: 'st1', manager: 'Reg Ular' })
    await s1.collection('members').doc('staff1').set({
      authUid: 'staff1',
      status: 'active',
      permissions: { payments: { view: true, confirm: true } },
    })
    await s1.collection('members').doc('admin1').set({
      authUid: 'admin1',
      status: 'active',
      admin: true,
      ...(opts.adminGrants ? { adminGrants: opts.adminGrants } : {}),
    })
    return { ownerId, s1 }
  }

  it('resolves the owner (verified email) and a branch admin of that store only', async () => {
    const { ownerId } = await workspace()
    expect(await resolveStaffManager(db, { uid: ownerId, emailVerified: true }, ownerId, 's1')).toEqual({
      kind: 'owner',
      uid: ownerId,
    })
    expect(
      await statusOf(resolveStaffManager(db, { uid: ownerId, emailVerified: false }, ownerId, 's1'))
    ).toBe(403)
    expect(
      (await resolveStaffManager(db, { uid: 'admin1', emailVerified: false }, ownerId, 's1')).kind
    ).toBe('admin')
    expect(
      await statusOf(resolveStaffManager(db, { uid: 'admin1', emailVerified: true }, ownerId, 's2'))
    ).toBe(403)
    expect(
      await statusOf(resolveStaffManager(db, { uid: 'staff1', emailVerified: true }, ownerId, 's1'))
    ).toBe(403)
  })

  it('stops a deactivated admin', async () => {
    const { ownerId, s1 } = await workspace()
    await s1.collection('members').doc('admin1').update({ status: 'inactive' })
    expect(
      await statusOf(resolveStaffManager(db, { uid: 'admin1', emailVerified: true }, ownerId, 's1'))
    ).toBe(403)
  })

  it('admin creates staff owned by the store owner, with no financials, admin flag or payments', async () => {
    const { ownerId, s1 } = await workspace({ subscription: 'storvv_enterprise' })
    const manager: StaffManager = { kind: 'admin', uid: 'admin1' }
    const permissions = permissionsForWrite(manager, {
      products: { view: true, create: true },
      financials: { view: true },
      payments: { confirm: true },
    })
    const staffId = await writeNewStaff(db, {
      ownerUserId: ownerId,
      storeId: 's1',
      departmentId: 'd2',
      authUid: 'new1',
      email: 'new1@example.com',
      fields: parseNewStaff({ firstName: 'new', lastName: 'hire', email: 'new1@example.com' }),
      permissions,
    })

    const staff = (await s1.collection('departments').doc('d2').collection('staff').doc(staffId).get()).data()!
    expect(staff.createdBy).toBe(ownerId)
    expect(staff.mustChangePassword).toBe(true)
    expect(staff.admin).toBeUndefined()
    expect(staff.permissions.financials.view).toBe(false)
    expect(staff.permissions.payments).toBeUndefined()

    const member = (await s1.collection('members').doc('new1').get()).data()!
    expect(member).toMatchObject({ staffId, departmentId: 'd2', status: 'active', createdBy: ownerId })
    expect(member.admin).toBeUndefined()
    expect((await s1.collection('departments').doc('d2').get()).data()!.staffCount).toBe(1)
    expect(
      (await db.collection('users').doc(ownerId).collection('workspaceMembers').doc('new1').get()).data()
    ).toMatchObject({ storeId: 's1', status: 'active' })
  })

  it('refuses a department from another store or owner', async () => {
    const { ownerId } = await workspace({ subscription: 'storvv_enterprise' })
    const fields = parseNewStaff({ firstName: 'A', lastName: 'B', email: 'x@example.com' })
    expect(
      await statusOf(
        writeNewStaff(db, {
          ownerUserId: ownerId,
          storeId: 's2',
          departmentId: 'd1',
          authUid: 'x',
          email: 'x@example.com',
          fields,
          permissions: permissionsForWrite({ kind: 'owner', uid: ownerId }, {}),
        })
      )
    ).toBe(404)
  })

  it('counts actual staff records against the plan, not the editable staffCount', async () => {
    const { ownerId, s1 } = await workspace()
    await s1.collection('departments').doc('d1').update({ staffCount: 0 })
    for (let i = 0; i < 3; i += 1) {
      await s1.collection('departments').doc('d2').collection('staff').doc(`extra${i}`).set({
        createdBy: ownerId,
        status: i === 2 ? 'inactive' : 'active',
      })
    }
    // Micro allows 2 per store; s1 has 4 active records (the inactive one doesn't count).
    const limited = await statusOf(assertStaffCapacity(db, ownerId, 's1'))
    expect(limited).toBe(403)
    expect(await statusOf(assertStaffCapacity(db, ownerId, 's2'))).toBeUndefined()
  })

  it('remove, hire a replacement, then reactivate: the reactivation no longer fits the plan', async () => {
    const { ownerId, s1 } = await workspace()
    const staff = s1.collection('departments').doc('d1').collection('staff')
    // Micro allows 2 per store: st1 and stAdmin fill it.
    expect(await statusOf(assertStaffCapacity(db, ownerId, 's1'))).toBe(403)
    await staff.doc('st1').update({ status: 'inactive' })
    expect(await statusOf(assertStaffCapacity(db, ownerId, 's1'))).toBeUndefined()
    await staff.doc('replacement').set({ createdBy: ownerId, status: 'active' })
    expect(await statusOf(assertStaffCapacity(db, ownerId, 's1'))).toBe(403)
  })

  it('admin edits a regular staff member but cannot change their financials or payments', async () => {
    const { ownerId, s1 } = await workspace()
    const manager: StaffManager = { kind: 'admin', uid: 'admin1' }
    await applyStaffUpdate(db, manager, {
      ownerUserId: ownerId,
      storeId: 's1',
      departmentId: 'd1',
      staffId: 'st1',
      updates: {
        position: 'Lead',
        permissions: { products: { view: true, edit: true }, financials: { view: false } },
      },
    })
    const staff = (await s1.collection('departments').doc('d1').collection('staff').doc('st1').get()).data()!
    expect(staff.position).toBe('Lead')
    expect(staff.permissions.products.edit).toBe(true)
    expect(staff.permissions.financials.view).toBe(true)
    const member = (await s1.collection('members').doc('staff1').get()).data()!
    expect(member.permissions.payments).toEqual({ view: true, confirm: true })
    expect(member.permissions.financials.view).toBe(true)
  })

  it('admin cannot edit another admin or themselves', async () => {
    const { ownerId } = await workspace()
    const manager: StaffManager = { kind: 'admin', uid: 'admin1' }
    expect(
      await statusOf(
        applyStaffUpdate(db, manager, {
          ownerUserId: ownerId,
          storeId: 's1',
          departmentId: 'd1',
          staffId: 'stAdmin',
          updates: { position: 'Owner now' },
        })
      )
    ).toBe(403)
  })

  it('moves staff between departments and keeps counts, manager and member doc in step', async () => {
    const { ownerId, s1 } = await workspace()
    await applyStaffUpdate(db, { kind: 'owner', uid: ownerId }, {
      ownerUserId: ownerId,
      storeId: 's1',
      departmentId: 'd1',
      staffId: 'st1',
      updates: { departmentId: 'd2', phone: '' },
    })
    expect((await s1.collection('departments').doc('d1').collection('staff').doc('st1').get()).exists).toBe(false)
    const moved = (await s1.collection('departments').doc('d2').collection('staff').doc('st1').get()).data()!
    expect(moved.departmentId).toBe('d2')
    expect(moved.firstName).toBe('Reg')
    const d1 = (await s1.collection('departments').doc('d1').get()).data()!
    expect(d1.staffCount).toBe(1)
    expect(d1.managerId).toBeUndefined()
    expect((await s1.collection('departments').doc('d2').get()).data()!.staffCount).toBe(1)
    expect((await s1.collection('members').doc('staff1').get()).data()!.departmentId).toBe('d2')
  })

  it('rejects status changes to inactive through edit', async () => {
    const { ownerId } = await workspace()
    expect(
      await statusOf(
        applyStaffUpdate(db, { kind: 'owner', uid: ownerId }, {
          ownerUserId: ownerId,
          storeId: 's1',
          departmentId: 'd1',
          staffId: 'st1',
          updates: { status: 'inactive' },
        })
      )
    ).toBe(400)
  })

  it('only the owner makes admins; grants land on member and staff docs', async () => {
    const { ownerId, s1 } = await workspace()
    const params = {
      ownerUserId: ownerId,
      storeId: 's1',
      departmentId: 'd1',
      staffId: 'st1',
      admin: true,
      grants: { deleteSales: true, bogus: true },
    }
    expect(await statusOf(setStaffAdminAccess(db, { kind: 'admin', uid: 'admin1' }, params))).toBe(403)

    const result = await setStaffAdminAccess(db, { kind: 'owner', uid: ownerId }, params)
    expect(result.adminGrants).toEqual({
      branches: false,
      paymentsConfirm: false,
      deleteSales: true,
      storeSettings: false,
      dataExport: false,
    })
    const member = (await s1.collection('members').doc('staff1').get()).data()!
    expect(member.admin).toBe(true)
    expect(member.adminGrants.deleteSales).toBe(true)
    expect(member.permissions.payments).toEqual({ view: true, confirm: true })

    await setStaffAdminAccess(db, { kind: 'owner', uid: ownerId }, { ...params, admin: false })
    const removed = (await s1.collection('members').doc('staff1').get()).data()!
    expect(removed.admin).toBe(false)
    expect(removed.adminGrants.deleteSales).toBe(false)
  })

  it('checks admin extras per grant', async () => {
    const { ownerId } = await workspace({ adminGrants: { dataExport: true } })
    expect(await statusOf(requireStoreAdminGrant(db, 'admin1', ownerId, 's1', 'dataExport'))).toBeUndefined()
    expect(await statusOf(requireStoreAdminGrant(db, 'admin1', ownerId, 's1', 'branches'))).toBe(403)
    expect(await statusOf(requireStoreAdminGrant(db, 'staff1', ownerId, 's1', 'dataExport'))).toBe(403)
    expect(await statusOf(requireStoreAdminGrant(db, ownerId, ownerId, 's1', 'branches'))).toBeUndefined()
  })

  it('shared settings saves touch only their section; plan and features are untouched', async () => {
    const { ownerId } = await workspace()
    const owner = db.collection('users').doc(ownerId)
    await owner.update({
      storeDetails: {
        storeName: 'Old',
        experienceMode: 'team',
        enabledCapabilities: ['staffManagement'],
        settings: { inventory: { lowStockThreshold: 5, autoReorder: false, defaultCategory: 'general' } },
      },
    })

    await applySharedSettings(db, ownerId, sharedSettingsUpdate('receipt', {
      prefix: 'INV-',
      nextNumber: 2000,
      autoPrint: true,
    }))
    await applySharedSettings(db, ownerId, sharedSettingsUpdate('business', { storeName: 'new name' }))

    const data = (await owner.get()).data()!
    expect(data.subscription).toBe('storvv_micro')
    expect(data.storeDetails.experienceMode).toBe('team')
    expect(data.storeDetails.enabledCapabilities).toEqual(['staffManagement'])
    expect(data.storeDetails.settings.inventory.lowStockThreshold).toBe(5)
    expect(data.storeDetails.settings.receipt).toEqual({ prefix: 'INV-', nextNumber: 2000, autoPrint: true })
    expect(data.storeDetails.storeName).toBe('New Name')
  })

  it('branch details: only that branch, only the detail fields, and only under this owner', async () => {
    const { ownerId, s1 } = await workspace()
    await s1.update({ isActive: true })
    await applyBranchDetails(db, ownerId, 's1', branchDetailsUpdate({ name: 'lekki', phone: '0800' }))
    const branch = (await s1.get()).data()!
    expect(branch).toMatchObject({ name: 'Lekki', phone: '0800', isActive: true, ownerId })
    expect((await storeRef(db, ownerId, 's2').get()).data()!.name).toBe('s2')

    const stranger = `owner-${randomUUID()}`
    expect(
      await statusOf(applyBranchDetails(db, stranger, 's1', branchDetailsUpdate({ name: 'X' })))
    ).toBe(404)
  })
})
