"use client";

import { useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaEnvelope } from "react-icons/fa";
import { apiService } from "@/lib/api-service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await apiService.auth.forgotPassword(email);
      setSuccess(
        res.message || "If this email exists, a password reset link has been sent to your inbox."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset link");
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
              Account Recovery
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Forgot Password
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email to receive a password reset link
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  disabled={loading || !!success}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#006d5f] focus:bg-white focus:ring-4 focus:ring-[#006d5f]/10 disabled:bg-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006d5f] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,109,95,0.25)] transition hover:bg-[#005a4e] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending Link..." : "Send Reset Link"}
              {!loading && !success && <FaArrowRight className="text-xs" />}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <Link href="/auth/login" className="font-medium text-[#006d5f] transition hover:underline">
              Portal Login
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/" className="font-medium text-slate-600 transition hover:text-slate-900">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
