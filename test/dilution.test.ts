import { test } from "node:test";
import assert from "node:assert/strict";
import { dilute } from "../src/dilution.ts";

const near = (actual: number, expected: number, tol: number) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} not within ${tol} of ${expected}`);

// YC Post-Money SAFE User Guide, Appendix II Example 1: founders hold 9,250,000 of 10,000,000
// fully diluted, 100,000 options available. Expected % are the guide's cap-table columns.
test("YC Example 1: founders 92.50% → 78.62% after safes → 51.54% after the Series A", () => {
  const steps = dilute({ founders: 0.925, pool: 0.01, others: 0.065 }, [
    { kind: "safes", safes: [{ amount: 200_000, cap: 4_000_000 }, { amount: 800_000, cap: 8_000_000 }] },
    { kind: "priced", preMoney: 15_000_000, newMoney: 5_000_000, targetPoolPct: 0.1 },
  ]);
  near(steps[1].founders, 0.7862, 0.00005); // "78.62%"
  near(steps[1].pool, 0.0085, 0.00005); // "0.85%"
  near(steps[2].founders, 0.5154, 0.0001); // "51.54%"
  near(steps[2].pool, 0.1, 0.0001); // "10.00%"
});

test("Hand check: 20% round, no pool → founders keep 80%", () => {
  const [, after] = dilute({ founders: 1, pool: 0, others: 0 }, [
    { kind: "priced", preMoney: 8_000_000, newMoney: 2_000_000 },
  ]);
  near(after.founders, 0.8, 1e-12);
  near(after.others, 0.2, 1e-12);
});

test("Shares always sum to 100%", () => {
  const steps = dilute({ founders: 0.9, pool: 0.1, others: 0 }, [
    { kind: "safes", safes: [{ amount: 500_000, cap: 10_000_000 }] },
    { kind: "priced", preMoney: 20_000_000, newMoney: 5_000_000, targetPoolPct: 0.12 },
    { kind: "priced", preMoney: 80_000_000, newMoney: 20_000_000, targetPoolPct: 0.1 },
  ]);
  for (const s of steps) near(s.founders + s.pool + s.others, 1, 1e-12);
});
