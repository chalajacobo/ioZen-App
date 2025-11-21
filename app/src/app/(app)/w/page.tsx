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
    // Attempt to self-heal: Create profile and default workspace if missing
    let targetRedirectUrl: string | null = null

    try {
      // 1. Ensure profile exists
      // Check if profile exists by ID first
      let profile = await prisma.profile.findUnique({
        where: { id: user.id }
      })

      if (!profile) {
        // Check for "zombie" profile (same email, different ID)
        // This can happen if a user was deleted from Auth but not from public.profiles
        const zombie = await prisma.profile.findUnique({
          where: { email: user.email! }
        })

        if (zombie) {
          console.log('Removing zombie profile:', zombie.id)
          await prisma.profile.delete({
            where: { id: zombie.id }
          })
        }

        // Create new profile
        profile = await prisma.profile.create({
          data: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata.name || user.email?.split('@')[0] || 'User',
            avatarUrl: user.user_metadata.avatar_url,
          },
        })
      }

      // 2. Create default workspace
      // Check if user already has a workspace (via membership) to avoid duplicates if step 1 succeeded but step 2 failed previously
      const existingMembership = await prisma.workspaceMember.findFirst({
        where: { profileId: profile.id }
      })

      let workspace
      if (existingMembership) {
        workspace = await prisma.workspace.findUnique({
          where: { id: existingMembership.workspaceId }
        })
      }

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: 'My Workspace',
            slug: `ws-${user.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 7)}`,
            members: {
              create: {
                profileId: profile.id,
                role: 'OWNER',
              },
            },
          },
        })
      }

      if (workspace) {
        // Redirect is handled after try/catch to avoid NEXT_REDIRECT error
        targetRedirectUrl = `/w/${workspace.slug}/dashboard`
      } else {
        throw new Error('Failed to create workspace')
      }

    } catch (error) {
      // If it's a redirect error, re-throw it so Next.js handles it
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        throw error
      }

      console.error('Failed to self-heal account:', error)
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Setup Failed</h1>
            <p className="text-muted-foreground">
              We couldn&apos;t create your workspace automatically.
            </p>
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm font-mono text-left max-w-md mx-auto overflow-auto">
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        </div>
      )
    }

    if (targetRedirectUrl) {
      redirect(targetRedirectUrl)
    }
  }

  // Redirect to the first workspace
  const defaultWorkspace = memberships[0].workspace
  redirect(`/w/${defaultWorkspace.slug}/dashboard`)
}
