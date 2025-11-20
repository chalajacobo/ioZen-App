import { redirect, notFound } from 'next/navigation'
import { type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/db'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { Navigation } from '@/components/layout/navigation'

interface WorkspaceLayoutProps {
  children: ReactNode
  params: Promise<{ workspaceSlug: string }>
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace and verify membership
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    notFound()
  }

  // Get membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      profileId_workspaceId: {
        profileId: user.id,
        workspaceId: workspace.id,
      },
    },
  })

  if (!membership) {
    // User is not a member of this workspace
    redirect('/w')
  }

  // Get profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  })

  if (!profile) {
    // Profile should exist - trigger creates it
    redirect('/login')
  }

  return (
    <WorkspaceProvider
      value={{
        workspace,
        membership,
        profile,
        role: membership.role,
      }}
    >
      <div className="min-h-screen bg-background">
        <Navigation workspaceSlug={workspaceSlug} profile={profile} />
        <main>{children}</main>
      </div>
    </WorkspaceProvider>
  )
}
