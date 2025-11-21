import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends HTMLAttributes<HTMLTableElement> { }

export const Table = forwardRef<HTMLTableElement, TableProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className="w-full overflow-auto">
                <table
                    ref={ref}
                    className={cn('w-full border-collapse', className)}
                    {...props}
                />
            </div>
        );
    }
);

Table.displayName = 'Table';

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> { }

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
    ({ className, ...props }, ref) => {
        return (
            <thead
                ref={ref}
                className={cn('border-b border-[var(--border-primary)]', className)}
                {...props}
            />
        );
    }
);

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> { }

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
    ({ className, ...props }, ref) => {
        return (
            <tbody
                ref={ref}
                className={cn('', className)}
                {...props}
            />
        );
    }
);

TableBody.displayName = 'TableBody';

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    clickable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, clickable = false, ...props }, ref) => {
        return (
            <tr
                ref={ref}
                className={cn(
                    'border-b border-[var(--border-secondary)] last:border-0',
                    'transition-colors duration-200',
                    clickable && 'hover:bg-[#0f0f0f] cursor-pointer',
                    className
                )}
                {...props}
            />
        );
    }
);

TableRow.displayName = 'TableRow';

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> { }

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, ...props }, ref) => {
        return (
            <th
                ref={ref}
                className={cn(
                    'text-left px-4 py-3',
                    'text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider',
                    className
                )}
                {...props}
            />
        );
    }
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> { }

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, ...props }, ref) => {
        return (
            <td
                ref={ref}
                className={cn(
                    'px-4 py-4',
                    'text-sm text-[var(--text-primary)]',
                    className
                )}
                {...props}
            />
        );
    }
);

TableCell.displayName = 'TableCell';
