import { redirect } from "next/navigation";

// Legacy starter route — Bery lives at /people.
export default function ProtectedPage() {
  redirect("/people");
}
