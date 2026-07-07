import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_Tamil } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import { LanguageProvider } from "@/lib/i18n/context"
import { Toaster } from "@/components/ui/sonner"
import type { Lang } from "@/lib/i18n/translations"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Ooruni",
  description: "Ooruni.com",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get("oes-lang")?.value
  const initialLang: Lang = cookieLang === "ta" ? "ta" : "en"

  return (
    <html
      lang={initialLang}
      className={`${inter.variable} ${notoTamil.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background">
        <LanguageProvider initialLang={initialLang}>
          {children}
          <Toaster richColors position="top-center" />
        </LanguageProvider>
      </body>
    </html>
  )
}
