import { redirect } from "next/navigation";
// Keep legacy bookmarks working through the supported reset-link flow.
export default function OTPVerificationPage() {
  redirect("/auth/forgot-password");
}
