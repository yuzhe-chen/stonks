# Stonks

A paper trading game where real news moves a made-up market. 200 invented companies, 20 sectors, four index funds.
You cannot lose real money, only dignity.

- `scripts/tick.mjs` runs every five minutes in GitHub Actions. It reads public RSS feeds, turns each headline into a signal
  (which sectors move, which way), writes a made-up headline from templates, moves every price, and publishes the result
  to the `data` branch. Real headline text is never copied or shown.
- `public/` is the game. It reads the data branch and keeps your portfolio in your browser.
- Create a file named `pause.txt` on the default branch to stop the market moving. Delete it to resume.
- Local preview: `node scripts/tick.mjs data && node scripts/dev.mjs data`, then open http://localhost:8750.
