"use client"

import * as React from "react"
import { translate, type Lang } from "./translations"

const STORAGE_KEY = "oes-lang"

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null)

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  )
}

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode
  initialLang?: Lang
}) {
  const [lang, setLangState] = React.useState<Lang>(initialLang)

  React.useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY)) as Lang | null
    if (stored === "en" || stored === "ta") {
      // Hydration sync from localStorage; cookie provides the SSR default.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(stored)
      document.documentElement.lang = stored
    }
  }, [])

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [])

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      interpolate(translate(lang, key), vars),
    [lang]
  )

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext)
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return ctx
}

/** Convenience hook returning only the translate function. */
export function useT() {
  return useLanguage().t
}
