import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from './useFirestore'
import { useFirebaseAuth } from './useFirebaseAuth'
import { useDepartments } from './useDepartments'
import { useStaffStore } from '~/stores/staff'

export interface Staff {
 id: string
 firstName: string
 lastName: string
 email: string
 phone?: string
 departmentId: string
 departmentName?: string
 storeId: string // Store this staff member belongs to
 position: string
  role: 'manager' | 'staff' | 'intern'
  /** When true (managers only), owner allows full inventory edit without super-admin access. */
  canManageInventory?: boolean
  hireDate: string
 salary?: number
  status: 'active' | 'inactive' | 'on_leave'
  removedAt?: unknown
  removedBy?: string
  authUid?: string // Firebase Auth UID
 mustChangePassword?: boolean // When true, staff must set a new password on next login
 createdAt: any
 updatedAt: any
 createdBy: string
}

/**
 * Composable for staff management in Firestore
 */
export const useStaff = () => {
 const { getFirestoreInstance } = useFirestore()
 const { currentUser } = useFirebaseAuth()

 // Get all staff
 const getStaff = async (): Promise<Staff[]> => {
 const db = getFirestoreInstance()
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const staffRef = collection(db, 'staff')
 const q = query(staffRef, orderBy('createdAt', 'desc'))
 const querySnapshot = await getDocs(q)

 const staff: Staff[] = []
 querySnapshot.forEach((docSnapshot) => {
 staff.push({
 id: docSnapshot.id,
 ...docSnapshot.data(),
 } as Staff)
 })

 // Populate department names
 const { getDepartments } = useDepartments()
 const departments = await getDepartments()
 const departmentMap = new Map(departments.map(d => [d.id, d.name]))

 return staff.map(s => ({
 ...s,
 departmentName: departmentMap.get(s.departmentId) || 'Unknown',
 }))
 } catch (error: any) {
 console.error('Error getting staff:', error)
 throw new Error(error.message || 'Failed to fetch staff')
 }
 }

 // Get staff by department
 const getStaffByDepartment = async (departmentId: string): Promise<Staff[]> => {
 const db = getFirestoreInstance()
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const staffRef = collection(db, 'staff')
 const q = query(
 staffRef,
 where('departmentId', '==', departmentId),
 orderBy('createdAt', 'desc')
 )
 const querySnapshot = await getDocs(q)

 const staff: Staff[] = []
 querySnapshot.forEach((docSnapshot) => {
 staff.push({
 id: docSnapshot.id,
 ...docSnapshot.data(),
 } as Staff)
 })

 // Get department name
 const { getDepartment } = useDepartments()
 const department = await getDepartment(departmentId)
 
 return staff.map(s => ({
 ...s,
 departmentName: department?.name || 'Unknown',
 }))
 } catch (error: any) {
 console.error('Error getting staff by department:', error)
 throw new Error(error.message || 'Failed to fetch staff')
 }
 }

 // Get a single staff member
 const getStaffMember = async (staffId: string): Promise<Staff | null> => {
 const db = getFirestoreInstance()
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const staffRef = doc(db, 'staff', staffId)
 const staffSnap = await getDoc(staffRef)

 if (!staffSnap.exists()) {
 return null
 }

 const staffData = {
 id: staffSnap.id,
 ...staffSnap.data(),
 } as Staff

 // Get department name
 const { getDepartment } = useDepartments()
 const department = await getDepartment(staffData.departmentId)
 staffData.departmentName = department?.name || 'Unknown'

 return staffData
 } catch (error: any) {
 console.error('Error getting staff member:', error)
 throw new Error(error.message || 'Failed to fetch staff member')
 }
 }

 // Create a new staff member
 const createStaff = async (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'departmentName'>): Promise<string> => {
 const db = getFirestoreInstance()
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 if (!currentUser.value) {
 throw new Error('User must be authenticated to create staff')
 }

 try {
 // Verify department exists
 const { getDepartment, updateStaffCount } = useDepartments()
 const department = await getDepartment(staffData.departmentId)
 if (!department) {
 throw new Error('Department not found')
 }

 const staffRef = collection(db, 'staff')
 const newStaffRef = doc(staffRef)

 const newStaff: Omit<Staff, 'id' | 'departmentName'> = {
 ...staffData,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 createdBy: currentUser.value.uid,
 }

 await setDoc(newStaffRef, newStaff)

 // Update department staff count
 await updateStaffCount(staffData.departmentId, department.staffCount + 1)

 // If staff is a manager, update department manager
 if (staffData.role === 'manager') {
 await updateDepartmentManager(staffData.departmentId, `${staffData.firstName} ${staffData.lastName}`, newStaffRef.id)
 }

 return newStaffRef.id
 } catch (error: any) {
 console.error('Error creating staff:', error)
 throw new Error(error.message || 'Failed to create staff')
 }
 }

 // Update a staff member
 const updateStaff = async (staffId: string, updates: Partial<Omit<Staff, 'id' | 'createdAt' | 'createdBy' | 'departmentName'>>): Promise<void> => {
 const db = getFirestoreInstance()
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const staffRef = doc(db, 'staff', staffId)
 
 // If department is being changed, update counts
 if (updates.departmentId) {
 const staffMember = await getStaffMember(staffId)
 if (staffMember && staffMember.departmentId !== updates.departmentId) {
 const { updateStaffCount } = useDepartments()
 
 // Decrease old department count
 await updateStaffCount(staffMember.departmentId, Math.max(0, (await getDepartmentStaffCount(staffMember.departmentId)) - 1))
 
 // Increase new department count
 const newCount = await getDepartmentStaffCount(updates.departmentId)
 await updateStaffCount(updates.departmentId, newCount + 1)
 }
 }

 await updateDoc(staffRef, {
 ...updates,
 updatedAt: serverTimestamp(),
 })

 // If role changed to manager, update department
 if (updates.role === 'manager') {
 const staffMember = await getStaffMember(staffId)
 if (staffMember) {
 await updateDepartmentManager(staffMember.departmentId, `${staffMember.firstName} ${staffMember.lastName}`, staffId)
 }
 }
 } catch (error: any) {
 console.error('Error updating staff:', error)
 throw new Error(error.message || 'Failed to update staff')
 }
 }

 // Deactivate staff (use Pinia staff store — soft-delete + disable Auth)
 const deleteStaff = async (staffId: string): Promise<Staff> => {
 const staffStore = useStaffStore()
 return staffStore.deleteStaff(staffId)
 }

 const reactivateStaff = async (staffId: string): Promise<Staff> => {
 const staffStore = useStaffStore()
 return staffStore.reactivateStaff(staffId)
 }

 // Helper function to get department staff count
 const getDepartmentStaffCount = async (departmentId: string): Promise<number> => {
 const staff = await getStaffByDepartment(departmentId)
 return staff.length
 }

 const updateDepartmentManager = async (departmentId: string, managerName: string, managerId: string) => {
 const { updateDepartment } = useDepartments()
 await updateDepartment(departmentId, {
 manager: managerName,
 managerId: managerId,
 })
 }

 return {
 getStaff,
 getStaffByDepartment,
 getStaffMember,
 createStaff,
 updateStaff,
 deleteStaff,
 reactivateStaff,
 }
}

