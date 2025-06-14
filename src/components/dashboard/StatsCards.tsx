"use client";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  CreditCard,
  LineChart,
} from "lucide-react";
import { formatINR } from "@/utils/formatters";

interface StatsCardsProps {
  totalBalance?: number;
  income?: number;
  expenses?: number;
  netWorth?: number;
  assets?: number;
  liabilities?: number;
  totalInvestments?: number;
  stocks?: number;
  mutualFunds?: number;
  bondsAndFDs?: number;
}

export const StatsCards = ({
  totalBalance = 1245000,
  income = 420000,
  expenses = 315000,
  netWorth = 1850000,
  assets = 2150000,
  liabilities = 300000,
  totalInvestments = 875000,
  stocks = 450000,
  mutualFunds = 325000,
  bondsAndFDs = 100000,
}: StatsCardsProps) => {
  return (
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
                {formatINR(totalBalance)}
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
              {formatINR(income)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center text-red-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Expenses</span>
            </div>
            <span className="text-sm font-semibold text-red-600">
              {formatINR(expenses)}
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
                {formatINR(netWorth)}
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
              {formatINR(assets)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center text-orange-600">
              <CreditCard className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Liabilities</span>
            </div>
            <span className="text-sm font-semibold text-orange-600">
              {formatINR(liabilities)}
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
                {formatINR(totalInvestments)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Stocks</span>
            <span className="font-semibold text-gray-900">
              {formatINR(stocks)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1 text-sm">
            <span className="text-gray-600">Mutual Funds</span>
            <span className="font-semibold text-gray-900">
              {formatINR(mutualFunds)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1 text-sm">
            <span className="text-gray-600">Bonds & FDs</span>
            <span className="font-semibold text-gray-900">
              {formatINR(bondsAndFDs)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
