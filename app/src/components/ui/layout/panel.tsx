import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> { }

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] overflow-hidden',
                    className
                )}
                {...props}
            />
        );
    }
);

Panel.displayName = 'Panel';

export interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'px-6 py-5 border-b border-[var(--border-primary)]',
                    className
                )}
                {...props}
            />
        );
    }
);

PanelHeader.displayName = 'PanelHeader';

export interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> { }

export const PanelBody = forwardRef<HTMLDivElement, PanelBodyProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('px-6 py-6', className)}
                {...props}
            />
        );
    }
);

PanelBody.displayName = 'PanelBody';
