import { redirect } from "next/navigation"

// People opening the site link may not know how to navigate — send them
// straight to the application form.
export default function HomePage() {
  redirect("/apply")
}
