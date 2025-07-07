"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { AccountingEngine } from "@/lib/accounting";
import { Account, Tag } from "@/lib/types";

interface AddTransactionModalProps {
  userId: string;
  accounts: Account[];
  tags: Tag[];
  onTransactionAdded: () => void;
  onAccountsRefresh: () => void;
  onTagsRefresh: () => void;
}

interface TransactionFormData {
  description: string;
  reference_number: string;
  transaction_date: string;
  notes: string;
  amount: string;
  from_account_id: string;
  to_account_id: string;
  selected_tags: Tag[];
}

export function AddTransactionModal({
  userId,
  accounts,
  tags,
  onTransactionAdded,
  onAccountsRefresh,
  onTagsRefresh,
}: AddTransactionModalProps) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("simple");

  const [formData, setFormData] = useState<TransactionFormData>({
    description: "",
    reference_number: "",
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
    amount: "",
    from_account_id: "",
    to_account_id: "",
    selected_tags: [],
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        description: "",
        reference_number: "",
        transaction_date: new Date().toISOString().split("T")[0],
        notes: "",
        amount: "",
        from_account_id: "",
        to_account_id: "",
        selected_tags: [],
      });
      setActiveTab("simple");
    }
  }, [isOpen]);

  // Filter accounts by category
  const getAccountsByCategory = (category: string) => {
    return accounts.filter(
      (account) =>
        account.account_type?.category === category &&
        !account.is_placeholder &&
        account.is_active
    );
  };

  const assetAccounts = getAccountsByCategory("ASSET");
  const liabilityAccounts = getAccountsByCategory("LIABILITY");
  const incomeAccounts = getAccountsByCategory("INCOME");
  const expenseAccounts = getAccountsByCategory("EXPENSE");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!formData.from_account_id || !formData.to_account_id) {
      toast.error("Please select both accounts");
      return;
    }

    if (formData.from_account_id === formData.to_account_id) {
      toast.error("From and To accounts must be different");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create transaction entries
      const entries = [
        {
          account_id: formData.from_account_id,
          amount: amount,
          entry_side: "CREDIT" as const,
          quantity: 1,
          price: amount,
          description: formData.description,
          line_number: 1,
        },
        {
          account_id: formData.to_account_id,
          amount: amount,
          entry_side: "DEBIT" as const,
          quantity: 1,
          price: amount,
          description: formData.description,
          line_number: 2,
        },
      ];

      // Validate transaction
      if (!AccountingEngine.validateTransaction(entries)) {
        toast.error("Transaction entries are not balanced");
        return;
      }

      // Calculate total amount
      const totalAmount = AccountingEngine.calculateTransactionTotal(entries);

      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description: formData.description,
          reference_number: formData.reference_number || null,
          transaction_date: formData.transaction_date,
          total_amount: totalAmount,
          notes: formData.notes || null,
          is_split: false,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Insert transaction entries
      const entriesWithTransactionId = entries.map((entry) => ({
        ...entry,
        transaction_id: transaction.id,
      }));

      const { error: entriesError } = await supabase
        .from("transaction_entries")
        .insert(entriesWithTransactionId);

      if (entriesError) throw entriesError;

      // Insert tags if any
      if (formData.selected_tags.length > 0) {
        const tagEntries = formData.selected_tags.map((tag) => ({
          transaction_id: transaction.id,
          tag_id: tag.id,
        }));

        const { error: tagsError } = await supabase
          .from("transaction_tags")
          .insert(tagEntries);

        if (tagsError) throw tagsError;
      }

      toast.success("Transaction added successfully!");
      setIsOpen(false);
      onTransactionAdded();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Error adding transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Add New Transaction
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Transfer</TabsTrigger>
            <TabsTrigger value="split">Split Transaction</TabsTrigger>
          </TabsList>

          <TabsContent value="simple">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Transaction description"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Account Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_account">From Account *</Label>
                  <Select
                    value={formData.from_account_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, from_account_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>
                        Select source account
                      </SelectItem>
                      {assetAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                      {liabilityAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="to_account">To Account *</Label>
                  <Select
                    value={formData.to_account_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, to_account_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>
                        Select destination account
                      </SelectItem>
                      {assetAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                      {liabilityAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                      {incomeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                      {expenseAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reference_number: e.target.value,
                      })
                    }
                    placeholder="Optional reference"
                  />
                </div>
                <div>
                  <Label htmlFor="transaction_date">Date *</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Transaction"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="split">
            <div className="text-center py-8">
              <p className="text-gray-500">
                Split transaction feature coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}