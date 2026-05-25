import { useStaffStore } from '~/stores/staff'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import type { Staff } from '~/composables/useStaff'
import type { Store } from '~/composables/useStores'

export interface StaffWorkspaceContext {
 staff: Staff | null
 store: Store | null
 storeName: string
 storeEmail: string
 storePhone: string
 storeAddress: string
 businessType: string
 departmentName: string
 departmentId: string
 staffRole: string
 position: string
}

/** Load the signed-in staff member's assigned branch and department. */
export async function resolveStaffWorkspaceContext(): Promise<StaffWorkspaceContext> {
 const empty: StaffWorkspaceContext = {
 staff: null,
 store: null,
 storeName: '',
 storeEmail: '',
 storePhone: '',
 storeAddress: '',
 businessType: '',
 departmentName: '',
 departmentId: '',
 staffRole: '',
 position: '',
 }

 const userStore = useUserStore()
 if (userStore.userData?.role !== 'staff') {
 return empty
 }

 const staffStore = useStaffStore()
 const storesStore = useStoresStore()

 const staff = await staffStore.fetchCurrentStaffMember()
 await storesStore.initializeCurrentStore()
 const store = storesStore.currentStore

 return {
 staff,
 store,
 storeName: store?.name?.trim() || '',
 storeEmail: store?.email?.trim() || '',
 storePhone: store?.phone?.trim() || '',
 storeAddress: store?.address?.trim() || '',
 businessType: store?.description?.trim() || '',
 departmentName: staff?.departmentName?.trim() || '',
 departmentId: staff?.departmentId || '',
 staffRole: staff?.role || '',
 position: staff?.position?.trim() || '',
 }
}

/** Map branch document fields into profile `storeInfo` shape. */
export function applyWorkspaceToProfileStoreInfo(
 target: {
 storeName: string
 storeAddress: string
 storePhone: string
 storeEmail: string
 storeDescription: string
 },
 ctx: StaffWorkspaceContext,
) {
 if (ctx.storeName) target.storeName = ctx.storeName
 if (ctx.storeAddress) target.storeAddress = ctx.storeAddress
 if (ctx.storePhone) target.storePhone = ctx.storePhone
 if (ctx.storeEmail) target.storeEmail = ctx.storeEmail
 if (ctx.businessType) target.storeDescription = ctx.businessType
}

/** Map branch document fields into settings `storeInfo` shape. */
export function applyWorkspaceToSettingsStoreInfo(
 target: {
 name: string
 businessType: string
 email: string
 phone: string
 address: string
 },
 ctx: StaffWorkspaceContext,
) {
 if (ctx.storeName) target.name = ctx.storeName
 if (ctx.businessType) target.businessType = ctx.businessType
 if (ctx.storeEmail) target.email = ctx.storeEmail
 if (ctx.storePhone) target.phone = ctx.storePhone
 if (ctx.storeAddress) target.address = ctx.storeAddress
}

/** Fill profile store fields from a branch document when workspace lookup left gaps. */
export function fillProfileStoreInfoFromStore(
 target: {
 storeName: string
 storeAddress: string
 storePhone: string
 storeEmail: string
 storeDescription: string
 },
 store: Store | null | undefined,
) {
 if (!store) return
 if (!target.storeName) target.storeName = store.name?.trim() || ''
 if (!target.storeEmail) target.storeEmail = store.email?.trim() || ''
 if (!target.storePhone) target.storePhone = store.phone?.trim() || ''
 if (!target.storeAddress) target.storeAddress = store.address?.trim() || ''
 if (!target.storeDescription) target.storeDescription = store.description?.trim() || ''
}

/** Fill settings store fields from a branch document when workspace lookup left gaps. */
export function fillSettingsStoreInfoFromStore(
 target: {
 name: string
 businessType: string
 email: string
 phone: string
 address: string
 },
 store: Store | null | undefined,
) {
 if (!store) return
 if (!target.name) target.name = store.name?.trim() || ''
 if (!target.email) target.email = store.email?.trim() || ''
 if (!target.phone) target.phone = store.phone?.trim() || ''
 if (!target.address) target.address = store.address?.trim() || ''
 if (!target.businessType) target.businessType = store.description?.trim() || ''
}
