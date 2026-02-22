export const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Utilities",
  "Health",
  "Entertainment",
  "Travel",
  "Rent",
  "Transfer",
  "Income",
  "Other",
] as const;

export type Category = typeof CATEGORIES[number];
