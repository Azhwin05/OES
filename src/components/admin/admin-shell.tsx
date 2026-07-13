"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Download,
  Users,
  Settings,
  ScrollText,
  ListChecks,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BrandLogo } from "@/components/brand-logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/constants"

const NAV = [
  { href: "/oes/admin", icon: LayoutDashboard, key: "admin.nav.overview", exact: true },
  { href: "/oes/admin/applications", icon: FileText, key: "admin.nav.applications" },
  { href: "/oes/admin/shortlist", icon: ListChecks, key: "admin.nav.shortlist" },
  { href: "/oes/admin/reports", icon: BarChart3, key: "admin.nav.reports" },
  { href: "/oes/admin/export", icon: Download, key: "admin.nav.export" },
  { href: "/oes/admin/users", icon: Users, key: "admin.nav.users", adminOnly: true },
  { href: "/oes/admin/audit", icon: ScrollText, key: "admin.nav.audit", adminOnly: true },
  { href: "/oes/admin/settings", icon: Settings, key: "admin.nav.settings" },
]

export function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode
  email: string
  role: UserRole
}) {
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/oes/admin/login")
    router.refresh()
  }

  const items = NAV.filter((n) => !n.adminOnly || role !== "viewer")

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link href="/oes/admin" className="text-sidebar-foreground">
          <BrandLogo iconClassName="bg-sidebar-primary" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((n) => {
          const active = isActive(n.href, n.exact)
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <n.icon className="h-4 w-4" />
              {t(n.key)}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-foreground">
              {email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{email}</p>
            <p className="text-[10px] text-sidebar-foreground/60">
              {t(`users.role.${role}`)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <LanguageSwitcher />
          <Button variant="outline" size="sm" render={<Link href="/oes" />}>
            {t("nav.home")}
          </Button>
        </header>
        <main className="flex-1 bg-muted/30 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
