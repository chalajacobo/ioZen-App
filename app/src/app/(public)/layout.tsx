import { type ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background-primary)] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
