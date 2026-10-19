import { defineSalesRoute } from '~/server/utils/sales/http'
import { resolveStaffPermissions, type LegacyStaffAccessFields } from '~/utils/staff-permissions'

/** People who can approve a discount or trade-in at this branch and have set a PIN. */
export default defineSalesRoute(
  { id: 'sales:approvers', limit: 60, method: 'GET', write: false },
  async ({ db, auth, actor }) => {
    const owner = db.collection('users').doc(actor.ownerId)
    const pins = await owner.collection('approvalPins').select().get()
    const withPin = new Set(pins.docs.map((d) => d.id))
    const out: Array<{ uid: string; name: string }> = []

    if (withPin.has(actor.ownerId)) {
      const data = (await owner.get()).data() ?? {}
      out.push({ uid: actor.ownerId, name: String(data.name || 'Owner').slice(0, 80) })
    }
    const members = await actor.store.collection('members').where('status', '==', 'active').get()
    for (const doc of members.docs) {
      if (doc.id === actor.ownerId || !withPin.has(doc.id)) continue
      const member = doc.data() as LegacyStaffAccessFields & { staffId?: string; departmentId?: string }
      if (member.admin !== true && !resolveStaffPermissions(member).receipts.edit) continue
      let name = 'Manager'
      if (member.staffId && member.departmentId) {
        const staff = await actor.store
          .collection('departments')
          .doc(String(member.departmentId))
          .collection('staff')
          .doc(String(member.staffId))
          .get()
        const s = staff.data() ?? {}
        name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || name
      }
      out.push({ uid: doc.id, name: name.slice(0, 80) })
    }
    return { approvers: out.filter((a) => a.uid !== auth.uid) }
  }
)
