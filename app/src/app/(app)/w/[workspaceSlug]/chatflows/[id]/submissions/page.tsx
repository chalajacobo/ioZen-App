import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Settings2, MoreHorizontal, ExternalLink } from "lucide-react";
import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Container, PageHeader } from "@/components/layout";
import { Button } from "@/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/ui/data-display";
import { Badge } from "@/ui/data-display";

interface PageProps {
    params: Promise<{
        workspaceSlug: string;
        id: string;
    }>;
}

export default async function SubmissionsPage({ params }: PageProps) {
    const { workspaceSlug, id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch workspace and verify membership
    const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
        include: {
            members: {
                where: { profileId: user.id }
            }
        }
    });

    if (!workspace || workspace.members.length === 0) {
        notFound();
    }

    // Fetch chatflow
    const chatflow = await prisma.chatflow.findUnique({
        where: {
            id,
            workspaceId: workspace.id
        }
    });

    if (!chatflow) {
        notFound();
    }

    // Fetch submissions
    const submissions = await prisma.chatflowSubmission.findMany({
        where: { chatflowId: id },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <Container>
            <PageHeader
                title="Submissions"
                description={`View submissions for ${chatflow.name}`}
                backUrl={`/w/${workspaceSlug}/chatflows/${id}`}
                action={
                    <Link href={`/w/${workspaceSlug}/chatflows/${id}`}>
                        <Button variant="outline" className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Configure Chatflow
                        </Button>
                    </Link>
                }
            />

            <div className="mt-8">
                <Card className="bg-black border-neutral-800">
                    <CardHeader className="border-b border-neutral-800 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">All Submissions</CardTitle>
                                <CardDescription className="text-neutral-500">
                                    {submissions.length} total submissions
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="border-neutral-800 hover:bg-neutral-900 text-neutral-300">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        {submissions.length === 0 ? (
                            <div className="p-12 text-center text-neutral-500">
                                No submissions received yet.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-500 uppercase bg-neutral-950/50 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">ID</th>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Data Preview</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {submissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-neutral-900/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-neutral-400">{sub.id.slice(-8)}</td>
                                            <td className="px-6 py-4 text-neutral-300">
                                                {sub.createdAt.toLocaleDateString()} {sub.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`
                                                    ${sub.status === 'COMPLETED' ? 'text-green-500 bg-green-500/10 border-green-500/20' : ''}
                                                    ${sub.status === 'IN_PROGRESS' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' : ''}
                                                    ${sub.status === 'ABANDONED' ? 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' : ''}
                                                `}>
                                                    {sub.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-400 max-w-xs truncate">
                                                {/* We need to cast JSON to object to extract values */}
                                                {sub.data && typeof sub.data === 'object' ? Object.values(sub.data as Record<string, unknown>).join(', ') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </Container>
    );
}

