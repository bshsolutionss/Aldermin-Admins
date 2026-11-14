"use client";

export function SessionUnavailable() {
  return <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
      <p role="alert" className="text-gray-700 mb-4">Authentication service is temporarily unavailable. Your session has been preserved. Please try again.</p>
      <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-lg">Try again</button>
    </div>
  </div>;
}
