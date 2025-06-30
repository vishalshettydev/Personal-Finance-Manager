"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  user_id: string | null;
  name: string;
  account_types?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

interface AccountPrice {
  id: string;
  user_id: string | null;
  account_id: string;
  price: number;
  date: string;
  notes: string | null;
  created_at: string | null;
}

interface AccountPriceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onPriceUpdated: () => void;
}

export function AccountPriceModal({
  isOpen,
  onOpenChange,
  account,
  onPriceUpdated,
}: AccountPriceModalProps) {
  const { user } = useAuthStore();
  const [prices, setPrices] = useState<AccountPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [priceForm, setPriceForm] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Format currency in Indian Rupees
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch existing prices for the account
  const fetchAccountPrices = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("account_prices")
        .select("*")
        .eq("account_id", account.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error("Error fetching account prices:", error);
      toast.error("Error loading price history");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if transaction exists for the same date
  const checkExistingTransaction = async (date: string) => {
    if (!account || !user) return null;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          transaction_entries!inner (
            id,
            account_id,
            price,
            entry_type
          )
        `
        )
        .eq("user_id", user.id)
        .eq("transaction_date", date)
        .eq("transaction_entries.account_id", account.id)
        .eq("transaction_entries.entry_type", "BUY")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error checking existing transaction:", error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !user) return;

    const price = parseFloat(priceForm.price);
    if (price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if a transaction exists for the same date
      const existingTransaction = await checkExistingTransaction(
        priceForm.date
      );

      if (existingTransaction) {
        // Update existing transaction entry
        const { error: updateError } = await supabase
          .from("transaction_entries")
          .update({
            price: price,
            amount: price,
            description: `Price update for ${account.name}`,
          })
          .eq("transaction_id", existingTransaction.id)
          .eq("account_id", account.id);

        if (updateError) throw updateError;

        // Update the transaction total
        const { error: transactionUpdateError } = await supabase
          .from("transactions")
          .update({
            total_amount: price,
            description: `Price update for ${account.name}`,
            notes: priceForm.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTransaction.id);

        if (transactionUpdateError) throw transactionUpdateError;

        toast.success("Transaction updated with new price!");
      } else {
        // Create new transaction for price update
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            reference_number: `PRICE-${account.id.substring(0, 8)}`,
            description: `Price update for ${account.name}`,
            transaction_date: priceForm.date,
            total_amount: price,
            notes: priceForm.notes || null,
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Create transaction entry
        const { error: entryError } = await supabase
          .from("transaction_entries")
          .insert({
            transaction_id: transaction.id,
            account_id: account.id,
            quantity: 1,
            price: price,
            entry_type: "BUY",
            amount: price,
            description: `Price update for ${account.name}`,
          });

        if (entryError) throw entryError;
        toast.success("New price transaction created!");
      }

      // Add or update account price record
      const existingPrice = prices.find((p) => p.date === priceForm.date);

      if (existingPrice) {
        const { error: priceUpdateError } = await supabase
          .from("account_prices")
          .update({
            price: price,
            notes: priceForm.notes || null,
          })
          .eq("id", existingPrice.id);

        if (priceUpdateError) throw priceUpdateError;
      } else {
        const { error: priceInsertError } = await supabase
          .from("account_prices")
          .insert({
            user_id: user.id,
            account_id: account.id,
            price: price,
            date: priceForm.date,
            notes: priceForm.notes || null,
          });

        if (priceInsertError) throw priceInsertError;
      }

      // Reset form and refresh data
      setPriceForm({
        price: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      await fetchAccountPrices();
      onPriceUpdated();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Error updating price. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect to fetch prices when account changes
  useEffect(() => {
    if (isOpen && account) {
      fetchAccountPrices();
    }
  }, [isOpen, account]);

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Manage Prices - {account.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Add new prices or view price history for this account. If a
            transaction exists for the same date, it will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Price Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Price (₹) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={priceForm.price}
                      onChange={(e) =>
                        setPriceForm({ ...priceForm, price: e.target.value })
                      }
                      placeholder="0.00"
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={priceForm.date}
                      onChange={(e) =>
                        setPriceForm({ ...priceForm, date: e.target.value })
                      }
                      className="h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={priceForm.notes}
                    onChange={(e) =>
                      setPriceForm({ ...priceForm, notes: e.target.value })
                    }
                    placeholder="Add any notes about this price update..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </div>
                    ) : (
                      "Add Price"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Price History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Price History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading prices...</span>
                </div>
              ) : prices.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No price history found</p>
                  <p className="text-sm text-gray-400">
                    Add a price above to start tracking
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {prices.map((price) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-green-600">
                            {formatINR(price.price)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(price.date).toLocaleDateString("en-IN")}
                          </Badge>
                        </div>
                        {price.notes && (
                          <p className="text-xs text-gray-600 mt-1">
                            {price.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
