# Guardian Pay - Hackathon Demo Video Script (2 Minutes 45 Seconds)

**Project Name:** Guardian Pay  
**Theme:** Build What's Next with PayPal and AI (PayPal AI Hackathon 2026)  
**Presenter:** Mayank Choubey  
**Duration:** Exactly 2 minutes 45 seconds  

---

### [0:00 - 0:20] The Problem (20 Seconds)
* **Visual:** Webcam or slide showing the Guardian Pay title, then transition to browser at `http://localhost:3000`.
* **What to Say:**
  > "In modern families, payments happen dozens of times a day across children, teens, parents, and grandparents. But fraud prevention almost always happens *after* the money is gone. Scammers weaponize urgency against elders, and kids can make accidental impulsive purchases. Today, I'm presenting **Guardian Pay**: an AI agent that watches a family's payments and acts *before* money moves."

---

### [0:20 - 0:40] The Family & Dashboard (20 Seconds)
* **Visual:** Click **"Dashboard"** in the top navigation. Show the AG Grid with historical payments and summary metric cards. Show the "Viewing as: Dad (HEAD)" switcher at the top.
* **What to Say:**
  > "Here is our family dashboard, viewing as Dad, the head of the family. Built on AG Grid, Dad has a transparent, unified view of all household transactions across Dad, Mom, Riya the teenager, Aarav the child, and Grandma. Each member has customizable limits. Notice the metrics: active holds, blocked scams, and money protected."

---

### [0:40 - 1:10] Silent Small Payment & Notified Medium Payment (30 Seconds)
* **Visual:** Click **"Demo Scenarios"** in top bar.
  - Click **"Trigger Scenario 1 (AUTO)"**: Riya paying $4.00 for snacks. Show it goes directly to "Sent" (Tier: AUTO).
  - Click **"Trigger Scenario 2 (NOTIFY)"**: Mom paying $35.00 for weekly groceries. Show it completes with "Sent, and Dad was notified" (Tier: NOTIFY).
* **What to Say:**
  > "Guardian Pay uses a three-tier policy gate. For small routine expenses, like Riya spending $4 on juice at her school cafe, it's Tier 1: AUTO. It executes instantly without friction. For moderate spending, like Mom's $35 grocery run, it's Tier 2: NOTIFY. The payment goes through immediately, and Dad receives a notification in his inbox."

---

### [1:10 - 2:05] The Scam-Like Payment: AI Escalation & Block (55 Seconds)
* **Visual:** 
  1. On the Demo page, click **"Trigger Scenario 3 (AI SCAM ESCALATION)"**: Grandma paying $5.00 to a new recipient "KYC Verify Desk" with reason *"Bank said verify KYC today or my account will be blocked"*.
  2. The status page shows: **"Waiting for Dad to confirm"**.
  3. Switch to Dad's view $\rightarrow$ Click **"Inbox"** (badge shows new alert) $\rightarrow$ Click **"View & Decide"**.
  4. Point to the purple AI Guardian card: Risk High (90/100), scam signals `#urgency`, `#impersonation`, `#fake_verification`.
  5. Click **"Block (Void & Release Hold)"** $\rightarrow$ Click **"Yes, Block Payment"**.
  6. The status changes to **VOIDED**.
* **What to Say:**
  > "Now, here is where Guardian Pay changes the game. Grandma receives an SMS claiming her bank account will be blocked unless she pays a $5 KYC fee right now. Five dollars is well below her auto-limit. Under traditional rules, it would silently go through. But our AI Risk Engine, powered by Gemini, reads the context. It flags bank impersonation, urgency, and elder vulnerability, escalating the payment to Tier 3: APPROVAL.
  > 
  > Money is locked under a PayPal authorization hold. Dad opens the decision page, reads the AI's plain-English explanation, and clicks **Block**. PayPal voids the authorization instantly. Not a single cent ever left Grandma's account!"

---

### [2:05 - 2:25] High-Value Approved Payment (20 Seconds)
* **Visual:**
  1. Click **"Demo Scenarios"** $\rightarrow$ Click **"Trigger Scenario 4 (APPROVAL NEEDED)"**: Riya paying $90.00 for a school trip fee.
  2. Dad opens the review page for Riya's payment. AI notes low risk, but the amount exceeds Riya's $40 teen limit.
  3. Dad clicks **"Approve (Capture Funds)"** $\rightarrow$ Click **"Yes, Approve Payment"**.
  4. Status transitions to **CAPTURED**.
* **What to Say:**
  > "For legitimate large expenses, like Riya's $90 biology excursion fee, the amount exceeds her teen limit. It is safely held. Dad reviews it, verifies the school recipient, clicks **Approve**, and PayPal executes the final capture."

---

### [2:25 - 2:50] Under the Hood & AI Weekly Report (25 Seconds)
* **Visual:** Return to **"Dashboard"**. Click **"Generate New Summary"** under the AI Weekly Report card. Show the AI synthesizing all transactions.
* **What to Say:**
  > "Under the hood, Guardian Pay is built on Next.js, SQLite, and PayPal REST APIs using two-phase authorization holds. Our Policy Gate is completely deterministic: AI can escalate, but can never downgrade a tier or bypass family limits. Dad can also click 'Generate New Summary' to receive an executive briefing from Gemini summarizing weekly trends and flagged safety events."

---

### [2:50 - 3:05] Why It Matters & Honest Limitations (15 Seconds)
* **Visual:** Show the honesty disclosure in the footer. End on the Guardian Pay home screen.
* **What to Say:**
  > "Guardian Pay turns payments from a vulnerability into a collaborative family safety network. While inspired by India's UPI Circle, this prototype operates exclusively on the PayPal sandbox with simulated recipients, ensuring AI assists decisions while humans retain ultimate control. Thank you!"

