import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/db'

/**
 * Workspace selector page.
 * Redirects to the user's first workspace or shows workspace selection.
 */
export default async function WorkspaceSelectorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's workspaces
  const memberships = await prisma.workspaceMember.findMany({
    where: { profileId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  })

  if (memberships.length === 0) {
    // This shouldn't happen - trigger creates default workspace
    // But handle gracefully
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background-primary)]">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Workspace Found
          </h1>
          <p className="text-[var(--text-secondary)]">
            Please contact support if this issue persists.
          </p>
        </div>
      </div>
    )
  }

  // Redirect to the first workspace
  const defaultWorkspace = memberships[0].workspace
  redirect(`/w/${defaultWorkspace.slug}/dashboard`)
}
