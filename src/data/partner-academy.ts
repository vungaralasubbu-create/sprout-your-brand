// Sales Academy — partner learning modules. Curated, editorial content only.
// No fabricated policy or income claims.

export type AcademyLesson = {
  title: string;
  summary: string;
  minutes: number;
  body: string; // Markdown
};

export type AcademyModule = {
  slug: string;
  title: string;
  tagline: string;
  duration: string;
  intent: string;
  lessons: AcademyLesson[];
};

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    slug: "revenue-models",
    title: "How Revenue Models Work",
    tagline: "70% own leads, 50% supported. When each one fits.",
    duration: "18 min read",
    intent: "Understand the two commercial paths a Glintr partner can operate on.",
    lessons: [
      {
        title: "The two models",
        summary: "70% for your own leads, 50% for platform-assigned leads.",
        minutes: 4,
        body: `Glintr runs two independent partner models.\n\n- **70% Revenue Model** — you source your own leads. On every eligible enrolment you retain 70% of the recognised course revenue.\n- **50% Supported Model** — Glintr assigns you qualified opportunities from platform lead flow. You retain 50% on every eligible enrolment closed from those assignments.\n\nBoth models share the same programs, the same delivery, and the same student experience — only the origination path differs.\n\nA partner can operate on **one** model at a time. Model changes go through partner ops review; they are not day-to-day toggles.`,
      },
      {
        title: "Eligible revenue",
        summary: "Only paid, unrefunded, non-charged-back enrolments count.",
        minutes: 3,
        body: `An enrolment becomes eligible when:\n\n1. The learner has completed payment (in full or as per an approved schedule).\n2. The refund window has passed (or a refund waiver is on file).\n3. There is no chargeback, ownership dispute, or compliance flag.\n\nCommission is calculated on **recognised revenue**, not gross card volume. Discounts, GST, gateway fees, and refunds are excluded before the split is applied.`,
      },
      {
        title: "When each model fits",
        summary: "A quick mental model for partners.",
        minutes: 3,
        body: `Use the 70% model when you have:\n\n- Strong personal network in a specific field (AI, management, freelancing).\n- Existing audience — creator, community, alumni network.\n- A tight source of warm intros and referrals.\n\nUse the 50% supported model when you have:\n\n- Sales skill and time, but a smaller warm network.\n- Ability to work assigned inquiries responsively.\n- A preference for consistent lead flow over exclusivity.\n\nNeither model is "better." They serve different partner realities.`,
      },
      {
        title: "What is never guaranteed",
        summary: "Read this before setting any income expectation.",
        minutes: 2,
        body: `Glintr does **not** guarantee:\n\n- A minimum number of leads.\n- Any income figure — monthly, annual, or lifetime.\n- Fixed conversion rates.\n- Lead exclusivity on the 50% model (rotation policies apply).\n\nAll examples on this platform are illustrative. Actual earnings depend on your effort, the fit of the leads, program pricing, refunds, and market conditions.`,
      },
    ],
  },
  {
    slug: "sales-ethics",
    title: "Sales Ethics at Glintr",
    tagline: "The lines partners never cross.",
    duration: "10 min read",
    intent: "Anchor every conversation you have on Glintr's behalf.",
    lessons: [
      {
        title: "Never promise outcomes",
        summary: "No job, salary, or placement claims — ever.",
        minutes: 3,
        body: `Glintr programs are learning products, not recruitment services.\n\nPartners must never state or imply:\n\n- "You will get a job."\n- "You'll earn ₹X after this program."\n- "This certificate is government-recognised" (unless the program page explicitly says so).\n- "Placement is guaranteed."\n\nInstead, describe the **learning outcome** and let the learner draw their own conclusions.`,
      },
      {
        title: "Respect the learner's timeline",
        summary: "No pressure closes.",
        minutes: 3,
        body: `A high-pressure close on the phone erodes trust and produces refunds.\n\n- Answer questions. Offer to send more information. Confirm the fit.\n- Don't create false urgency ("only 3 seats left" if that isn't true).\n- If a learner needs to think, honour that. Follow up in 3–5 days.\n\nRefund-inducing conversations cost partners commission and cost Glintr reputation.`,
      },
      {
        title: "Data & privacy",
        summary: "Learner data is never shared or resold.",
        minutes: 2,
        body: `Every lead you handle — assigned or self-sourced — is confidential.\n\n- Never share a learner's phone, email, or WhatsApp number with anyone outside Glintr.\n- Never repurpose lead data for other products or campaigns.\n- Delete conversation notes once an enrolment is closed or the lead is declined.`,
      },
      {
        title: "When to walk away",
        summary: "Wrong fit is not a lost sale — it's a refund waiting to happen.",
        minutes: 2,
        body: `Walk away when:\n\n- The learner's goal is not what the program delivers.\n- The financial commitment is a stretch and there's no alignment on payment terms.\n- The learner asks for outcomes we can't (and won't) promise.\n\nRefer them to another program, or gracefully close the conversation. Your reputation is the compounding asset — one refund erodes many closes.`,
      },
    ],
  },
  {
    slug: "program-knowledge",
    title: "Program Knowledge",
    tagline: "Speak fluently about every catalog you sell.",
    duration: "20 min read",
    intent: "Build the reference model you use in every consultation.",
    lessons: [
      {
        title: "The five categories",
        summary: "AI, Management, Engineering, Electronics, Freelancing.",
        minutes: 4,
        body: `Glintr's programs are grouped into five categories. Learn the **shape** of each — not the price list.\n\n- **Computer Science / AI** — ChatGPT, Claude, Gemini, ML foundations, agent workflows. Learners are usually early-career, technical, or curious professionals.\n- **Management** — Product, marketing, operations. Mid-career learners rebuilding their trajectory.\n- **Engineering** — Design, mechanical, electrical fundamentals for practitioners.\n- **Electronics** — Circuit, embedded, IoT for hobbyists and juniors.\n- **Freelancing** — Portfolio, pricing, delivery. Learners who want to earn independently.\n\nRead the program page. Read the sample lesson. Sit in one live session per quarter.`,
      },
      {
        title: "The three axes learners care about",
        summary: "Outcome, format, and time.",
        minutes: 3,
        body: `Every "which program?" conversation resolves to three axes:\n\n1. **Outcome** — What skill or artefact will the learner have at the end?\n2. **Format** — Cohort-based or self-paced? How much live time per week?\n3. **Time** — Total duration and the weekly commitment.\n\nAnchor recommendations on these — not on price or brand names.`,
      },
      {
        title: "Objection: is this worth it?",
        summary: "A structured way to defuse price objections.",
        minutes: 3,
        body: `"Worth it" is really three questions:\n\n1. Does the outcome match my career move? (Program fit.)\n2. Will I actually complete it? (Format & time fit.)\n3. Can I afford it? (Financial fit.)\n\nAnswer them in that order. Do not lead with price. If the first two are yes, the third resolves faster.`,
      },
    ],
  },
  {
    slug: "lead-handling",
    title: "Lead Handling",
    tagline: "How Glintr partners run a lead from first ping to enrolment.",
    duration: "15 min read",
    intent: "A repeatable lead workflow that works across both revenue models.",
    lessons: [
      {
        title: "The 8-stage lead lifecycle",
        summary: "New → Contacted → Interested → Follow-up → Application → Payment Pending → Enrolled → Closed.",
        minutes: 4,
        body: `Every Glintr lead moves through these stages. Update the status honestly — the pipeline is your memory, not your report card.\n\n1. **New** — Lead assigned or added.\n2. **Contacted** — First message sent, awaiting response.\n3. **Interested** — Learner has engaged and is exploring.\n4. **Follow-up** — Pending a decision, scheduled touch.\n5. **Application Submitted** — Program application filed.\n6. **Payment Pending** — Payment link shared.\n7. **Enrolled** — Payment complete, learner joins cohort.\n8. **Closed / Cancelled** — Explicitly not moving forward.\n\nEach stage has a clear signal to move it forward or close it.`,
      },
      {
        title: "First-touch playbook",
        summary: "The first 24 hours matter more than any other window.",
        minutes: 3,
        body: `- Respond within **60 minutes** of assignment.\n- Lead with the learner's context, not a script.\n- Ask **one** question. Listen. Book a slot within 72 hours.\n\nA fast, human first message closes 3× better than a delayed pitch.`,
      },
      {
        title: "Follow-up cadence",
        summary: "Reach out, then step back.",
        minutes: 3,
        body: `Default cadence for a warm-but-quiet lead:\n\n- Day 0 — first message.\n- Day 2 — polite nudge with new value (a resource, not a sales line).\n- Day 5 — final check-in, offer to close the loop.\n- Day 10 — mark as **Not Contactable** if still silent.\n\nRotating three thoughtful touches beats seven pushy ones.`,
      },
    ],
  },
  {
    slug: "consultation-skills",
    title: "Consultation Skills",
    tagline: "Run a 20-minute call that a learner remembers.",
    duration: "12 min read",
    intent: "Move from pitching to consulting.",
    lessons: [
      {
        title: "The 3-1-1 structure",
        summary: "3 questions, 1 recommendation, 1 next step.",
        minutes: 3,
        body: `Structure every consultation as:\n\n- **3 questions** — background, goal, constraint.\n- **1 recommendation** — the program that fits, with one alternative.\n- **1 next step** — pay, apply, or schedule a decision call.\n\nCalls that follow this structure feel like advice, not sales.`,
      },
      {
        title: "Listening beats scripting",
        summary: "Talk 30%, listen 70%.",
        minutes: 3,
        body: `The best partners speak less than the learner. Silence is a tool — it invites depth.\n\n- Reflect what you heard before offering a recommendation.\n- Ask "what does success look like six months after this program?"\n- Take notes. Repeat back numbers ("so a 3-month runway is realistic — got it.").`,
      },
      {
        title: "Ending the call",
        summary: "Never end without a scheduled next step.",
        minutes: 2,
        body: `A consultation without a next step decays fast.\n\n- Book the next call date on the phone.\n- Share the payment link before you hang up.\n- Send a written recap within one hour.`,
      },
    ],
  },
  {
    slug: "communication",
    title: "Communication",
    tagline: "Write and speak like a Glintr partner.",
    duration: "10 min read",
    intent: "Practical rules for messages, emails, and voice.",
    lessons: [
      {
        title: "Text messages",
        summary: "Short, human, punctuated.",
        minutes: 3,
        body: `- First message: under 40 words.\n- Use the learner's first name once, not five times.\n- No emoji floods. One is friendly. Six is a spam signal.\n- Always sign off with your name.`,
      },
      {
        title: "Emails",
        summary: "Subject line does 70% of the work.",
        minutes: 3,
        body: `- Subject: outcome-first, not question-first ("Quick recap of our chat" > "Are you still interested?").\n- One idea per email. Anything longer belongs on a call.\n- Include the program link — never make the learner search.`,
      },
      {
        title: "Voice calls",
        summary: "Voice is trust bandwidth.",
        minutes: 2,
        body: `- Smile before the call — it reaches the phone.\n- Speak 10% slower than instinct suggests.\n- Repeat any number the learner says. Confirm every commitment aloud.`,
      },
    ],
  },
  {
    slug: "objection-handling",
    title: "Objection Handling",
    tagline: "The five objections you'll hear this month.",
    duration: "12 min read",
    intent: "Turn objections into decisions.",
    lessons: [
      {
        title: "\"Too expensive\"",
        summary: "Almost always about value clarity, not money.",
        minutes: 3,
        body: `Reframe the price as a monthly outcome:\n\n- "Over 3 months, that's roughly ₹X per week — for the skills we discussed, does that feel proportional?"\n\nDon't offer discounts you can't authorise. If cost is truly the block, refer to the shorter or entry-level program.`,
      },
      {
        title: "\"I need to think\"",
        summary: "Almost always about missing information.",
        minutes: 3,
        body: `- "Totally fair. What's the one thing that would help you decide?"\n- Book the decision call before hanging up.\n- Send a one-page recap they can share with a partner or parent.`,
      },
      {
        title: "\"I've tried courses before\"",
        summary: "Fear of another abandoned enrolment.",
        minutes: 3,
        body: `- Acknowledge honestly. Ask what didn't work.\n- Highlight Glintr's live cohort accountability and mentor support.\n- Don't over-promise completion — highlight the design that supports it.`,
      },
      {
        title: "\"Give me a discount\"",
        summary: "Handle without leaking margin.",
        minutes: 3,
        body: `- Never invent a discount. If there's a live offer, describe it. If not, say so.\n- Offer a payment plan alternative if one exists.\n- If they walk on price alone, the program was not the fit — move on gracefully.`,
      },
    ],
  },
];
