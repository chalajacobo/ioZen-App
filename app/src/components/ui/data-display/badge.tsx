import { type HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center px-3 py-1 rounded-[var(--radius-lg)] text-xs font-semibold capitalize border',
    {
        variants: {
            variant: {
                active: 'bg-[rgba(74,222,128,0.1)] text-[var(--status-active)] border-[rgba(74,222,128,0.2)]',
                building: 'bg-[rgba(251,191,36,0.1)] text-[var(--status-building)] border-[rgba(251,191,36,0.2)]',
                inactive: 'bg-[rgba(107,114,128,0.1)] text-[var(--status-inactive)] border-[rgba(107,114,128,0.2)]',
                draft: 'bg-[rgba(107,114,128,0.1)] text-[var(--status-inactive)] border-[rgba(107,114,128,0.2)]',
                published: 'bg-[rgba(74,222,128,0.1)] text-[var(--status-active)] border-[rgba(74,222,128,0.2)]',
                archived: 'bg-[rgba(107,114,128,0.1)] text-[var(--status-inactive)] border-[rgba(107,114,128,0.2)]',
                outline: 'bg-neutral-950 border-neutral-800 text-neutral-400',
                secondary: 'bg-neutral-900 text-neutral-400 border-neutral-800',
            },
        },
        defaultVariants: {
            variant: 'inactive',
        },
    }
);

export interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant, children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(badgeVariants({ variant, className }))}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
