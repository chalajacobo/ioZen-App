import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { Container, PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/data-display'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/data-display'
import Link from 'next/link'
import { Plus, MessageSquare, BarChart3 } from 'lucide-react'

interface DashboardPageProps {
  params: Promise<{ workspaceSlug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    redirect('/w')
  }

  // Get chatflows for this workspace
  const chatflows = await prisma.chatflow.findMany({
    where: { workspaceId: workspace.id },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Get stats
  const totalChatflows = await prisma.chatflow.count({
    where: { workspaceId: workspace.id },
  })

  const totalSubmissions = await prisma.chatflowSubmission.count({
    where: {
      chatflow: { workspaceId: workspace.id },
    },
  })

  const recentSubmissions = await prisma.chatflowSubmission.count({
    where: {
      chatflow: { workspaceId: workspace.id },
      createdAt: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  return (
    <Container>
      <PageHeader
        title="Dashboard"
        description={`Welcome to ${workspace.name}`}
        action={
          <Link href={`/w/${workspaceSlug}/chatflows/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Chatflow
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--background-tertiary)] rounded-[var(--radius-md)]">
                <MessageSquare className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {totalChatflows}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Chatflows
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--background-tertiary)] rounded-[var(--radius-md)]">
                <BarChart3 className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {totalSubmissions}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Submissions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--background-tertiary)] rounded-[var(--radius-md)]">
                <BarChart3 className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {recentSubmissions}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  This Week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Chatflows */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Chatflows</CardTitle>
          <CardDescription>
            Your latest chatflows and their submission counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chatflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] mb-4">
                No chatflows yet. Create your first one!
              </p>
              <Link href={`/w/${workspaceSlug}/chatflows/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Chatflow
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {chatflows.map((chatflow) => (
                <Link
                  key={chatflow.id}
                  href={`/w/${workspaceSlug}/chatflows/${chatflow.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--border-primary)] hover:border-[var(--border-focus)] transition-colors">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {chatflow.name}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {chatflow._count.submissions} submissions
                      </p>
                    </div>
                    <Badge
                      variant={
                        chatflow.status === 'PUBLISHED'
                          ? 'published'
                          : chatflow.status === 'DRAFT'
                            ? 'draft'
                            : 'archived'
                      }
                    >
                      {chatflow.status.toLowerCase()}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
