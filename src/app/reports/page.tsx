"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BalanceSheet } from "@/components/reports/BalanceSheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Reports
          </h1>
          <p className="mt-2 text-gray-600">
            View and analyze your financial data with comprehensive reports.
          </p>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="balance-sheet" className="w-full">
          <TabsList className="grid w-full grid-cols-1 lg:w-fit">
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="balance-sheet" className="mt-6">
            <BalanceSheet />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
