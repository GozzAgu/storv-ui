import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

export type StaffInviteEmailMode = 'credentials' | 'reset_link'

export interface SendStaffInviteEmailPayload {
  ownerUserId: string
  storeId: string
  departmentId: string
  staffId: string
  staffEmail: string
  staffName: string
  departmentName?: string
  businessName?: string
  temporaryPassword?: string
  mode?: StaffInviteEmailMode
}

export function useStaffInviteEmail() {
  const { authFetch } = useAuthenticatedFetch()

  async function sendStaffInviteEmail(payload: SendStaffInviteEmailPayload) {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return {
        ok: true,
        mode: payload.mode || 'reset_link',
        message: `Demo: would email ${payload.staffEmail}`,
      }
    }

    return authFetch<{ ok: boolean; mode: StaffInviteEmailMode; message: string }>(
      '/api/staff/send-invite-email',
      {
        method: 'POST',
        body: payload,
      }
    )
  }

  return { sendStaffInviteEmail }
}
