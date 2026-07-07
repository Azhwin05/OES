import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { ApplicationFormValues } from "@/lib/validation/schemas"

type Row = [string, string]

function s(v: unknown): string {
  if (v === undefined || v === null || v === "") return "-"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  return String(v)
}

/**
 * Generates an English-language summary PDF of an application.
 * (Core jsPDF fonts don't include Tamil glyphs; use browser Print for the
 * bilingual copy.)
 */
export function generateApplicationPdf(
  v: ApplicationFormValues,
  reference: string
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const marginX = 40

  doc.setFontSize(18)
  doc.setTextColor(30, 58, 138)
  doc.text("OES — Ooruni Education System", marginX, 50)
  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text("Application Summary", marginX, 70)

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(`Reference Number: ${reference}`, marginX, 95)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 110)

  let y = 130

  const section = (title: string, rows: Row[]) => {
    autoTable(doc, {
      startY: y,
      head: [[title, ""]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 11 },
      bodyStyles: { fontSize: 9, textColor: 40 },
      columnStyles: { 0: { cellWidth: 180, fontStyle: "bold" } },
      margin: { left: marginX, right: marginX },
    })
    // @ts-expect-error lastAutoTable is added by the plugin at runtime
    y = (doc.lastAutoTable?.finalY ?? y) + 16
  }

  section("Personal Information", [
    ["Full Name", s(v.personal?.full_name)],
    ["Contact Number", s(v.personal?.contact_number)],
    ["Alternate Number", s(v.personal?.alt_contact_number)],
    ["Email", s(v.personal?.email)],
    ["Date of Birth", s(v.personal?.dob)],
    ["Gender", s(v.personal?.gender)],
    ["Town/City", s(v.personal?.town)],
    ["District", s(v.personal?.district)],
    ["State", s(v.personal?.state)],
    ["PIN Code", s(v.personal?.pincode)],
  ])

  section("Education Details", [
    ["School Name", s(v.education?.school_name)],
    ["School Type", s(v.education?.school_type)],
    ["Institution Name", s(v.education?.institution_name)],
    ["Institution Type", s(v.education?.institution_type)],
    ["Course Name", s(v.education?.course_name)],
    ["Course Duration", s(v.education?.course_duration)],
    ["Current Year", s(v.education?.current_year)],
    ["Current Semester", s(v.education?.current_semester)],
    ["Scholarship", s(v.education?.scholarship_details)],
  ])

  section("Family Details", [
    ["Parent Status", s(v.family?.parent_status)],
    ["Single Parent Reason", s(v.family?.single_parent_reason)],
    ["Father Name", s(v.family?.father_name)],
    ["Mother Name", s(v.family?.mother_name)],
    ["Guardian Name", s(v.family?.guardian_name)],
    ["Guardian Contact", s(v.family?.guardian_contact)],
    ["Guardian Occupation", s(v.family?.guardian_occupation)],
    ["Annual Income", s(v.family?.annual_income)],
  ])

  const sibs = (v.siblings?.siblings ?? []).map(
    (sib, i): Row => [
      `Sibling ${i + 1}`,
      `${s(sib.name)} (${s(sib.birth_order)}, ${s(sib.occupation)})`,
    ]
  )
  section("Siblings", [
    ["Number of Siblings", s(v.siblings?.number_of_siblings)],
    ...sibs,
  ])

  section("Impairment", [
    ["Has Impairment", s(v.impairment?.has_impairment)],
    ["Belongs To", s(v.impairment?.belongs_to)],
    ["Type", s(v.impairment?.impairment_type)],
    ["Description", s(v.impairment?.description)],
  ])

  section("Residence", [
    ["Residence Type", s(v.residence?.residence_type)],
    ["Roof Type", s(v.residence?.roof_type)],
    ["Ownership Source", s(v.residence?.ownership_source)],
    ["Door/Street", s(v.residence?.door_street)],
    ["Town/City", s(v.residence?.town)],
    ["District", s(v.residence?.district)],
    ["State", s(v.residence?.state)],
    ["PIN Code", s(v.residence?.pincode)],
  ])

  const docs = (v.documents ?? []).map(
    (d): Row => [d.document_type, s(d.file_name)]
  )
  if (docs.length) section("Documents", docs)

  doc.save(`OES-Application-${reference}.pdf`)
}
