"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export default function HomePage() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Let the middleware handle redirects
    // This component will rarely be seen due to middleware redirects
  }, []);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  // Fallback content (rarely shown due to middleware)
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Personal Finance Manager
        </h1>
        <p className="text-gray-600 mb-8">
          Manage your finances with double-entry accounting
        </p>
        {user ? (
          <p className="text-blue-600">Redirecting to dashboard...</p>
        ) : (
          <p className="text-blue-600">Redirecting to login...</p>
        )}
      </div>
    </main>
  );
}
