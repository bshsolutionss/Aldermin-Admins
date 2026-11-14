"use client";

import { useState } from "react";
import Link from "next/link";
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
      setError(
        err instanceof Error ? err.message : "Failed to send password reset link"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/images/aldermin-logo.png"
            alt="Aldermin"
            className="mx-auto h-16 mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 bg-red-50 text-red-600 text-sm text-center py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 bg-green-50 text-green-700 text-sm text-center py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              disabled={loading || !!success}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            {loading ? "Sending Link..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center text-sm">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:underline"
          >
            Portal Login
          </Link>
        <span className="mx-3 text-gray-300">|</span>
        <Link href="/" className="text-blue-600 hover:underline">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
