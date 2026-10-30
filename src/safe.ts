// Post-money SAFE math, following YC's "Post-Money SAFE User Guide".
// Educational tool, not legal, tax or investment advice.

export interface Safe {
  /** Investor name, for display. */
  name?: string;
  /** Purchase amount in dollars. */
  amount: number;
  /** Post-money valuation cap in dollars. Omit for an uncapped (discount-only) safe. */
  cap?: number;
  /** Discount as a fraction, e.g. 0.2 for 20%. */
  discount?: number;
}

/** Ownership a capped post-money safe buys: amount / post-money cap (Quick Start, examples 1–2). */
export function safeOwnership(safe: Safe): number {
  if (!safe.cap) throw new Error("safeOwnership needs a valuation cap");
  return safe.amount / safe.cap;
}

/** Combined minimum ownership sold across capped safes. */
export function totalSafeOwnership(safes: Safe[]): number {
  return safes.reduce((sum, s) => sum + safeOwnership(s), 0);
}

/**
 * Extra share of a priced round taken by safe holders with pro rata side letters,
 * given what new investors want (Quick Start, example 3):
 *   newInvestors / (1 - safesWithProRata) - newInvestors
 */
export function proRataAllocation(newInvestorsPct: number, safesWithProRataPct: number): number {
  return newInvestorsPct / (1 - safesWithProRataPct) - newInvestorsPct;
}

export interface PricedRound {
  /** Pre-money valuation in dollars (includes safe conversion shares and the pool increase). */
  preMoney: number;
  /** New cash raised in the round. */
  newMoney: number;
  /** Fully diluted shares before the round and before safes convert (incl. options and available pool). */
  fullyDilutedShares: number;
  /** Shares added to the pool in the pre-money. Omit to solve it from targetPoolPct. */
  poolIncrease?: number;
  /** Available (ungranted) pool shares before the round; needed to solve poolIncrease. */
  availablePoolShares?: number;
  /** Target available pool as a fraction of post-closing fully diluted shares, e.g. 0.1. */
  targetPoolPct?: number;
  /** Round the price per share to this many decimals, as YC's example does (default 4). */
  priceDecimals?: number;
}

export interface SafeConversion {
  name?: string;
  amount: number;
  /** Price per share the safe converted at. */
  price: number;
  shares: number;
  /** True if it converted at the round price (or discount) rather than its cap. */
  atRoundPrice: boolean;
}

export interface RoundResult {
  /** Company Capitalization used for cap-based conversion. */
  companyCapitalization: number;
  conversions: SafeConversion[];
  poolIncrease: number;
  pricePerShare: number;
  newMoneyShares: number;
  postFullyDilutedShares: number;
  postMoney: number;
}

const roundTo = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

/**
 * Convert post-money safes in a priced round (Appendix II, Example 1).
 * Each safe converts at the lower of its cap price (cap / Company Capitalization)
 * and its discount price (round price × (1 − discount)). Solved by fixed-point
 * iteration because the round price depends on how many shares the safes get.
 */
export function convertSafes(safes: Safe[], round: PricedRound): RoundResult {
  const decimals = round.priceDecimals ?? 4;
  const fd = round.fullyDilutedShares;
  const capped = safes.filter((s) => s.cap);
  // Company Capitalization = existing FD + safe conversion shares, where capped safes take amount/cap of it.
  const companyCapitalization = Math.floor(fd / (1 - totalSafeOwnership(capped)));

  let price = round.preMoney / companyCapitalization;
  let conversions: SafeConversion[] = [];
  let poolIncrease = round.poolIncrease ?? 0;

  for (let i = 0; i < 200; i++) {
    conversions = safes.map((s) => {
      const capPrice = s.cap ? s.cap / companyCapitalization : Infinity;
      const discountPrice = price * (1 - (s.discount ?? 0));
      const best = Math.min(capPrice, discountPrice);
      const atRoundPrice = best < capPrice;
      // Cap path matches YC: shares = Company Capitalization × ownership, rounded down.
      const shares = atRoundPrice
        ? Math.floor(s.amount / best)
        : Math.floor(companyCapitalization * safeOwnership(s));
      return { name: s.name, amount: s.amount, price: best, shares, atRoundPrice };
    });
    const preShares = fd + conversions.reduce((n, c) => n + c.shares, 0);
    if (round.poolIncrease === undefined) poolIncrease = solvePoolIncrease(preShares, round);
    const next = roundTo(round.preMoney / (preShares + poolIncrease), decimals);
    if (next === price) break;
    price = next;
  }

  const preShares = fd + conversions.reduce((n, c) => n + c.shares, 0);
  const newMoneyShares = Math.floor(round.newMoney / price);
  return {
    companyCapitalization,
    conversions,
    poolIncrease,
    pricePerShare: price,
    newMoneyShares,
    postFullyDilutedShares: preShares + poolIncrease + newMoneyShares,
    postMoney: round.preMoney + round.newMoney,
  };
}

/**
 * Pool shares to add pre-money so the available pool is targetPoolPct of post-closing FD.
 * post = (pre + inc) × postMoney / preMoney, and available + inc = target × post.
 */
function solvePoolIncrease(preShares: number, round: PricedRound): number {
  if (round.targetPoolPct === undefined) return 0;
  const k = (round.targetPoolPct * (round.preMoney + round.newMoney)) / round.preMoney;
  const inc = (k * preShares - (round.availablePoolShares ?? 0)) / (1 - k);
  return Math.max(0, Math.round(inc));
}

export interface ExitPayout {
  name?: string;
  conversionShares: number;
  /** What the shares would be worth if the safe converts. */
  asConverted: number;
  /** The safe gets the greater of its purchase amount and the as-converted value. */
  payout: number;
  converts: boolean;
}

/**
 * Safe payouts in an acquisition before any priced round (Appendix II, Example 1, Q3–Q4).
 * Liquidity Capitalization = outstanding shares / (1 − total safe ownership).
 */
export function safeExit(
  safes: Safe[],
  outstandingShares: number,
  exitValue: number,
  priceDecimals = 4,
): { liquidityCapitalization: number; pricePerShare: number; payouts: ExitPayout[] } {
  const liquidityCapitalization = outstandingShares / (1 - totalSafeOwnership(safes));
  const pricePerShare = roundTo(exitValue / Math.floor(liquidityCapitalization), priceDecimals);
  const payouts = safes.map((s) => {
    const conversionShares = Math.floor(s.amount / (s.cap! / liquidityCapitalization));
    const asConverted = conversionShares * pricePerShare;
    const converts = asConverted > s.amount;
    return { name: s.name, conversionShares, asConverted, payout: converts ? asConverted : s.amount, converts };
  });
  return { liquidityCapitalization: Math.floor(liquidityCapitalization), pricePerShare, payouts };
}
