export type OwnerScope = "joint" | "sim" | "lucia";

export type AccountType = "checking" | "savings" | "loan" | "credit" | "investment" | "kiwisaver";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  owner_scope: OwnerScope;
  current_balance: number;
  available_balance: number | null;
  is_manual: boolean;
  is_hidden: boolean;
};

export type Category = {
  id: string;
  key: string;
  name: string;
  emoji: string;
  color: string;
  is_budgetable: boolean;
  is_transfer: boolean;
  is_sinking_fund: boolean;
  monthly_limit: number | null;
};

export type RecurringBill = {
  id: string;
  name: string;
  icon: string;
  category_id: string | null;
  expected_amount: number;
  frequency_months: number;
  next_due_on: string;
  last_paid_on: string | null;
  owner_scope: OwnerScope;
  is_active: boolean;
};

export type Transaction = {
  id: string;
  account_id: string;
  merchant_name: string | null;
  description: string | null;
  amount: number;
  occurred_on: string;
  category_id: string | null;
  is_manual: boolean;
};

export type Goal = {
  id: string;
  name: string;
  icon: string;
  target_amount: number;
  target_date: string | null;
  owner_scope: OwnerScope;
  linked_account_id: string | null;
  manual_saved_amount: number | null;
  archived_at: string | null;
};

export type Security = {
  id: string;
  ticker_symbol: string | null;
  name: string;
  asset_class: string;
};

export type Holding = {
  id: string;
  account_id: string;
  security_id: string;
  quantity: number;
  cost_basis: number | null;
  current_value: number;
  security: Security | null;
};

export type Mortgage = {
  id: string;
  owner_scope: OwnerScope;
  lender_name: string | null;
  current_balance: number;
  annual_rate: number;
  monthly_payment: number;
  original_loan_amount: number | null;
  origination_date: string | null;
  linked_account_id: string | null;
};
