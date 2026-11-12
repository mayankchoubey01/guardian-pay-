# Guardian Pay: Family Payment Safety Prototype

> A PayPal AI Hackathon 2026 prototype. It uses PayPal Sandbox and simulated family/recipient data only; it is not connected to UPI and must not be used for real payments.

Guardian Pay evaluates family payment requests before checkout. A deterministic policy gate applies each member's spending limits, while Gemini can raise a payment's risk tier. Low-risk payments may proceed, moderate payments notify the family head, and high-value or suspicious requests require review before capture.

## What the prototype demonstrates

- **AUTO:** familiar, low-value payments can be captured after PayPal Sandbox approval.
- **NOTIFY:** payments above a member's auto limit can proceed and create a family notification.
- **APPROVAL:** high-value requests and selected scam-like situations are held for a family-head decision to capture or void.
- **Path B safety check:** an external payment link asks who requested the payment and why; risky answers force approval in the policy gate.
- **Family dashboard:** transaction history, member limits, notifications, risk explanations, and a weekly Gemini summary.
- **Scan and contacts:** QR-based recipient entry, recipient trust levels, and saved contacts.

AI output is probabilistic and can vary. The policy gate enforces spending boundaries and can raise a tier; it cannot lower the tier selected by member limits or safety rules. If the AI request fails, the payment is sent for review.

## Run locally

Requirements: Node.js 22 or newer, a PayPal Sandbox app, and a Gemini API key. The repository does not include credentials.

1. Clone the public repository linked from the Devpost entry and open its folder.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `AI_API_KEY`. Keep `.env` private; never commit it.
4. Start the app with `npm run dev` and open `http://localhost:3000`.
5. To exercise webhook delivery, configure `PAYPAL_WEBHOOK_ID` for the webhook URL. The webhook endpoint rejects events if its ID is missing or the signature is invalid.
6. Use the **Demo Scenarios** page to run the walkthrough. Payment scenarios call PayPal Sandbox and require an approved Sandbox buyer session.

The app currently has no sign-in or server-side family-member authentication. **Run it locally only; do not expose it as a public hosted demo.** The APIs are a hackathon prototype and are not production-hardened.

## Checks

- `npm test` runs 30 deterministic policy-gate tests.
- `npm run build` builds the Next.js app and runs TypeScript checks.

These checks do not replace an end-to-end PayPal Sandbox transaction test. The demo requires the credentials above.

## Five demo scenarios

The `/demo` page has five one-click walkthroughs:

1. Riya pays a familiar Juice Bar for $4 (baseline AUTO).
2. Mom pays the seeded Grocery Mart $35 (baseline NOTIFY).
3. Riya pays the seeded School Office $90 (APPROVAL due to her limit).
4. Grandma follows an external KYC verification link; the safety answers force APPROVAL, then the family head can block and void it.
5. Mom scans a QR for a new prize-claim recipient (at least NOTIFY; the AI may raise it to APPROVAL).

AI may raise any baseline tier, so the first, second, and fifth scenarios can produce a higher tier. Do not narrate a fixed AI score or result unless it is visible in that run.

## Stack

Next.js 16, React 19, TypeScript, SQLite (`better-sqlite3`), PayPal Orders and Payments REST APIs, Gemini (`gemini-3.5-flash` by default), Zod, AG Grid Community, and Tailwind CSS.

## Security and demo limitations

- PayPal Sandbox only; recipient labels are local demo data and funds are simulated.
- The app has no authentication or authorization system and is not safe for public deployment or real financial use.
- Webhook events are only applied after PayPal signature verification; configure a webhook ID before using the listener.
- Authorization expiry now attempts to void the PayPal authorization before marking the local payment expired. A failed void is reported for manual follow-up.
- AI risk assessment can be wrong. It is advisory; deterministic limits and the family-head review path remain in control.
- SQLite is intended for this local prototype. No production persistence or disaster-recovery setup is included.

## License

MIT. See [LICENSE](LICENSE).
