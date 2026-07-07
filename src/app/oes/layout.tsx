import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "OES — Online Enumeration System",
  description:
    "A secure online platform to collect, manage, and review educational beneficiary information.",
}

export default function OesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
