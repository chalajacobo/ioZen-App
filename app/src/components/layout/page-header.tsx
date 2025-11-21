import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    action?: ReactNode;
    backUrl?: string;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
    ({ className, title, description, action, backUrl, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8', className)}
                {...props}
            >
                <div className="flex items-start gap-4">
                    {backUrl && (
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="mt-1 shrink-0"
                        >
                            <Link href={backUrl}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Go back</span>
                            </Link>
                        </Button>
                    )}
                    <div>
                        <h1 className="page-title">{title}</h1>
                        {description && (
                            <p className="secondary-text mt-1">{description}</p>
                        )}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
        );
    }
);

PageHeader.displayName = 'PageHeader';
