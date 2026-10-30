#!/usr/bin/env node
// founder-math CLI. Run `founder-math help` for usage.
import { safeOwnership, totalSafeOwnership, runway, ladder } from "./index.ts";

const USAGE = `founder-math: startup finance math (educational, not advice)

  founder-math safe   --amount 500k --cap 6.7m [--amount 250k --cap 10m ...]
  founder-math runway --cash 400k --expenses 40k --revenue 8k [--growth 10%]
  founder-math ladder --stake-value 1b --stake 20% --multiple 10 --arpu 200 [--customers 50 --months 24]

Numbers accept k, m, b suffixes and % for fractions.`;

/** "500k" → 500000, "6.7m" → 6700000, "20%" → 0.2 */
function parseNumber(raw: string): number {
  const m = /^\$?([\d,.]+)\s*([kmb%]?)$/i.exec(raw.trim());
  if (!m) throw new Error(`Not a number: ${raw}`);
  const n = Number(m[1].replace(/,/g, ""));
  const scale = { "": 1, k: 1e3, m: 1e6, b: 1e9, "%": 0.01 }[m[2].toLowerCase() as "" | "k" | "m" | "b" | "%"];
  return n * scale;
}

function parseArgs(argv: string[]): Map<string, number[]> {
  const args = new Map<string, number[]>();
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    if (argv[i + 1] === undefined) throw new Error(`Missing value for --${key}`);
    args.set(key, [...(args.get(key) ?? []), parseNumber(argv[i + 1])]);
  }
  return args;
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pct = (n: number) => (n * 100).toFixed(2) + "%";

function main(argv: string[]): void {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "help" || cmd === "--help") return console.log(USAGE);
  const a = parseArgs(rest);
  const one = (k: string, fallback?: number) => {
    const v = a.get(k)?.[0] ?? fallback;
    if (v === undefined) throw new Error(`Missing --${k}`);
    return v;
  };

  if (cmd === "safe") {
    const amounts = a.get("amount") ?? [];
    const caps = a.get("cap") ?? [];
    if (!amounts.length || amounts.length !== caps.length) throw new Error("Give one --cap per --amount");
    const safes = amounts.map((amount, i) => ({ amount, cap: caps[i] }));
    safes.forEach((s) => console.log(`${usd(s.amount)} at ${usd(s.cap)} post-money cap → ${pct(safeOwnership(s))}`));
    const total = totalSafeOwnership(safes);
    console.log(`Total sold: ${pct(total)} (at least; more if the next round prices below the caps)`);
    console.log(`Founders + existing holders keep: ${pct(1 - total)}`);
  } else if (cmd === "runway") {
    const r = runway({
      cash: one("cash"),
      monthlyExpenses: one("expenses"),
      monthlyRevenue: one("revenue", 0),
      revenueGrowth: one("growth", 0),
    });
    console.log(`Runway: ${r.monthsOfRunway === Infinity ? "never runs out (10-year horizon)" : r.monthsOfRunway.toFixed(1) + " months"}`);
    console.log(r.defaultAlive ? `Default alive: profitable in month ${r.profitableMonth}` : "Default dead: cash runs out before revenue covers costs");
  } else if (cmd === "ladder") {
    const r = ladder({
      targetStakeValue: one("stake-value"),
      founderStake: one("stake"),
      arrMultiple: one("multiple"),
      arpu: one("arpu"),
      currentCustomers: a.get("customers")?.[0],
      months: a.get("months")?.[0],
    });
    console.log(`Company valuation: ${usd(r.valuation)}`);
    console.log(`ARR needed:        ${usd(r.arr)}`);
    console.log(`Customers needed:  ${r.customers.toLocaleString("en-US")}`);
    if (r.customersPerMonth !== null) console.log(`Net new / month:   ${r.customersPerMonth.toLocaleString("en-US")}`);
    if (r.monthlyGrowth !== null) console.log(`Monthly growth:    ${pct(r.monthlyGrowth)}`);
  } else {
    throw new Error(`Unknown command: ${cmd}\n\n${USAGE}`);
  }
}

try {
  main(process.argv.slice(2));
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
