import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, MessageSquare, BarChart3, Clock } from 'lucide-react'
import prisma from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { Container, PageHeader } from '@/components/layout'
import { Card, CardContent } from '@/ui/data-display'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/data-display'

interface PageProps {
    params: Promise<{ workspaceSlug: string }>
}

export default async function ChatflowsPage({ params }: PageProps) {
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

    // Get all chatflows for this workspace
    const chatflows = await prisma.chatflow.findMany({
        where: { workspaceId: workspace.id },
        include: {
            _count: {
                select: { submissions: true },
            },
        },
        orderBy: { updatedAt: 'desc' },
    })

    return (
        <Container>
            <PageHeader
                title="Chatflows"
                description="Manage your conversational forms"
                action={
                    <Link href={`/w/${workspaceSlug}/chatflows/new`}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Chatflow
                        </Button>
                    </Link>
                }
            />

            {chatflows.length === 0 ? (
                <Card className="mt-8">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <MessageSquare className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            No chatflows yet
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6 text-center max-w-md">
                            Create your first chatflow to start collecting conversational data from your users.
                        </p>
                        <Link href={`/w/${workspaceSlug}/chatflows/new`}>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Chatflow
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chatflows.map((chatflow) => (
                        <Link
                            key={chatflow.id}
                            href={`/w/${workspaceSlug}/chatflows/${chatflow.id}`}
                        >
                            <Card className="h-full hover:border-[var(--border-focus)] transition-colors cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                                                {chatflow.name}
                                            </h3>
                                            {chatflow.description && (
                                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                                    {chatflow.description}
                                                </p>
                                            )}
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

                                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-1">
                                            <BarChart3 className="w-4 h-4" />
                                            <span>{chatflow._count.submissions} submissions</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {new Date(chatflow.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </Container>
    )
}
