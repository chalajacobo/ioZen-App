import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <textarea
                    ref={ref}
                    className={cn(
                        'w-full px-4 py-3 text-sm',
                        'bg-[var(--input-bg)] text-[var(--input-text)]',
                        'border border-[var(--input-border)] rounded-[var(--radius-md)]',
                        'placeholder:text-[var(--input-placeholder)]',
                        'focus:outline-none focus:border-[var(--input-focus)] focus:bg-[#0f0f0f]',
                        'transition-all duration-200',
                        'resize-none',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'border-red-500',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
