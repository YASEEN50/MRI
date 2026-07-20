/** Where to send the user after Pi sign-in (matches middleware onboarding rules). */
export function resolvePostLoginPath(session: {
  user?: {
    role?: string
    isProfileComplete?: boolean
  } | null
} | null | undefined): string {
  const user = session?.user
  if (!user) return '/pi-app.html'

  if (user.isProfileComplete === false) {
    switch (user.role) {
      case 'CLIENT':
        return '/onboarding/client'
      case 'DOCTOR':
        return '/onboarding/doctor'
      case 'FACILITY':
        return '/onboarding/facility'
      default:
        return '/select-role'
    }
  }

  switch (user.role) {
    case 'CLIENT':
    case 'DOCTOR':
    case 'FACILITY':
      // Pi Browser hub — static page, no middleware auth loop; links into Next.js app.
      return '/pi-app.html'
    case 'OWNER':
      return '/owner'
    case 'ADMIN':
      return '/dashboard/admin/verification'
    default:
      return '/pi-app.html'
  }
}
