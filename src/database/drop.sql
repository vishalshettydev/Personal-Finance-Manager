-- Drop dependent objects first
DROP TABLE IF EXISTS 
  public.transaction_tags,
  public.tags,
  public.transaction_entries,
  public.transactions,
  public.budget_categories,
  public.budgets,
  public.account_balance_snapshots,
  public.accounts,
  public.account_types,
  public.account_prices
CASCADE;

-- Then drop the enum
DROP TYPE IF EXISTS entry_type_enum CASCADE;
