// Runway and "default alive" (Paul Graham, "Default Alive or Default Dead?", 2015).
// Educational tool, not legal, tax or investment advice.

export interface RunwayInput {
  /** Cash in the bank today. */
  cash: number;
  /** Monthly expenses today. */
  monthlyExpenses: number;
  /** Monthly revenue today. */
  monthlyRevenue: number;
  /** Month-over-month revenue growth as a fraction, e.g. 0.05 for 5%. */
  revenueGrowth?: number;
  /** Month-over-month expense growth as a fraction. */
  expenseGrowth?: number;
  /** Stop simulating after this many months (default 120). */
  horizonMonths?: number;
}

export interface RunwayResult {
  /** Months until cash runs out; Infinity if it never does within the horizon. */
  monthsOfRunway: number;
  /** Month revenue first covers expenses, or null if it doesn't before cash runs out. */
  profitableMonth: number | null;
  /** Reaches profitability on current trends before running out of money. */
  defaultAlive: boolean;
  /** Lowest cash balance reached. */
  minCash: number;
}

/** Simulate month by month: cash += revenue − expenses, then both grow. */
export function runway(input: RunwayInput): RunwayResult {
  const horizon = input.horizonMonths ?? 120;
  let cash = input.cash;
  let revenue = input.monthlyRevenue;
  let expenses = input.monthlyExpenses;
  let minCash = cash;
  let profitableMonth: number | null = revenue >= expenses ? 0 : null;

  for (let month = 1; month <= horizon; month++) {
    const net = revenue - expenses;
    if (net < 0 && cash + net < 0) {
      // Runs out partway through this month.
      return { monthsOfRunway: month - 1 + cash / -net, profitableMonth, defaultAlive: false, minCash: 0 };
    }
    cash += net;
    minCash = Math.min(minCash, cash);
    revenue *= 1 + (input.revenueGrowth ?? 0);
    expenses *= 1 + (input.expenseGrowth ?? 0);
    if (profitableMonth === null && revenue >= expenses) profitableMonth = month;
  }
  return { monthsOfRunway: Infinity, profitableMonth, defaultAlive: profitableMonth !== null, minCash };
}
