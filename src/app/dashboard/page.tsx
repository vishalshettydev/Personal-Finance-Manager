"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Dashboard() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    if (!user && loading) {
      initialize();
    }
  }, [user, loading, initialize]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Balance</h3>
            <p className="text-3xl font-bold text-green-600">$12,450.00</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Monthly Income
            </h3>
            <p className="text-3xl font-bold text-blue-600">$4,200.00</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Monthly Expenses
            </h3>
            <p className="text-3xl font-bold text-red-600">$3,150.00</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Savings</h3>
            <p className="text-3xl font-bold text-purple-600">$8,300.00</p>
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
                <span className="text-red-600 font-medium">-$85.32</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Salary Deposit</p>
                  <p className="text-sm text-gray-500">Yesterday, 9:00 AM</p>
                </div>
                <span className="text-green-600 font-medium">+$2,100.00</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Electric Bill</p>
                  <p className="text-sm text-gray-500">2 days ago, 3:15 PM</p>
                </div>
                <span className="text-red-600 font-medium">-$120.50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
