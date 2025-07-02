-- Migration: Add Split Transaction Support
-- This migration adds the necessary fields to support split transactions

-- 1. Add is_split field to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false;

-- 2. Add line_number field to transaction_entries table
ALTER TABLE public.transaction_entries 
ADD COLUMN IF NOT EXISTS line_number INTEGER DEFAULT 1;

-- 3. Create index for better query performance on split transactions
CREATE INDEX IF NOT EXISTS idx_transactions_is_split 
ON public.transactions(is_split) 
WHERE is_split = true;

-- 4. Create index for line_number ordering
CREATE INDEX IF NOT EXISTS idx_transaction_entries_line_number 
ON public.transaction_entries(transaction_id, line_number);

-- 5. Add comment to document the fields
COMMENT ON COLUMN public.transactions.is_split IS 'Indicates if this is a split transaction (one primary entry split into multiple secondary entries)';
COMMENT ON COLUMN public.transaction_entries.line_number IS 'Order of entries in a transaction (1 = primary entry, 2+ = split entries)'; 