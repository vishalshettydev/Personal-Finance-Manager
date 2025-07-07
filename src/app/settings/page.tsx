"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 gap-6">
          {/* Account Settings */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Account Settings
            </h2>
            <p className="text-gray-600 mb-4">
              Manage your account information and security settings.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Update Profile
            </button>
          </div>

          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Notifications
            </h2>
            <p className="text-gray-600 mb-4">
              Configure how you receive notifications about your finances.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Manage Notifications
            </button>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Data & Privacy
            </h2>
            <p className="text-gray-600 mb-4">
              Control your data and privacy settings.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Privacy Settings
            </button>
          </div>

          {/* Export Data */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Export Data
            </h2>
            <p className="text-gray-600 mb-4">
              Download your financial data in various formats.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}