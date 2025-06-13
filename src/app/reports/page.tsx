"use client";

export default function ReportsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Financial Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Income Statement</h2>
          <p>Coming soon...</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Balance Sheet</h2>
          <p>Coming soon...</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Cash Flow</h2>
          <p>Coming soon...</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Budget vs Actual</h2>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
