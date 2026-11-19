"use client";

import { useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaLock, FaUser } from "react-icons/fa";
import { apiService } from "@/lib/api-service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiService.auth.login({
        email: email.trim(),
        password,
        portal: "portal",
      });

      setSuccess(`Signed in successfully as ${res.user.name} (${res.user.role.toUpperCase()}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,109,95,0.14),_transparent_35%),linear-gradient(135deg,#f5f5f7_0%,#edf7f5_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-lg rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8">
          <div className="mb-8 text-center">
            <img
              src="/assets/images/aldermin-logo.png"
              alt="Aldermin"
              className="mx-auto mb-5 h-16 w-auto object-contain"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#006d5f]">
              Secure Access
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Portal Login
            </h1>
            <p className="mt-2 text-sm text-slate-500">Please sign in to continue</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <FaUser />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSuccess("");
                  }}
                  placeholder="Enter email"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#006d5f] focus:bg-white focus:ring-4 focus:ring-[#006d5f]/10"
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSuccess("");
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#006d5f] focus:bg-white focus:ring-4 focus:ring-[#006d5f]/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <Link href="/" className="font-medium text-slate-600 transition hover:text-slate-900">
                Admin Portal
              </Link>
              <Link href="/auth/forgot-password" className="font-medium text-[#006d5f] transition hover:underline">
                Forgot password?
              </Link>
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

          <p className="mt-6 text-center text-sm text-slate-500">
            New student? <Link href="/auth/register" className="font-semibold text-[#006d5f] hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
