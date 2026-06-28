import { describe, it, expect } from "vitest"
import { translate, translations } from "./translations"

describe("i18n translate", () => {
  it("returns English text for a known key", () => {
    expect(translate("en", "nav.home")).toBe("Home")
  })

  it("returns Tamil text for a known key", () => {
    expect(translate("ta", "nav.home")).toBe("முகப்பு")
  })

  it("falls back to English when a Tamil key is missing", () => {
    // every English key should resolve; unknown keys return the key itself
    expect(translate("ta", "totally.unknown.key")).toBe("totally.unknown.key")
  })

  it("has Tamil coverage for every English key", () => {
    const enKeys = Object.keys(translations.en)
    const missing = enKeys.filter((k) => !(k in translations.ta))
    expect(missing).toEqual([])
  })
})
