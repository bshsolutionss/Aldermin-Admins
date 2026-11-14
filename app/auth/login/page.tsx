"use client";

import { useState } from "react";
import Link from "next/link";
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
      setError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img
            src="/assets/images/aldermin-logo.png"
            alt="Aldermin"
            className="mx-auto h-16 mb-4"
          />
          <p className="text-sm text-gray-500 mt-2">
            Please sign in to continue
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 bg-red-50 text-red-600 text-sm text-center py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mb-5 bg-green-50 text-green-700 text-sm text-center py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSuccess(""); }}
              placeholder="Enter email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setSuccess(""); }}
              placeholder="Enter password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-800 transition"
            >
              Admin Portal
            </Link>
            <Link
              href="/auth/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-gray-500">
          New student? <Link href="/auth/register" className="text-blue-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
