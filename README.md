# founder-math

**Startup finance math you can check.** Post-money SAFEs, dilution, runway and "how big does this have to get" in one small, zero-dependency TypeScript library, with a CLI and a [web calculator](https://danielhoangnguyen19-png.github.io/founder-math/).

Every SAFE number is tested against the post-money worked examples in YC's [Post-Money SAFE User Guide](https://www.ycombinator.com/documents). If our math and YC's disagree, that's a failing test.

> Educational tool, not legal, tax or investment advice. Talk to a lawyer before you sign anything.

## Why I built this

I'm a student founder raising for the first time. Every SAFE spreadsheet I found was either a black box or quietly wrong about how post-money SAFEs stack. So I wrote the math down as code and pinned it to YC's own examples, one test at a time. If it helped me, it'll probably help you.

## 30-second tour

```bash
npx github:danielhoangnguyen19-png/founder-math safe --amount 200k --cap 4m --amount 800k --cap 8m
```
```
$200,000 at $4,000,000 post-money cap → 5.00%
$800,000 at $8,000,000 post-money cap → 10.00%
Total sold: 15.00% (at least; more if the next round prices below the caps)
Founders + existing holders keep: 85.00%
```

```bash
npx github:danielhoangnguyen19-png/founder-math runway --cash 400k --expenses 40k --revenue 8k --growth 10%
# Default alive: profitable in month 17

npx github:danielhoangnguyen19-png/founder-math ladder --stake-value 1b --stake 20% --multiple 10 --arpu 200
# Company valuation $5B → ARR needed $500M → 2,500,000 customers
```

As a library:

```ts
import { convertSafes } from "founder-math";

// YC SAFE User Guide, Appendix II Example 1
const round = convertSafes(
  [{ amount: 200_000, cap: 4_000_000 }, { amount: 800_000, cap: 8_000_000 }],
  { preMoney: 15_000_000, newMoney: 5_000_000, fullyDilutedShares: 10_000_000, poolIncrease: 1_695_000 },
);
round.pricePerShare;  // 1.1144, same as the guide
round.newMoneyShares; // 4,486,719, same as the guide
// Or pass { availablePoolShares, targetPoolPct } to solve the pool increase (1,694,570 here; YC rounds to 1,695,000).
```

## What's inside

| Module | What it answers | Checked against |
|---|---|---|
| `safe` | What % did my SAFEs sell? How do they convert in a priced round (cap vs. discount)? What do SAFE holders get in an early acquisition? Pro rata dilution | YC Post-Money SAFE User Guide: Quick Start 1–3, Q&A D2, Appendix II Example 1 (Q1–Q4) |
| `dilution` | Founder % through SAFEs → seed → Series A, with option-pool top-ups | YC Example 1 cap tables (92.50% → 78.62% → 51.54%) |
| `runway` | Months of runway; am I [default alive](https://paulgraham.com/aord.html)? | Hand-worked cases in `test/` |
| `ladder` | Work back from "my stake is worth $X" to the valuation, ARR, customers and monthly growth it takes | Hand-worked cases in `test/` |

### YC's numbers vs. ours

| YC guide (Appendix II, Example 1) | Guide says | founder-math |
|---|---|---|
| Company Capitalization | 11,764,705 | 11,764,705 |
| Investor A / B conversion shares | 588,235 / 1,176,470 | 588,235 / 1,176,470 |
| Safe prices A / B | $0.3400 / $0.6800 | $0.3400 / $0.6800 |
| Series A price per share | $1.1144 | $1.1144 |
| Series A shares sold | 4,486,719 | 4,486,719 |
| $10M exit: A / B payout | $500,026 / $1,000,053 | $500,026 / $1,000,053 |
| $3M exit: A / B as-converted | $149,991 / $299,982 | $149,991 / $299,982 |

Run them yourself with `npm test`.

## Assumptions (read these)

- Post-money SAFEs as defined in YC's current forms. Pre-money SAFEs and convertible notes aren't modelled yet.
- The price per share rounds to 4 decimals and share counts round down, as in YC's examples.
- `dilution` assumes SAFEs convert at their caps. Use `convertSafes` when the round might price below a cap.
- `runway` holds expenses flat unless you pass `expenseGrowth`.

## Roadmap: good first issues

- [ ] Pre-money SAFEs and convertible notes (YC Appendix II, Example 2)
- [ ] MFN / uncapped SAFEs
- [ ] Cap table CSV export
- [ ] Import MRR from Stripe or RevenueCat exports for `runway`
- [ ] Translations of the web page

## Develop

```bash
npm install
npm test          # 20 tests, node:test, no framework
npm run web       # http://localhost:4321
```

Requires Node 22.18+ (runs TypeScript directly). See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © Daniel Nguyen
