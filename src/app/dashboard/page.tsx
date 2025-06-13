"use client";

import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Building2,
  LineChart,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Helper function to format Indian Rupee
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.email}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s an overview of your financial data.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Balance */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Total Balance
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatINR(1245000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Income</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatINR(420000)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Expenses</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatINR(315000)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Net Worth */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Net Worth
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {formatINR(2850000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Assets</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {formatINR(3200000)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Banknote className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Liabilities</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {formatINR(350000)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Investments */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <LineChart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Total Investments
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatINR(1850000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Stocks</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatINR(750000)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Mutual Funds</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatINR(850000)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Bonds & FDs</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatINR(250000)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Transactions
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Grocery Store</p>
                  <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                </div>
                <span className="text-red-600 font-medium">
                  -{formatINR(8532)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Salary Deposit</p>
                  <p className="text-sm text-gray-500">Yesterday, 9:00 AM</p>
                </div>
                <span className="text-green-600 font-medium">
                  +{formatINR(210000)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Electric Bill</p>
                  <p className="text-sm text-gray-500">2 days ago, 3:15 PM</p>
                </div>
                <span className="text-red-600 font-medium">
                  -{formatINR(12050)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
