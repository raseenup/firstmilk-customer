# First Milk Venture v9 — Customer portal

Home contains the catalog and published campaigns. Use **Profile** for the actual
customer name, Manage Address, My Orders & subscriptions, FMV Wallet, account
tools, help and Logout. Choose a saved address in Cart before placing an order.
Wallet payments/top-ups are not enabled; the wallet area describes availability.

Deploy [dairy-backend](https://github.com/raseenup/dairy-backend) v9 first. Its
`UPGRADE_V9.md` contains full deployment and email configuration instructions.
Publish all changed files together and keep `config.js` pointed at the backend.

Validation: JavaScript syntax checks and isolated DOM/API smoke checks passed.
A browser preview was blocked by the environment URL policy; actual mobile
rendering was not visually verified.
