"use client";

import { useState } from "react";
import Link from "next/link";
import { apiService } from "@/lib/api-service";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError(""); setLoading(true);
    try {
      const result = await apiService.auth.register({ name, email, password });
      if (!result.user?.id || result.user.role !== "student") throw new Error("Unable to verify account creation");
      setCreated(true); setPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create account"); }
    finally { setLoading(false); }
  };
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img src="/assets/images/aldermin-logo.png" alt="Aldermin" className="mx-auto h-16 mb-4" />
          <h1 className="text-xl font-semibold text-gray-800">Create student account</h1>
          <p className="text-sm text-gray-500 mt-2">Instructor accounts are created by administrators.</p>
        </div>
        {error && <div role="alert" className="mb-5 bg-red-50 text-red-600 text-sm text-center py-3 rounded-lg">{error}</div>}
        {created ? <div role="status" className="mb-5 bg-green-50 text-green-700 text-sm text-center py-3 rounded-lg">Account created. Sign in with your email and password.</div> : (
          <form onSubmit={submit} className="space-y-6">
            <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full name</label><input id="name" autoComplete="name" required minLength={2} maxLength={150} value={name} onChange={e => setName(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label><input id="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label><input id="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} /><p className="mt-2 text-xs text-gray-500">Use at least 8 characters.</p></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer">{loading ? "Creating account..." : "Create account"}</button>
          </form>
        )}
        <p className="mt-6 text-sm text-center text-gray-500">Already registered? <Link href="/auth/login" className="text-blue-600 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
