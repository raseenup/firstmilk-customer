# First Milk Venture v12

Deploy the coordinated backend first, then this portal with every changed local asset. No new paid service or secret is required.

Subscriptions now have separate Active / Paused / Cancelled tabs and counts alongside the existing order tabs. The old Home delivery-address strip is replaced by an admin-controlled advertising strip; addresses remain in Profile and checkout.

Order chat supports a photo or voice attachment with or without text. Choose Add photo, Upload voice or Record voice. Media loads only when selected. Photos become metadata-free JPEGs; chat GIFs are flattened. Recording needs browser permission and HTTPS, stops after one minute and stops when hidden/closed. Uploads are limited to 1.5 MB.

Dark mode now pairs readable text with every themed surface and uses mint, blue, gold and coral accents. Shared OTP fields support keyboard suggestions, grouped paste and an explicit Paste code button; password reset uses a proper one-time-code field rather than a prompt. Suggestions depend on the device/mail app and clipboard permissions.

Performance: chat reads are incremental, attachments load on demand, public campaign bytes are stored outside the main state row and cached separately, and larger API responses are compressed. Existing visible-page revision polling and batching remain. No claim of WebSocket delivery or a hosting latency guarantee is made.

Validation includes JavaScript syntax and full-portal DOM workflow checks, sampled dark contrast above 4.5:1, plus the backend regression suite. Real mobile layout, microphone/keyboard behavior, inbox delivery and production PostgreSQL remain deployment verification. See the backend UPGRADE_V12.md for details.
