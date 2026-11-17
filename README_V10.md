# Customer portal v10

Deploy the matching dairy-backend v10 change before this portal.

The header bell and search buttons are removed. Search remains in the bottom
navigation and notifications remain in Profile. Mobile widths are constrained
to the viewport. COD checkout renders the server's returned order immediately
and opens My Orders; cancellation immediately updates its status. The backend
queues the cancellation email.

The portal uses one scoped `/portal/snapshot` request for its main refresh,
combines duplicate reads, polls revisions every two seconds while visible,
and refreshes after mutations or when a hidden page becomes visible. Existing
password and email OTP requirements remain enabled. No paid realtime service
is needed. Existing images and animated product GIFs are read from the backend.

Validation: all JavaScript files pass `node --check`; the coordinated backend
passes 91 isolated regressions. A complete live visual check remains pending.
