"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaUser, FaLock, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { apiService } from "@/lib/api-service";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiService.auth.login({
        email: email.trim(),
        password,
        portal: "admin",
      });

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,109,95,0.14),_transparent_40%),linear-gradient(135deg,#f5f5f7_0%,#edf7f5_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-[#006d5f] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-12 left-8 h-48 w-48 rounded-full bg-[#0a8a7c]/50 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <FaShieldAlt className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-100/80">
                    Aldermin
                  </p>
                  <h1 className="text-2xl font-bold">Admin Portal</h1>
                </div>
              </div>

              <div className="space-y-5">
                <h2 className="max-w-sm text-4xl font-bold leading-tight">
                  School operations, streamlined.
                </h2>
                <p className="max-w-md text-sm leading-7 text-emerald-50/80">
                  Manage admissions, attendance, fees, academics, and performance from a single central dashboard built for modern schools.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid gap-4 text-sm text-emerald-50/90">
              {[
                "Unified student and staff records",
                "Smart fee and attendance oversight",
                "Real-time academic and admin reporting",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <img
                  src="/assets/images/aldermin-logo.png"
                  alt="Aldermin"
                  className="mx-auto mb-5 h-16 w-auto object-contain"
                />
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#006d5f]">
                  Secure Access
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  Admin Login
                </h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email / Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <FaUser />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#006d5f] focus:bg-white focus:ring-4 focus:ring-[#006d5f]/10"
                      placeholder="Enter admin email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#006d5f] focus:bg-white focus:ring-4 focus:ring-[#006d5f]/10"
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006d5f] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,109,95,0.25)] transition hover:bg-[#005a4e] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing In..." : "Sign In"}
                  {!loading && <FaArrowRight className="text-xs" />}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-500">
                <Link href="/auth/forgot-password" className="font-medium text-[#006d5f] transition hover:underline">
                  Forgot password?
                </Link>
                <Link href="/auth/login" className="inline-flex items-center gap-2 font-medium text-slate-600 transition hover:text-slate-900">
                  Portal Login
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
