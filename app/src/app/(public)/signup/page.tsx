'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/ui/button'
import { Input, Label } from '@/ui/forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/data-display'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Client-side validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      router.push('/login?message=Check your email to confirm your account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="30" height="80" rx="4" fill="white" />
              <circle cx="25" cy="50" r="12" fill="black" />
            </svg>
            <span className="text-2xl font-bold text-white">iozen</span>
          </div>
          <CardTitle className="text-2xl text-white">Create an account</CardTitle>
          <CardDescription className="text-[hsl(var(--muted-foreground))]">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="bg-[hsl(var(--input))] border-[hsl(var(--border))] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-[hsl(var(--input))] border-[hsl(var(--border))] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-[hsl(var(--input))] border-[hsl(var(--border))] text-white"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Must be at least 6 characters
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>

            <div className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
