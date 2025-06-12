"use client";

import { useEffect, useState } from "react";
import { testSupabaseConnection } from "@/lib/supabase";

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    async function checkConnection() {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? "success" : "error");
    }
    checkConnection();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div
        className={`p-4 rounded ${
          connectionStatus === "loading"
            ? "bg-yellow-100"
            : connectionStatus === "success"
            ? "bg-green-100"
            : "bg-red-100"
        }`}
      >
        Status: {connectionStatus}
      </div>
    </div>
  );
}
