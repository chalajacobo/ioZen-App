import { Container, PageHeader } from "@/components/layout";
import { Skeleton } from "@/ui/feedback";

export default function ChatflowEditLoading() {
    return (
        <Container>
            <PageHeader
                title="Loading..."
                description="Loading chatflow configuration"
                backUrl="#"
            />

            <div className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr_400px] gap-6 h-[calc(100vh-200px)]">
                    {/* Left Panel - Fields List Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full bg-neutral-900" />
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-neutral-900" />
                            ))}
                        </div>
                    </div>

                    {/* Middle Panel - Preview Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full bg-neutral-900" />
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-32 bg-neutral-900" />
                                    <Skeleton className="h-10 w-full bg-neutral-900" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Field Editor Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full bg-neutral-900" />
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full bg-neutral-900" />
                            <Skeleton className="h-10 w-full bg-neutral-900" />
                            <Skeleton className="h-32 w-full bg-neutral-900" />
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
}
