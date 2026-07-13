"use client"

import { useLanguage } from "@/lib/i18n/context"

export default function ApplyPage() {
  const { lang } = useLanguage()
  const isTamil = lang === "ta"

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- single-use static logo from Cloudinary, no responsive variants needed */}
        <img
          src="https://res.cloudinary.com/dmhonzqrm/image/upload/edu_logo_f_nnrof6.png"
          alt="Education logo"
          className="mb-6 h-14 w-14 shrink-0 object-contain"
        />
        <h1 className={`text-2xl font-bold tracking-tight ${isTamil ? "font-tamil" : ""}`}>
          {isTamil ? "பதிவு செய்ததற்கு நன்றி!" : "Thank You for Your Interest!"}
        </h1>
        <p className={`text-muted-foreground mt-4 text-sm leading-relaxed ${isTamil ? "font-tamil" : ""}`}>
          {isTamil
            ? "விண்ணப்பப் பதிவு தற்போது மூடப்பட்டுள்ளது, ஏனெனில் தேவையான தரவை நாங்கள் பெற்றுவிட்டோம். ஆர்வம் காட்டியதற்கும் உங்கள் நேரத்திற்கும் நன்றி."
            : "Registrations are now closed as we have collected the data we need. Thank you for your interest and for taking the time to apply."}
        </p>
        <p className={`text-muted-foreground mt-3 text-sm leading-relaxed ${isTamil ? "font-tamil" : ""}`}>
          {isTamil
            ? "தேர்ந்தெடுக்கப்பட்ட விண்ணப்பதாரர்களுக்கு அடுத்த ஒரு வாரத்திற்குள் பதிவு செய்யப்பட்ட மின்னஞ்சல் முகவரிக்கு அறிவிப்பு அனுப்பப்படும். தொடர்ந்து உங்கள் இன்பாக்ஸை (மற்றும் ஸ்பேம் கோப்புறையை) சரிபார்க்கவும்."
            : "Selected candidates will receive an email at their registered address within the next week. Please keep an eye on your inbox (and spam folder) for updates."}
        </p>
      </div>
    </div>
  )
}
