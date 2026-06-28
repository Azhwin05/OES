"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { useT } from "@/lib/i18n/context"

export function SiteFooter() {
  const t = useT()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <BrandLogo />
          <p className="text-muted-foreground max-w-sm text-center text-xs sm:text-left">
            {t("brand.tagline")}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/track" className="text-muted-foreground hover:text-foreground">
            {t("nav.track")}
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground">
            {t("footer.contact")}
          </Link>
          <Link href="/admin/login" className="text-muted-foreground hover:text-foreground">
            {t("nav.adminLogin")}
          </Link>
        </div>
      </div>
      <div className="border-t py-4">
        <p className="text-muted-foreground text-center text-xs">
          © {year} OES — {t("brand.full")}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  )
}
