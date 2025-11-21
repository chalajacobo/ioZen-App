import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Container, PageHeader } from "@/components/layout";
import { ChatflowEditor } from "@/features/chatflow";
import { Button } from "@/ui/button";

interface PageProps {
    params: Promise<{
        workspaceSlug: string;
        id: string;
    }>;
}

export default async function ChatflowEditPage({ params }: PageProps) {
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

    return (
        <Container>
            <PageHeader
                title={chatflow.name}
                description="Configure and design your chatflow"
                backUrl={`/w/${workspaceSlug}/dashboard`}
                action={
                    <Link href={`/w/${workspaceSlug}/chatflows/${id}/submissions`}>
                        <Button variant="outline" className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Submissions
                        </Button>
                    </Link>
                }
            />

            <div className="mt-8">
                <ChatflowEditor chatflow={chatflow} />
            </div>
        </Container>
    );
}

