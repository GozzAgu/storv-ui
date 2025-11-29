import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from './useFirestore'
import { useFirebaseAuth } from './useFirebaseAuth'

export interface Department {
  id: string
  name: string
  description?: string
  departmentType: string
  manager?: string
  managerId?: string
  staffCount: number
  createdAt: any
  updatedAt: any
  createdBy: string
}

export const CORE_DEPARTMENTS = [
  'Sales',
  'Marketing',
  'Customer Service',
  'Inventory',
  'Warehouse',
  'Finance',
  'Accounting',
  'Human Resources',
  'Operations',
  'IT',
  'Other',
] as const

/**
 * Composable for department management in Firestore
 */
export const useDepartments = () => {
  const { getFirestoreInstance } = useFirestore()
  const { currentUser } = useFirebaseAuth()

  // Get all departments
  const getDepartments = async (): Promise<Department[]> => {
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    // Don't throw error if user is not authenticated - let the page handle it
    // The auth middleware will redirect unauthenticated users

    try {
      const departmentsRef = collection(db, 'departments')
      // Try to query with orderBy, but if it fails due to missing index or empty collection, fetch without orderBy
      let querySnapshot
      try {
        const q = query(departmentsRef, orderBy('createdAt', 'desc'))
        querySnapshot = await getDocs(q)
      } catch (orderByError: any) {
        // If orderBy fails (e.g., no index), try without orderBy
        if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
          querySnapshot = await getDocs(departmentsRef)
        } else {
          throw orderByError
        }
      }

      const departments: Department[] = []
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        departments.push({
          id: docSnapshot.id,
          ...data,
        } as Department)
      })

      // Sort manually if we fetched without orderBy
      if (departments.length > 0 && departments[0]?.createdAt) {
        departments.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0
          const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0
          return bTime - aTime
        })
      }

      return departments
    } catch (error: any) {
      console.error('Error getting departments:', error)
      
      // Provide helpful error messages
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        throw new Error('Missing or insufficient permissions. Please check your Firestore security rules.')
      }
      
      throw new Error(error.message || 'Failed to fetch departments')
    }
  }

  // Get a single department
  const getDepartment = async (departmentId: string): Promise<Department | null> => {
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    try {
      const departmentRef = doc(db, 'departments', departmentId)
      const departmentSnap = await getDoc(departmentRef)

      if (!departmentSnap.exists()) {
        return null
      }

      return {
        id: departmentSnap.id,
        ...departmentSnap.data(),
      } as Department
    } catch (error: any) {
      console.error('Error getting department:', error)
      throw new Error(error.message || 'Failed to fetch department')
    }
  }

  // Create a new department
  const createDepartment = async (departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'staffCount'>): Promise<string> => {
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    if (!currentUser.value) {
      throw new Error('User must be authenticated to create departments')
    }

    try {
      const departmentsRef = collection(db, 'departments')
      const newDepartmentRef = doc(departmentsRef)

      const newDepartment: Omit<Department, 'id'> = {
        ...departmentData,
        staffCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.value.uid,
      }

      await setDoc(newDepartmentRef, newDepartment)
      return newDepartmentRef.id
    } catch (error: any) {
      console.error('Error creating department:', error)
      throw new Error(error.message || 'Failed to create department')
    }
  }

  // Update a department
  const updateDepartment = async (departmentId: string, updates: Partial<Omit<Department, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> => {
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    try {
      const departmentRef = doc(db, 'departments', departmentId)
      await updateDoc(departmentRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch (error: any) {
      console.error('Error updating department:', error)
      throw new Error(error.message || 'Failed to update department')
    }
  }

  // Delete a department
  const deleteDepartment = async (departmentId: string): Promise<void> => {
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    try {
      // Check if department has staff
      const staffRef = collection(db, 'staff')
      const q = query(staffRef, where('departmentId', '==', departmentId))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        throw new Error('Cannot delete department with existing staff. Please remove all staff first.')
      }

      const departmentRef = doc(db, 'departments', departmentId)
      await deleteDoc(departmentRef)
    } catch (error: any) {
      console.error('Error deleting department:', error)
      throw new Error(error.message || 'Failed to delete department')
    }
  }

  // Update staff count for a department
  const updateStaffCount = async (departmentId: string, count: number): Promise<void> => {
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    try {
      const departmentRef = doc(db, 'departments', departmentId)
      await updateDoc(departmentRef, {
        staffCount: count,
        updatedAt: serverTimestamp(),
      })
    } catch (error: any) {
      console.error('Error updating staff count:', error)
      throw new Error(error.message || 'Failed to update staff count')
    }
  }

  return {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    updateStaffCount,
  }
}

