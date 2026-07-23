/**
 * Secondary portal password generation and validation
 *
 * Format: FirstName(3 letters) + OES_ID(last 4 digits)
 * Examples:
 * - Lokeshwaran, OES20260205 → LOK0205
 * - Sabitha N., OES20260582 → SAB0582
 * - Nivedha. S., OES20260119 → NIE0119
 */

/**
 * Generate password from applicant name and OES ID
 *
 * @param firstName First name of the applicant
 * @param oesId OES reference number (e.g., "OES20260205")
 * @returns Plain text password (never store this, hash it)
 */
export function generateSecondaryPassword(firstName: string, oesId: string): string {
  // Extract first 3 letters of first name, uppercase
  const firstThree = firstName.trim().slice(0, 3).toUpperCase()

  // Extract last 4 digits from OES ID (e.g., "0205" from "OES20260205")
  const lastFour = oesId.slice(-4)

  return `${firstThree}${lastFour}`
}

/**
 * Validate a password against a hashed password
 * Uses bcrypt for comparison
 */
export async function validateSecondaryPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Hash a password for storage
 */
export async function hashSecondaryPassword(plainPassword: string): Promise<string> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.hash(plainPassword, 10)
}
