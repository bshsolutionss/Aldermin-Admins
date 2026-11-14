import AdminLayout from "@/components/layout/AdminLayout";
import { getVerifiedUser, AuthServiceUnavailableError } from "@/lib/auth-server";
import { SessionUnavailable } from "@/components/auth/SessionUnavailable";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { sessionRecoveryUrl } from "@/lib/session-navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getVerifiedUser();
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) return <SessionUnavailable />;
    throw error;
  }
  const { user } = session;

  // No authenticated session or user does not have the admin role
  if (!user) {
    if ((await cookies()).has("refresh_token")) {
      redirect(sessionRecoveryUrl((await headers()).get("x-auth-return-to") ?? "/admin"));
    }
    redirect("/");
  }
  if (user.role?.toLowerCase() !== "admin") {
    redirect("/");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
