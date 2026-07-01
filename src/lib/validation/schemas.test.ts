import { describe, it, expect } from "vitest"
import {
  personalSchema,
  educationSchema,
  familySchema,
  siblingsSchema,
  impairmentSchema,
  residenceSchema,
  fullApplicationSchema,
} from "./schemas"

describe("personalSchema", () => {
  const base = {
    full_name: "Test User",
    contact_number: "9876543210",
    email: "test@example.com",
    district: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
  }

  it("accepts a valid personal record", () => {
    expect(personalSchema.safeParse(base).success).toBe(true)
  })

  it("rejects an invalid Indian mobile number", () => {
    const r = personalSchema.safeParse({ ...base, contact_number: "12345" })
    expect(r.success).toBe(false)
  })

  it("rejects a mobile starting below 6", () => {
    const r = personalSchema.safeParse({ ...base, contact_number: "5876543210" })
    expect(r.success).toBe(false)
  })

  it("rejects a PIN code that is not 6 digits", () => {
    const r = personalSchema.safeParse({ ...base, pincode: "12345" })
    expect(r.success).toBe(false)
  })

  it("requires a full name", () => {
    const r = personalSchema.safeParse({ ...base, full_name: "" })
    expect(r.success).toBe(false)
  })

  it("rejects an invalid email when provided", () => {
    const r = personalSchema.safeParse({ ...base, email: "not-an-email" })
    expect(r.success).toBe(false)
  })

  it("requires an email", () => {
    const r = personalSchema.safeParse({ ...base, email: "" })
    expect(r.success).toBe(false)
  })
})

describe("educationSchema", () => {
  const base = {
    school_name: "Govt School",
    institution_name: "Govt College",
    course_name: "B.Sc",
    course_duration: 3,
    current_year: 2,
  }

  it("accepts valid education", () => {
    expect(educationSchema.safeParse(base).success).toBe(true)
  })

  it("rejects current year exceeding course duration", () => {
    const r = educationSchema.safeParse({ ...base, current_year: 4 })
    expect(r.success).toBe(false)
  })
})

describe("familySchema", () => {
  it("requires guardian name when parentless", () => {
    const r = familySchema.safeParse({ parent_status: "parentless" })
    expect(r.success).toBe(false)
  })

  it("accepts parentless with a guardian name", () => {
    const r = familySchema.safeParse({
      parent_status: "parentless",
      guardian_name: "Uncle",
    })
    expect(r.success).toBe(true)
  })

  it("requires a reason for single parent", () => {
    const r = familySchema.safeParse({ parent_status: "single" })
    expect(r.success).toBe(false)
  })
})

describe("siblingsSchema", () => {
  it("requires sibling rows to match the count", () => {
    const r = siblingsSchema.safeParse({ number_of_siblings: 2, siblings: [] })
    expect(r.success).toBe(false)
  })

  it("accepts matching siblings", () => {
    const r = siblingsSchema.safeParse({
      number_of_siblings: 1,
      siblings: [{ name: "Sib", birth_order: "elder", occupation: "studying" }],
    })
    expect(r.success).toBe(true)
  })
})

describe("impairmentSchema", () => {
  it("requires type and description when impairment is yes", () => {
    const r = impairmentSchema.safeParse({ has_impairment: true })
    expect(r.success).toBe(false)
  })

  it("accepts no impairment without details", () => {
    const r = impairmentSchema.safeParse({ has_impairment: false })
    expect(r.success).toBe(true)
  })
})

describe("residenceSchema", () => {
  it("requires address fields", () => {
    const r = residenceSchema.safeParse({ residence_type: "own" })
    expect(r.success).toBe(false)
  })

  it("accepts a complete residence", () => {
    const r = residenceSchema.safeParse({
      residence_type: "rental",
      door_street: "1 Main St",
      district: "Madurai",
      state: "Tamil Nadu",
      pincode: "625001",
    })
    expect(r.success).toBe(true)
  })
})

describe("fullApplicationSchema", () => {
  const valid = {
    personal: {
      full_name: "Test User",
      contact_number: "9876543210",
      email: "test@example.com",
      district: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
    education: {
      school_name: "S",
      institution_name: "I",
      course_name: "C",
      course_duration: 4,
      current_year: 1,
    },
    family: { parent_status: "both" },
    siblings: { number_of_siblings: 0, siblings: [] },
    impairment: { has_impairment: false },
    residence: {
      residence_type: "own",
      door_street: "1 St",
      district: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
    documents: [],
    declaration: true,
  }

  it("accepts a complete valid application", () => {
    expect(fullApplicationSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects when declaration is not accepted", () => {
    const r = fullApplicationSchema.safeParse({ ...valid, declaration: false })
    expect(r.success).toBe(false)
  })
})
