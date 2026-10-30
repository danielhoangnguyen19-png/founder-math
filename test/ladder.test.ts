import { test } from "node:test";
import assert from "node:assert/strict";
import { ladder } from "../src/ladder.ts";

// Example: the author's own founder ladder ($1B stake at ~20% after dilution,
// 10× ARR, ~$200/yr blended ARPU) → $5B valuation, $500M ARR.
test("$1B stake at 20%, 10× ARR, $200 ARPU → $5B, $500M ARR, 2.5M customers", () => {
  const r = ladder({ targetStakeValue: 1e9, founderStake: 0.2, arrMultiple: 10, arpu: 200 });
  assert.equal(r.valuation, 5e9);
  assert.equal(r.arr, 5e8);
  assert.equal(r.customers, 2_500_000);
  assert.equal(r.customersPerMonth, null);
});

test("Hand check: $10M stake at 50%, 5× ARR, $1,000 ARPU over 24 months from 100 customers", () => {
  const r = ladder({ targetStakeValue: 1e7, founderStake: 0.5, arrMultiple: 5, arpu: 1_000, currentCustomers: 100, months: 24 });
  assert.equal(r.arr, 4e6);
  assert.equal(r.customers, 4_000);
  assert.equal(r.customersPerMonth, 163); // (4000 − 100) / 24 = 162.5 → 163
  assert.ok(Math.abs(r.monthlyGrowth! - (40 ** (1 / 24) - 1)) < 1e-12);
});
