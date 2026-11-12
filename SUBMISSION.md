# Devpost Submission Draft — Guardian Pay

## Project title
Guardian Pay: The Family Payment Guardian

## Short description
An AI-assisted family payment safety prototype that uses PayPal Sandbox authorization holds and deterministic spending rules to flag risky payments before capture.

## Project description
Families often share payment responsibilities across children, teens, adults, and older relatives. Guardian Pay gives a family head a review point before high-value or suspicious payments are captured. Gemini assesses payment context and recipient history; a deterministic policy gate applies member-specific limits and safety answers. The gate can raise a payment's tier, never lower the tier required by limits or risk rules.

Routine requests can move through with little friction. Moderate requests create a notification. High-value requests or selected scam-like situations require a family-head decision. PayPal Sandbox authorizations are captured after approval or voided after a block. The prototype also demonstrates a link safety check, QR recipient entry, family limits, payment history, and a weekly AI summary.

## What we built
- PayPal Orders API with `AUTHORIZE` intent and Payments API capture/void calls.
- Gemini structured risk assessment with schema validation and a conservative fallback when AI is unavailable.
- Deterministic policy gate for spending limits, new recipients, and safety-check answers.
- Family dashboard, contacts, QR scanning, notifications, transaction history, and demo scenarios.

All payment actions use Sandbox credentials and simulated recipients. This project is not connected to UPI or NPCI and is not for real-money use.

## Tools and technologies
PayPal Sandbox REST APIs; Google Gemini API (`gemini-3.5-flash` by default); Next.js 16; React 19; TypeScript; SQLite; Zod; AG Grid Community; Tailwind CSS.

## Hackathon-period progress
The project was updated during the submission period with the contact and QR flows, external-link safety questions, revised policy rules, member-specific transaction history, and responsive home/dashboard screens. The source repository should show the corresponding commits and final changes before submission.

## How judges can run it
Use Node.js 22+, clone the public repository, install with `npm install`, copy `.env.example` to `.env`, add PayPal Sandbox and Gemini credentials, run `npm run dev`, then open `http://localhost:3000`. Payment scenarios require a Sandbox buyer session. Full steps and limitations are in `README.md`.

## Required Devpost links — fill before submitting
- Public source repository: **[ADD PUBLIC REPOSITORY URL]**
- Public YouTube demo video (under 3 minutes): **[ADD YOUTUBE URL]**
- Hosted demo: **None; local run instructions are provided. Do not deploy this unauthenticated prototype publicly.**

## Demo sequence
Use `DEMO_SCRIPT.md` as the recording outline. The demo scenarios call real PayPal Sandbox endpoints, so verify Sandbox credentials and buyer login before recording. AI results may vary; show the result returned by the run rather than promising a fixed score.

## Limitations
This is a local hackathon prototype with seeded demo records, no sign-in or server-side family-member authorization, and no production database persistence. It uses simulated PayPal Sandbox funds and AI risk scores are probabilistic. Do not use for real payments or expose it publicly.

## AI coding tools disclosure
The development notes list Cursor, Claude Code, and GitHub Copilot as coding assistants used. Confirm this list is accurate for the final submission before posting.
