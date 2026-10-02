# Beef - Paid Dissent Platform

**"Put money where your mouth is."**

A platform that turns internet arguments into structured, monetized debates. No endless reply chains. Post a claim, price your conviction, and let the internet watch it burn in a controlled arena.

---

## 🎯 Core Concept

Beef transforms performative posting into structured contests where:
- **Conviction has a price** - Users put real money behind their claims
- **The arena has rules** - Structured 24-hour debate format with rounds
- **The crowd fuels the spectacle** - Spectators watch and place sidecards (predictions)
- **Judges determine winners** - AI panel + rubric scores determine outcomes
- **One appeal, then done** - Fair but firm dispute resolution

---

## 🚀 Features

### For Debaters

**Stage 1: Enter Arena**
- Browse debates freely without account
- Verify identity only when money is involved (KYC on-demand)

**Stage 2: Post a Claim**
- Write a claim (statement to debate)
- Choose debate type: Persuasion, Objective Claim, or Taste Battle
- Set your ante: $10, $25, $50, or $100
- Select category: Politics, Culture, Sports, Tech, or Callouts

**Stage 3: Match the Beef**
- Another user accepts and matches your ante
- 24-hour clock starts immediately

**Stage 4: Debate Live**
- **Round 1 (Opening)**: 220-character thesis statements
- **Round 2 (Receipts)**: Evidence round with links, screenshots, sources
- **Round 3 (Closing)**: Final arguments before judging

**Stage 5: Judge the Match**
- Panel of 3 AI models + published rubric
- Transparent decision trace and scoring
- Winner declared when clock expires or someone concedes

**Stage 6: Appeal Once**
- Single appeal allowed to keep platform firm but fair
- Appeal review by different judge panel

**Stage 7: Pay, Share, Repeat**
- Winner gets the pot
- Debate becomes part of public record
- Users build reputation with wins/losses

### For Spectators

- **Free to watch** - No account needed to view live debates
- **Sidecards** - Place predictions on debate outcomes (separate from main pot)
- **Follow debaters** - Track your favorite arguers
- **Crowd pulse** - See prediction splits (FIRE/FACTS/RECKLESS categories)
- **Comment feed** - Real-time reactions from spectators

### 🔥 Killer Feature: "Take This to Beef"

**One-button import from other platforms:**
- Scrape entire threads from X/Twitter, Discord, Reddit, 4chan
- Auto-generate claim from the argument
- Tag both parties (invite if not on platform)
- Original thread becomes "receipts" in the debate
- Viral loop: "We're taking this to Beef" becomes the new "1v1 me"

---

## 🎨 Design System

