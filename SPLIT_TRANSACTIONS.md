# Split Transactions Feature

## Overview

Split transactions allow you to record a single transaction where one account is debited/credited against multiple other accounts. This is essential for scenarios like:

1. **EMI Payments**: One bank account debited, split between loan principal and interest expense
2. **Investment Sales**: One investment account debited, split between bank account (proceeds) and realized gains (profit)
3. **Bill Splitting**: One expense split across multiple categories
4. **Income Distribution**: One income source split across multiple accounts

## How Split Transactions Work

### Structure

- **Primary Entry**: The main account being debited or credited (line 1)
- **Split Entries**: Multiple accounts on the opposite side (lines 2, 3, 4...)
- **Balance Requirement**: Primary entry amount must equal sum of all split entries

### Example: EMI Payment

```
Primary Entry:  HDFC Bank        ₹40,000 (DEBIT)
Split Entry 1:  Home Loan        ₹30,000 (CREDIT)
Split Entry 2:  Interest Expense ₹10,000 (CREDIT)
```

## Database Schema

### New Fields Added

1. **transactions.is_split**: Boolean flag indicating split transaction
2. **transaction_entries.line_number**: Order of entries (1 = primary, 2+ = splits)

### Migration Required

Run the migration script to add these fields:

```sql
-- See src/database/split_transactions_migration.sql
```

## Components Implemented

### 1. SplitTransactionModal

- **Location**: `src/components/transactions/SplitTransactionModal.tsx`
- **Purpose**: Form for creating split transactions
- **Features**:
  - Dynamic split entry management
  - Account search with path display
  - Balance validation
  - Tag support
  - Auto-fill remaining amount

### 2. Updated TransactionListItem

- **Location**: `src/components/transactions/TransactionListItem.tsx`
- **Features**:
  - Split transaction indicator (purple icon)
  - Context-aware display (full view vs account-specific view)
  - Partial view indicator
  - Detailed split breakdown in full view

### 3. Enhanced Accounting Engine

- **Location**: `src/lib/accounting.ts`
- **New Methods**:
  - `validateSplitTransaction()`: Validates split transaction structure
  - `convertSplitToEntries()`: Converts form data to transaction entries
  - `getTransactionEntriesForAccount()`: Filters entries for account-specific views

## Types and Interfaces

### SplitEntry

```typescript
interface SplitEntry {
  id?: string;
  account_id: string;
  amount: number;
  description: string;
  entry_type: "DEBIT" | "CREDIT";
  line_number: number;
}
```

### SplitTransactionFormData

```typescript
interface SplitTransactionFormData {
  description: string;
  reference_number: string;
  transaction_date: string;
  notes: string;
  primary_entry: SplitEntry;
  split_entries: SplitEntry[];
  selected_tags: Tag[];
}
```

## Validation Rules

1. **Minimum Split Entries**: At least one split entry required
2. **Entry Types**: Primary and split entries must be opposite types (DEBIT/CREDIT)
3. **Amount Balance**: Primary entry amount = sum of split entries
4. **Positive Amounts**: All amounts must be greater than zero
5. **Unique Accounts**: No duplicate accounts in same transaction

## Display Logic

### Context-Aware Views

#### Full Transaction View

- Shows complete split breakdown
- Primary account → Split indicator with count
- Detailed entry list with amounts

#### Account-Specific View

- Shows only relevant entries for that account
- "Partial View" indicator when applicable
- Amount reflects only that account's portion

### Visual Indicators

- **Purple Icon**: Split transaction marker
- **"(Split)" Label**: In transaction type
- **"Partial View" Badge**: When viewing from account context

## Usage Examples

### 1. EMI Payment Split

```
Description: Home Loan EMI
Primary: HDFC Bank ₹20,000 (DEBIT)
Split 1: Home Loan ₹17,000 (CREDIT) - "Principal"
Split 2: Interest Expense ₹3,000 (CREDIT) - "Interest"
```

### 2. Investment Sale Split

```
Description: Sold Quant Tax MF Units
Primary: Quant Tax MF ₹8,000 (DEBIT)
Split 1: HDFC Bank ₹7,000 (CREDIT) - "Sale proceeds"
Split 2: Realized Gains ₹1,000 (CREDIT) - "Profit"
```

### 3. Expense Category Split

```
Description: Grocery & Household Shopping
Primary: HDFC Bank ₹5,000 (DEBIT)
Split 1: Food Expense ₹3,000 (CREDIT) - "Groceries"
Split 2: Household Expense ₹2,000 (CREDIT) - "Cleaning supplies"
```

## Implementation Status

### ✅ Completed

- [x] Database schema design
- [x] Type definitions
- [x] Accounting engine updates
- [x] Split transaction modal component
- [x] Transaction list item updates
- [x] Form validation
- [x] Balance checking
- [x] Integration with dashboard

### 🔄 Next Steps

1. **Apply Database Migration**: Run the SQL migration script
2. **Update Hooks**: Re-enable line_number field in queries
3. **Test Split Transactions**: Create test scenarios
4. **Account Page Integration**: Add split transaction support to account detail pages
5. **Reporting Updates**: Update reports to handle split transactions correctly

## Testing Scenarios

### Test Case 1: EMI Payment

1. Create split transaction with bank debit
2. Split between loan and interest
3. Verify balance updates correctly
4. Check display in both accounts

### Test Case 2: Investment Sale

1. Create split transaction with investment debit
2. Split between bank and realized gains
3. Verify accounting accuracy
4. Check partial view displays

### Test Case 3: Error Handling

1. Test unbalanced amounts
2. Test duplicate accounts
3. Test empty split entries
4. Verify error messages

## Migration Instructions

1. **Backup Database**: Always backup before running migrations
2. **Run Migration**: Execute `split_transactions_migration.sql`
3. **Update Code**: Remove optional flag from `is_split` in types
4. **Re-enable Fields**: Add `line_number` back to queries
5. **Test Thoroughly**: Verify all functionality works correctly

## Support for Account-Specific Views

When viewing transactions from a specific account page:

- Only relevant entries are shown
- Amount reflects only that account's portion
- "Partial View" indicator shows it's part of a larger split
- Description maintains context

This ensures users see meaningful information whether viewing all transactions or focusing on a specific account.
