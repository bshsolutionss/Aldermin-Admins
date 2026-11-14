"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ensureSession } from "@/lib/session-client";
import { safeAdminReturnTo } from "@/lib/session-navigation";

function SessionRecovery() {
  const params = useSearchParams();
  const returnTo = safeAdminReturnTo(params.get("returnTo"));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const recover = async () => {
      try {
        const renewed = await ensureSession();
        if (!active) return;
        if (!renewed) { window.location.replace("/"); return; }
        const profile = await fetch("/api/auth/me", { cache: "no-store" });
        if (!profile.ok) throw new Error("Unable to verify your session. Please try again.");
        const user = await profile.json();
        if (active) window.location.replace(user.role === "admin" ? returnTo : "/");
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to renew session.");
      }
    };
    void recover();
    return () => { active = false; };
  }, [returnTo, attempt]);
  return <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Restoring your session</h1>
      {error ? <>
        <p role="alert" className="text-sm text-red-600 mb-5">{error}</p>
        <button onClick={() => { setError(""); setAttempt(value => value + 1); }} className="w-full bg-blue-600 text-white py-3 rounded-lg">Try again</button>
        <Link href="/" className="block mt-4 text-sm text-blue-600 hover:underline">Admin Login</Link>
      </> : <p role="status" className="text-sm text-gray-500">Please wait while we verify your session.</p>}
    </div>
  </div>;
}
export default function SessionPage() {
  return <Suspense fallback={<p role="status">Restoring your session...</p>}><SessionRecovery /></Suspense>;
}
