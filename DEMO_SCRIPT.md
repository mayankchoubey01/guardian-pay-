# Guardian Pay — Demo Video Script (target: 2:55)

**Hackathon:** PayPal AI Hackathon 2026 — Build What's Next with PayPal and AI

**Before recording:** Start the app locally, confirm PayPal Sandbox and Gemini credentials, sign in to the Sandbox buyer when prompted, reset demo data, and make sure the screen recording is under 3 minutes. Never show `.env` or API credentials.

### 0:00–0:15 — Problem and product
**Visual:** Home screen, then open Demo Scenarios.

**Say:** “Families share payment responsibilities across kids, parents, and older relatives, but alerts often come after a payment. Guardian Pay checks payment context and family limits before a Sandbox payment is captured.”

### 0:15–0:32 — Family dashboard
**Visual:** Switch to Dad, open Family Dashboard, show member filters and transaction rows.

**Say:** “The family head can see activity across members, review limits, and find payments that need attention. The records on screen are demo data.”

### 0:32–0:48 — Routine payment
**Visual:** Run Scenario 1: Riya pays the seeded Juice Bar $4; approve in PayPal Sandbox; show the resulting status.

**Say:** “For a familiar recipient and a small amount, the policy baseline is AUTO. The payment still goes through PayPal Sandbox approval, and the policy gate can raise the tier if its checks require it.”

### 0:48–1:05 — Notify tier
**Visual:** Run Scenario 2: Mom pays Grocery Mart $35; approve in Sandbox; show Dad’s notification.

**Say:** “This exceeds Mom’s auto limit but stays within her notify limit. The expected baseline is NOTIFY, so the payment can proceed while the family head gets a notification.”

### 1:05–1:38 — External-link safety check
**Visual:** Run Scenario 4: Grandma’s KYC link scenario; show unknown asker and account-verification answers, then the returned approval tier and Sandbox authorization hold.

**Say:** “The external-link path asks who requested payment and why. An unknown sender and an account-verification request force the approval tier in deterministic rules, even if the AI assessment differs.”

### 1:38–2:00 — Family decision
**Visual:** Switch to Dad, open the pending review, show the AI explanation and select Block; show VOIDED status.

**Say:** “Dad sees the reason and blocks the request. Guardian Pay voids the Sandbox authorization instead of capturing it.”

### 2:00–2:18 — High-value legitimate request
**Visual:** Run Scenario 3: Riya’s $90 School Office request; approve it in Sandbox, then show Dad’s approval and final capture.

**Say:** “A legitimate school payment exceeds Riya’s configured limit, so it requires family-head review. Once approved, the Sandbox authorization is captured.”

### 2:18–2:42 — How it works
**Visual:** Show risk explanation, policy tier, then dashboard summary.

**Say:** “Gemini returns structured risk details. Zod validates the response, and a TypeScript policy gate applies spending and safety rules. AI can raise a tier but cannot lower a limit-based tier. If the AI call fails, the payment goes to review.”

### 2:42–2:55 — Honest limitations
**Visual:** End on home page and the limitations section of the README.

**Say:** “This is a local prototype using PayPal Sandbox, simulated recipients, and no family sign-in. It is not connected to UPI and is not for real payments. Thank you.”
