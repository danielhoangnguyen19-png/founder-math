// Every expected value below is copied from YC's "Post-Money SAFE User Guide"
// (ycombinator.com/documents). Quoted strings are the guide's own text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { safeOwnership, totalSafeOwnership, proRataAllocation, convertSafes, safeExit } from "../src/safe.ts";

const near = (actual: number, expected: number, tol: number) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} not within ${tol} of ${expected}`);

test("Quick Start 1: $500k / $800k / $1M on a $6.7M post-money cap", () => {
  near(safeOwnership({ amount: 500_000, cap: 6_700_000 }), 0.075, 0.0005); // "~7.5%"
  // The guide rounds these to whole percents: 0.8/6.7 = 11.94%, 1/6.7 = 14.93%.
  near(safeOwnership({ amount: 800_000, cap: 6_700_000 }), 0.12, 0.005); // "~12%"
  near(safeOwnership({ amount: 1_000_000, cap: 6_700_000 }), 0.15, 0.005); // "~15%"
});

test("Quick Start 2: $500k on $5.5M and $500k on $8.3M ≈ 15% sold", () => {
  near(totalSafeOwnership([{ amount: 500_000, cap: 5_500_000 }, { amount: 500_000, cap: 8_300_000 }]), 0.15, 0.002);
});

test("Quick Start 3: pro rata allocation = 25% / (100% − 15%) − 25% = 4.41%", () => {
  near(proRataAllocation(0.25, 0.15), 0.0441, 0.00005);
});

test("Q&A D2: raising the whole cap leaves founders 0%", () => {
  assert.equal(safeOwnership({ amount: 500_000, cap: 5_000_000 }), 0.1);
  assert.equal(safeOwnership({ amount: 2_500_000, cap: 5_000_000 }), 0.5);
  assert.equal(safeOwnership({ amount: 5_000_000, cap: 5_000_000 }), 1);
});

const abcSafes = [
  { name: "Investor A", amount: 200_000, cap: 4_000_000 },
  { name: "Investor B", amount: 800_000, cap: 8_000_000 },
];

test("Appendix II Example 1 Q1: minimum 15% sold (5% + 10%)", () => {
  assert.equal(safeOwnership(abcSafes[0]), 0.05);
  assert.equal(safeOwnership(abcSafes[1]), 0.1);
  near(totalSafeOwnership(abcSafes), 0.15, 1e-12);
});

test("Appendix II Example 1 Q2: $5M Series A at $15M pre, pool increase 1,695,000", () => {
  const r = convertSafes(abcSafes, {
    preMoney: 15_000_000,
    newMoney: 5_000_000,
    fullyDilutedShares: 10_000_000,
    poolIncrease: 1_695_000,
  });
  assert.equal(r.companyCapitalization, 11_764_705); // "= 11,764,705"
  assert.equal(r.conversions[0].shares, 588_235); // Series A-1
  assert.equal(r.conversions[1].shares, 1_176_470); // Series A-2
  near(r.conversions[0].price, 0.34, 0.00005); // "$0.3400"
  near(r.conversions[1].price, 0.68, 0.00005); // "$0.6800"
  assert.equal(r.pricePerShare, 1.1144); // "$1.1144"
  assert.equal(r.newMoneyShares, 4_486_719); // "4,486,719 shares"
  assert.equal(r.postMoney, 20_000_000);
  // Investor B's pro rata: "4,486,719 * 10% = 448,671 shares"
  assert.equal(Math.floor(r.newMoneyShares * 0.1), 448_671);
});

test("Appendix II Example 1 Q2: solving the pool gives ≈ YC's rounded 1,695,000", () => {
  const r = convertSafes(abcSafes, {
    preMoney: 15_000_000,
    newMoney: 5_000_000,
    fullyDilutedShares: 10_000_000,
    availablePoolShares: 100_000,
    targetPoolPct: 0.1,
  });
  near(r.poolIncrease, 1_695_000, 1_000); // the guide rounds to the nearest thousand
  near(r.pricePerShare, 1.1144, 0.0001);
});

test("A safe converts at the round price when the round is below its cap", () => {
  const r = convertSafes([{ amount: 1_000_000, cap: 10_000_000 }], {
    preMoney: 4_000_000,
    newMoney: 1_000_000,
    fullyDilutedShares: 9_000_000,
    poolIncrease: 0,
  });
  assert.equal(r.conversions[0].atRoundPrice, true);
  near(r.conversions[0].price, r.pricePerShare, 1e-9);
});

test("Appendix II Example 1 Q3: $10M acquisition, both safes convert", () => {
  const r = safeExit(abcSafes, 9_550_000, 10_000_000);
  near(r.liquidityCapitalization, 11_235_293, 1); // "11,235,293" (9,550,000 / 85%)
  assert.equal(r.payouts[0].conversionShares, 561_764); // "= 561,764"
  assert.equal(r.payouts[1].conversionShares, 1_123_529); // "= 1,123,529"
  assert.equal(r.pricePerShare, 0.8901); // "$0.8901"
  near(r.payouts[0].payout, 500_026, 1); // "$500,026"
  near(r.payouts[1].payout, 1_000_053, 1); // "$1,000,053"
  assert.ok(r.payouts.every((p) => p.converts));
});

test("Appendix II Example 1 Q4: $3M acquisition, neither safe converts", () => {
  const r = safeExit(abcSafes, 9_550_000, 3_000_000);
  assert.equal(r.pricePerShare, 0.267); // "$0.2670"
  near(r.payouts[0].asConverted, 149_991, 1); // "$149,991"
  near(r.payouts[1].asConverted, 299_982, 1); // "$299,982"
  assert.equal(r.payouts[0].payout, 200_000);
  assert.equal(r.payouts[1].payout, 800_000);
});
