# Customer portal v11

Deploy the matching dairy-backend v11 change first. Read its UPGRADE_V11.md.

Profile → My Orders has Recent, Delivered and Cancelled order sections. Existing
subscriptions stay in their section; creating, pausing, resuming or cancelling
queues a purpose-specific orders email. Cancelled subscriptions cannot resume.
Order conversations and authenticated delivered-order ratings are available.
Profile contains dark-mode and notification-sound settings. Saved addresses
have a Pin delivery location action with manual coordinates or explicit current
location selection for future deliveries.

New assets: workspace.js/css and orders.js/css. Main refreshes are batched,
revision checks run every 1.5 seconds while visible, and OTP inputs support the
device's one-time-code autocomplete plus grouped-digit paste. Mail/keyboard
suggestions depend on the device. Existing checkout/stock/OTP protections remain.
