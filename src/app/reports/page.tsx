"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Reports
          </h1>
          <p className="mt-2 text-gray-600">
            View and analyze your financial data with comprehensive reports.
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Statement */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Income Statement
            </h2>
            <p className="text-gray-600 mb-4">
              Track your revenue and expenses over time.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Generate Report
            </button>
          </div>

          {/* Balance Sheet */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Balance Sheet
            </h2>
            <p className="text-gray-600 mb-4">
              View your assets, liabilities, and equity at a point in time.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Generate Report
            </button>
          </div>

          {/* Cash Flow */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Cash Flow Statement
            </h2>
            <p className="text-gray-600 mb-4">
              Analyze your cash inflows and outflows.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Generate Report
            </button>
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Budget vs Actual
            </h2>
            <p className="text-gray-600 mb-4">
              Compare your planned budget with actual spending.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Generate Report
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Quick Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹0</div>
              <div className="text-sm text-gray-500">Total Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">₹0</div>
              <div className="text-sm text-gray-500">Total Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹0</div>
              <div className="text-sm text-gray-500">Net Worth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₹0</div>
              <div className="text-sm text-gray-500">Monthly Savings</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