**Color Palette:**
- **Background**: Very dark brown/almost black (#0A0806)
- **Card Background**: Dark brown (#2A1F18)
- **Accent**: Muted gold (#D4A574) and bright orange (#FF6B47)
- **Text**: Off-white (#F5F1ED) and muted (#A89885)

**Typography:**
- Font: Inter
- Bold, tracking-tight headings
- Clean, modern sans-serif

**UI Style:**
- Fight card aesthetic (UFC/boxing inspired)
- High contrast design
- Glowing accents for CTAs
- Rounded corners on cards
- Dark, sophisticated, premium feel

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (via Prisma ORM 7)
- **Authentication**: NextAuth.js (planned)
- **Payments**: Stripe (planned)
- **Judging**: Claude API for AI judge panels (planned)

---

## 📦 Database Schema

### Core Models

**User**
- Authentication (email, password, username, handle)
- Profile (bio, verified status, region, wallet)
- Stats (wins, losses, total earnings)
- Preferences (anonymous mode)

**Beef (Debate)**
- Claim and metadata (category, debate type)
- Participants (challenger, responder)
- Stakes (ante, total pot)
- Timing (24-hour clock)
- Status (open, matched, live, judging, completed)
- Judging (type, winner, rubric, decision, appeals)

**Round**
- Round number and type (opening, receipts, closing)
- Content from both sides
- Evidence/receipts (links, screenshots)
- Timestamps

**Sidecard**
- Spectator predictions
- Predicted winner and stake amount
- Category (FIRE, FACTS, RECKLESS)
- Payout tracking

**ThreadImport**
- Platform source (Twitter, Discord, Reddit, 4chan)
- Original thread URL and scraped data
- Participant mapping
- Linked to created Beef

**Rating**
- Post-debate user ratings
- Score (1-5 stars)
- Comments

**Transaction**
- Payment tracking (ante, sidecard, payout, refund)
- Payment provider integration
- Status tracking

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Navigate to project directory:**
   ```bash
   cd shoe-shoe  # (will be renamed to beef)
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Payment (add when ready)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=

# Thread Import APIs (add when ready)
# TWITTER_API_KEY=
# DISCORD_BOT_TOKEN=
# REDDIT_CLIENT_ID=
```

---

## 🎯 What's Been Built

✅ **Landing Page** - Full POC design implemented
- Hero section with tagline and CTAs
- Browse categories and sort options
- Stats dashboard (Live Pot, Open Challenges, Spectators, etc.)
- "How Beef Actually Runs" - 7-stage flow
- "Enter Arena" - User experience section
- "What Must Be True" - Operational requirements
- Product positioning

✅ **Database Schema** - Complete data models
- Users, Beefs, Rounds, Sidecards
- Ratings, Follows, Thread Imports
- Transaction tracking

✅ **Design System** - Full Tailwind config
- Dark brown/gold color palette
- Custom components and utilities
- Matching POC aesthetic

---

## 📋 What's Next

### Phase 1: Core Functionality
- [ ] **Authentication** - NextAuth setup with email/password
- [ ] **Create Beef Flow** - Form to post claims and set antes
- [ ] **Match System** - Accept/challenge interface
- [ ] **Debate Interface** - Real-time round submission UI
- [ ] **Timer System** - 24-hour countdown with notifications
- [ ] **Browse/Filter** - Category and sort functionality

### Phase 2: Judging & Payouts
- [ ] **AI Judge Integration** - Claude API for debate scoring
- [ ] **Rubric System** - Visible scoring criteria
- [ ] **Appeal Flow** - One-time appeal interface
- [ ] **Payment Integration** - Stripe for antes and payouts
- [ ] **Wallet/Balance** - User account balance tracking

### Phase 3: Spectator Features
- [ ] **Sidecard System** - Prediction market for debates
- [ ] **Follow System** - Track favorite debaters
- [ ] **Live Feed** - Real-time debate updates
- [ ] **Crowd Pulse** - Prediction splits visualization
- [ ] **Comments** - Spectator reactions

### Phase 4: Viral Growth
- [ ] **Thread Import** - "Take this to Beef" button
  - Twitter/X API integration
  - Discord bot
  - Reddit API
  - 4chan scraper (read-only)
- [ ] **Share Cards** - Beautiful debate result images
- [ ] **Leaderboards** - Top debaters by category
- [ ] **Viral Hooks** - Embeddable widgets for external sites

### Phase 5: Polish & Scale
- [ ] **Notifications** - Email/push for debate updates
- [ ] **Mobile App** - React Native companion
- [ ] **Moderation Tools** - Admin panel for risky claims
- [ ] **Analytics** - User dashboard with stats
- [ ] **Regional Controls** - Compliance with local laws

---

## 🎭 Product Philosophy

### What Must Be True

**Identity**
- Users browse freely, but money-moving actions require verified payment identity and region controls

**Moderation**
- Risky claims need category gating, claim framing rules, and escalation hooks before a match goes live

**Judging**
- Every resolved Beef needs a visible rubric, source record, decision trace, and one-appeal ceiling

**Separation**
- The debate pot, spectator sidecards, and crowd reactions must be distinct products in both UX and accounting

---

## 📜 License

MIT

---

## 🤝 Contributing

This is currently a private project. Contributions will be opened up in future phases.

---

**Beef turns performative posting into a structured contest. Conviction has a price, the arena has rules, and the crowd fuels the spectacle without owning the result.**

*Put money where your mouth is.*
# Trigger redeploy after Sidecard table creation
