import { redirect } from "next/navigation";

// Legacy starter route — Rolodex lives at /people.
export default function ProtectedPage() {
  redirect("/people");
}
