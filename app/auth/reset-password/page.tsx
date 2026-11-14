"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/lib/api-service";

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const [tokenOverride, setToken] = useState<string | null>(null);
  const token = tokenOverride ?? searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError("Reset token is required");
      return;
    }

    if (!password) {
      setError("New password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await apiService.auth.resetPassword({
        token: token.trim(),
        newPassword: password,
      });

      setSuccess(res.message || "Password has been successfully reset!");

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
      {/* Logo */}
      <div className="text-center mb-6">
        <img
          src="/assets/images/aldermin-logo.png"
          alt="Aldermin"
          className="mx-auto h-16 mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-800">
          Reset Password
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter your reset token and new password
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm text-center py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 text-green-700 text-sm text-center py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reset Token
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste reset token here"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          {loading ? "Updating Password..." : "Reset Password"}
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
