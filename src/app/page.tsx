import { redirect } from "next/navigation";

// Redirect to login immediately at the server level, no JS needed.
// AppShell handles the session check and redirects to /dashboard if already logged in.
export default function Home() {
  redirect("/login");
}
