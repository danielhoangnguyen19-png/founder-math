# Contributing

Thanks for helping. One rule matters more than the rest:

**Every formula needs a source.** When you add or change math, add a test whose expected values come from a public source, such as a YC document, a law firm's published example or a textbook. Put the citation in a comment next to the number. Hand-worked examples are fine too: show the arithmetic in the comment.

## Steps

1. `npm install`, then `npm test` to see everything pass.
2. Write the failing test first, with its source.
3. Make it pass, then run `npm run typecheck`.
4. Open a PR saying what you changed and where the numbers come from.

Keep the library dependency-free. Small PRs get merged faster.
