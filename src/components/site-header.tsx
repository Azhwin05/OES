"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useT } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

const links = [
  { href: "/oes", key: "nav.home" },
  { href: "/oes/apply", key: "nav.apply" },
  { href: "/oes/track", key: "nav.track" },
  { href: "/oes/contact", key: "nav.contact" },
]

export function SiteHeader() {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/oes" aria-label="OES home">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/oes/admin/login" />}
          >
            {t("nav.adminLogin")}
          </Button>
          <Button size="sm" render={<Link href="/oes/apply" />}>
            {t("home.hero.cta.start")}
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t bg-background md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t(l.key)}
            </Link>
          ))}
          <Link
            href="/oes/admin/login"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {t("nav.adminLogin")}
          </Link>
        </nav>
      </div>
    </header>
  )
}
