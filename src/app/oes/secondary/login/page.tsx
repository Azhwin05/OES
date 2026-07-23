"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogIn, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { secondaryLogin } from "./actions"

export default function SecondaryLoginPage() {
  const router = useRouter()
  const [reference, setReference] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await secondaryLogin(reference, password)
      if (!result.ok) {
        setError(
          result.error === "not_shortlisted"
            ? "This OES ID has not been shortlisted for the next round."
            : result.error === "server"
              ? "Portal is not open yet. Please try again shortly."
              : "Invalid OES ID or password."
        )
        return
      }
      router.push("/oes/secondary/portal")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Secondary Data Login</h1>
        <p className="text-muted-foreground mt-1">
          Log in with your OES ID and the password mailed to you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applicant Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reference">OES ID</Label>
              <Input
                id="reference"
                placeholder="OES20260123"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                autoCapitalize="characters"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              <LogIn className="mr-1 h-4 w-4" />
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
