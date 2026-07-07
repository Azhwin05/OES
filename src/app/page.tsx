export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- single-use static logo from Cloudinary, no responsive variants needed */}
      <img
        src="https://res.cloudinary.com/dmhonzqrm/image/upload/Ooruni_logo_dbsggm.webp"
        alt="Ooruni"
        className="h-20 w-auto sm:h-28"
      />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Coming Soon
        </h1>
        <p className="text-muted-foreground max-w-md text-sm sm:text-base">
          We&apos;re building something new. Ooruni.com will be live shortly.
        </p>
      </div>
    </main>
  )
}
