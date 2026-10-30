// Founder ownership through post-money safes and priced rounds, in percentages.
// Educational tool, not legal, tax or investment advice.

import { totalSafeOwnership, type Safe } from "./safe.ts";

export interface Holdings {
  /** Founders' share of fully diluted shares (0–1). */
  founders: number;
  /** Available (ungranted) option pool (0–1). */
  pool: number;
  /** Everyone else: investors, granted options (0–1). */
  others: number;
}

export type Round =
  | { kind: "safes"; label?: string; safes: Safe[] }
  | {
      kind: "priced";
      label?: string;
      preMoney: number;
      newMoney: number;
      /** Target available pool as a share of post-closing fully diluted, added in the pre-money. */
      targetPoolPct?: number;
    };

export interface Step extends Holdings {
  label: string;
}

/**
 * Walk ownership through a sequence of rounds. Assumes capped safes convert at their caps
 * (true whenever the priced round is comfortably above them), new money buys
 * newMoney / postMoney, and any pool top-up dilutes only existing holders.
 */
export function dilute(start: Holdings, rounds: Round[]): Step[] {
  let h = { ...start };
  const steps: Step[] = [{ label: "Start", ...h }];
  for (const r of rounds) {
    if (r.kind === "safes") {
      const keep = 1 - totalSafeOwnership(r.safes);
      h = { founders: h.founders * keep, pool: h.pool * keep, others: h.others * keep + (1 - keep) };
      steps.push({ label: r.label ?? "Safes", ...h });
      continue;
    }
    const investors = r.newMoney / (r.preMoney + r.newMoney);
    const keep = 1 - investors;
    // Pool increase x (as a multiple of pre-round shares) so pool reaches the target post-closing.
    let x = 0;
    if (r.targetPoolPct !== undefined) {
      const k = r.targetPoolPct / keep;
      x = Math.max(0, (k - h.pool) / (1 - k));
    }
    const pre = keep / (1 + x);
    h = {
      founders: h.founders * pre,
      pool: (h.pool + x) * pre,
      others: h.others * pre + investors,
    };
    steps.push({ label: r.label ?? "Priced round", ...h });
  }
  return steps;
}
