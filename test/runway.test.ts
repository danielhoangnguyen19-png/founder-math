import { test } from "node:test";
import assert from "node:assert/strict";
import { runway } from "../src/runway.ts";

test("Hand check: $120k cash, $10k burn, no revenue → 12 months, default dead", () => {
  const r = runway({ cash: 120_000, monthlyExpenses: 10_000, monthlyRevenue: 0 });
  assert.equal(r.monthsOfRunway, 12);
  assert.equal(r.defaultAlive, false);
});

test("Hand check: $100k cash, $10k burn → 10 months; partial last month", () => {
  assert.equal(runway({ cash: 105_000, monthlyExpenses: 10_000, monthlyRevenue: 0 }).monthsOfRunway, 10.5);
});

test("Already profitable → infinite runway, default alive at month 0", () => {
  const r = runway({ cash: 0, monthlyExpenses: 5_000, monthlyRevenue: 6_000 });
  assert.equal(r.monthsOfRunway, Infinity);
  assert.equal(r.profitableMonth, 0);
  assert.equal(r.defaultAlive, true);
});

test("Hand check: revenue doubling monthly from $1k vs $8k costs crosses at month 3", () => {
  // Burn: month 1 −7k, month 2 −6k, month 3 −4k; revenue hits $8k going into month 4.
  const r = runway({ cash: 20_000, monthlyExpenses: 8_000, monthlyRevenue: 1_000, revenueGrowth: 1 });
  assert.equal(r.profitableMonth, 3);
  assert.equal(r.defaultAlive, true);
  assert.equal(r.minCash, 3_000);
});

test("Growth too slow → default dead", () => {
  const r = runway({ cash: 50_000, monthlyExpenses: 20_000, monthlyRevenue: 2_000, revenueGrowth: 0.1 });
  assert.equal(r.defaultAlive, false);
  assert.ok(r.monthsOfRunway < 4);
});
