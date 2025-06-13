"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  CreditCard,
  LineChart,
} from "lucide-react";

export default function Dashboard() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

  // Function to format currency in Indian Rupees
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Please sign in to access your dashboard.
          </p>
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
          {/* Total Balance Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Balance
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatINR(1245000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Income</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatINR(420000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Expenses</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {formatINR(315000)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Worth Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Net Worth
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatINR(1850000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-blue-600">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Assets</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {formatINR(2150000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-orange-600">
                  <CreditCard className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Liabilities</span>
                </div>
                <span className="text-sm font-semibold text-orange-600">
                  {formatINR(300000)}
                </span>
              </div>
            </div>
          </div>

          {/* Total Investments Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <LineChart className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Investments
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatINR(875000)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Stocks</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(450000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-gray-600">Mutual Funds</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(325000)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-gray-600">Bonds & FDs</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(100000)}
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
    </DashboardLayout>
  );
}
