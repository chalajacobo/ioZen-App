'use client';

import { type HTMLAttributes, forwardRef, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('Tabs components must be used within a Tabs component');
    }
    return context;
};

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
    onValueChange: (value: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
    ({ className, value, onValueChange, children, ...props }, ref) => {
        return (
            <TabsContext.Provider value={{ value, onValueChange }}>
                <div
                    ref={ref}
                    className={cn('w-full', className)}
                    {...props}
                >
                    {children}
                </div>
            </TabsContext.Provider>
        );
    }
);

Tabs.displayName = 'Tabs';

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> { }

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1',
                    'bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-md)] p-1',
                    'w-fit',
                    className
                )}
                {...props}
            />
        );
    }
);

TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
    value: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ className, value, children, ...props }, ref) => {
        const { value: selectedValue, onValueChange } = useTabsContext();
        const isActive = selectedValue === value;

        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    'px-5 py-2 text-sm font-medium rounded-[var(--radius-sm)]',
                    'transition-all duration-200',
                    'focus:outline-none',
                    isActive
                        ? 'bg-[var(--background-tertiary)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]',
                    className
                )}
                onClick={() => onValueChange(value)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
    ({ className, value, children, ...props }, ref) => {
        const { value: selectedValue } = useTabsContext();

        if (selectedValue !== value) {
            return null;
        }

        return (
            <div
                ref={ref}
                className={cn('mt-6 animate-fade-in', className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

TabsContent.displayName = 'TabsContent';
