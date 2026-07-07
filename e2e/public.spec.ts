import { test, expect } from "@playwright/test"

test.describe("OES public site", () => {
  test("home page shows hero and primary CTAs", async ({ page }) => {
    await page.goto("/oes")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Online Application Form")
  })

  test("language switcher toggles to Tamil", async ({ page }) => {
    await page.goto("/oes")
    await page.getByRole("button", { name: /English/i }).first().click()
    await page.getByRole("menuitem", { name: /தமிழ்/ }).click()
    // Tamil nav label for Home
    await expect(page.getByRole("link", { name: "முகப்பு" }).first()).toBeVisible()
  })

  test("track page renders the lookup form", async ({ page }) => {
    await page.goto("/oes/track")
    await expect(page.getByLabel(/Reference Number/i)).toBeVisible()
    await expect(page.getByLabel(/Phone Number/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Check Status/i })).toBeVisible()
  })

  test("track lookup of an unknown reference shows not-found", async ({ page }) => {
    await page.goto("/oes/track")
    await page.getByLabel(/Reference Number/i).fill("OES-2026-999999")
    await page.getByLabel(/Phone Number/i).fill("9000000000")
    await page.getByRole("button", { name: /Check Status/i }).click()
    await expect(page.getByText(/No application found/i)).toBeVisible({ timeout: 15_000 })
  })

  test("contact page renders form", async ({ page }) => {
    await page.goto("/oes/contact")
    await expect(page.getByLabel(/Your Name/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Send Message/i })).toBeVisible()
  })

  test("application form shows the stepper and validates step 1", async ({ page }) => {
    await page.goto("/oes/apply")
    await expect(page.getByRole("heading", { name: /Personal Information/i })).toBeVisible()
    // Try to advance without filling required fields
    await page.getByRole("button", { name: /^Next$/i }).click()
    await expect(page.getByText(/This field is required/i).first()).toBeVisible()
  })

  test("step 1 required messages are localized", async ({ page }) => {
    await page.goto("/oes/apply")
    await page.getByRole("button", { name: /^Next$/i }).click()
    // Should be the i18n message, not Zod's raw default
    await expect(page.getByText(/This field is required/i).first()).toBeVisible()
  })

  test("application form advances past step 1 when valid", async ({ page }) => {
    await page.goto("/oes/apply")
    await page.getByLabel(/Full Name/i).fill("Test Applicant")
    await page.getByLabel(/^Contact Number/i).fill("9876543210")
    await page.getByLabel(/Email ID/i).fill("test@example.com")
    await page.getByLabel(/PIN Code/i).fill("600001")
    // District is the only unset required select (State defaults to Tamil Nadu)
    await page.getByRole("combobox", { name: /District/i }).click()
    await page.getByRole("option", { name: "Chennai", exact: true }).click()
    await page.getByRole("button", { name: /^Next$/i }).click()
    await expect(page.getByRole("heading", { name: /Education Details/i })).toBeVisible()
  })

  test("admin area redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/oes/admin")
    await expect(page).toHaveURL(/\/oes\/admin\/login/)
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible()
  })
})
