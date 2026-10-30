// Reverse ARR ladder: start from the outcome you want and work back to
// the revenue and customers it takes. Educational tool, not investment advice.

export interface LadderInput {
  /** What you want your stake to be worth, e.g. 1e9. */
  targetStakeValue: number;
  /** Your ownership at exit after dilution, e.g. 0.2. */
  founderStake: number;
  /** Valuation as a multiple of ARR, e.g. 10. */
  arrMultiple: number;
  /** Average revenue per customer per year. */
  arpu: number;
  /** Customers today. */
  currentCustomers?: number;
  /** Months to get there. */
  months?: number;
}

export interface LadderResult {
  valuation: number;
  arr: number;
  customers: number;
  /** Net new customers needed per month, if months was given. */
  customersPerMonth: number | null;
  /** Compound monthly customer growth needed, if months and currentCustomers > 0 were given. */
  monthlyGrowth: number | null;
}

export function ladder(input: LadderInput): LadderResult {
  const valuation = input.targetStakeValue / input.founderStake;
  const arr = valuation / input.arrMultiple;
  const customers = Math.ceil(arr / input.arpu);
  const current = input.currentCustomers ?? 0;
  const months = input.months;
  return {
    valuation,
    arr,
    customers,
    customersPerMonth: months ? Math.ceil((customers - current) / months) : null,
    monthlyGrowth: months && current > 0 ? (customers / current) ** (1 / months) - 1 : null,
  };
}
