export default defineNuxtRouteMiddleware(async (to, from) => {
  const { currentUser, loading } = useFirebaseAuth()
  
  // Wait for auth to load with shorter timeout
  if (loading.value) {
    await new Promise((resolve) => {
      let resolved = false
      const unwatch = watch(loading, (val) => {
        if (!val && !resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      })
      
      // Timeout after 3 seconds - don't wait forever
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      }, 3000)
    })
  }
  
  // Redirect to signin if not authenticated
  if (!loading.value && !currentUser.value) {
    return navigateTo('/signin')
  }
})

