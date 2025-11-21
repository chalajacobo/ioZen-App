import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PublicChatView } from "@/features/chat";

interface PageProps {
    params: {
        shareUrl: string;
    };
}

export default async function PublicChatflowPage({ params }: PageProps) {
    const { shareUrl } = await params;
    const chatflow = await prisma.chatflow.findUnique({
        where: { shareUrl },
    });

    if (!chatflow || chatflow.status !== 'PUBLISHED') {
        notFound();
    }

    // Parse schema to get fields
    const schema = chatflow.schema as Prisma.JsonObject;
    const fields = (schema.fields as Prisma.JsonArray) || [];

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl h-[80vh] md:h-[600px]">
                <PublicChatView
                    chatflowId={chatflow.id}
                    fields={fields}
                    chatflowName={chatflow.name}
                />
            </div>
        </div>
    );
}
