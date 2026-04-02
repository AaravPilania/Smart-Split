<div align="center">

<br/>
<br/>

# ✦ Smart Split

### Split bills, not friendships.

<br/>

**The intelligent expense-sharing platform that makes splitting bills effortless.**
**Real-time notifications · Gemini Vision receipt scan · Voice-enabled AI chatbot · UPI settlements · QR friend invites**

<br/>

[![Live Demo](https://img.shields.io/badge/%E2%96%B6_LIVE_DEMO-thesmartsplit.pages.dev-F6821F?style=for-the-badge&logo=cloudflare&logoColor=white)](https://thesmartsplit.pages.dev)
&nbsp;&nbsp;
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
&nbsp;&nbsp;
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#-progressive-web-app)

<br/>
<br/>

---

<br/>

</div>

## Why Smart Split?

> Most bill-splitting apps feel like spreadsheets. Smart Split feels like the future.

Built for the way real friend groups actually work — messy tabs, forgotten IOUs, and "I'll pay you back later" promises. Smart Split handles the math, the reminders, and the awkward conversations so you don't have to.

<br/>

<div align="center">

| | Feature | What it does |
|:--:|:--|:--|
| ✦ | **Aaru — AI Expense Assistant** | Floating chatbot with **voice input** and **quick-reply chips**. Say or type "pizza ₹500 with Priya" and Aaru parses it into a ready-to-confirm expense card. Powered by Gemini 1.5 Flash with a local regex+cache fallback — works even without an API key. |
| 📷 | **Gemini Vision Scanner** | Point your camera at any receipt — Gemini reads the image natively and returns merchant name, total, category, and **individual line items**. Auto-compresses images before upload. Tesseract.js is the automatic client-side fallback. |
| 🏷️ | **Auto Categories** | Regex-first classification (200+ keywords) → 24h response cache → Gemini AI. 8 categories: Food, Travel, Home, Entertainment, Shopping, Health, Utilities, Other. |
| 👥 | **Smart Group Splits** | Create groups, add members, log expenses — the greedy debt-simplification algorithm calculates who owes what with minimum transactions. **Admin roles** and **group membership guards** for security. |
| 📊 | **Live Dashboard** | Real-time metrics: total spend, debts owed, monthly trends, category donut chart, recent activity feed with an **interactive onboarding spotlight guide** for new users. |
| 🔴 | **Real-Time Notifications** | **Server-Sent Events (SSE)** push notifications instantly — no polling needed. Automatic fallback to 60s polling if SSE disconnects. Payment confirmations delivered in real time. |
| ⚡ | **UPI Settle Flow** | Pick a settlement, choose GPay/PhonePe/Paytm (with logos), enter partial or full amount, and pay — with "set default app" memory. **Auto-detects when you return from the UPI app** and prompts you to confirm payment. |
| 📷 | **QR Code Payments** | Scan any UPI QR code to pay directly from within the app. |
| 🤝 | **QR Friend Invites** | Share your personal QR code — friends scan it and connect instantly, no manual search needed. |
| 🔔 | **Smart Reminders** | Nudge friends about pending payments with one tap — notifications pushed via SSE in real time. |
| 🔐 | **Google OAuth** | One-tap Google sign-in right from the intro screen — skip the entire onboarding flow. |
| 📥 | **CSV Export** | Download expense reports for any group — perfect for trips and shared living. |
| 🎨 | **6 Accent Themes** | Personalize with Pink, Violet, Ocean, Emerald, Sunset, or Night palettes. Applied globally across gradients, buttons, and the PWA chrome. |
| 🌙 | **Dark Mode** | Full dark theme with synced browser chrome and PWA title bar. |
| 📡 | **Offline Ready** | Workbox-powered service worker caches static assets — installable as a native-feeling PWA. |

</div>

<br/>

---

<br/>

## 📱 Mobile-First Design

Smart Split is built **mobile-first** as a Progressive Web App.

### Layout Philosophy

- **Heading** — Positioned between top and center, large and commanding
- **USP Pills** — Directly below the heading with comfortable spacing
- **Login Card** — Sits near the bottom with enough padding, creating a natural visual flow
- **Glassmorphic UI** — Frosted glass cards over animated gradient blobs
- **Zero scroll** — Everything fits in one viewport on the login screen

<br/>

---

<br/>

## 🛠️ Tech Stack

<div align="center">

### Frontend

[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion_12-0055FF?style=flat-square&logo=framer&logoColor=white)](https://motion.dev)
[![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com)

### Backend

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Mongoose](https://img.shields.io/badge/Mongoose_9-880000?style=flat-square&logo=mongoose&logoColor=white)](https://mongoosejs.com)
[![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

### Infrastructure

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F6821F?style=flat-square&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com)
[![Workbox](https://img.shields.io/badge/Workbox_PWA-FF6F00?style=flat-square&logo=google&logoColor=white)](https://developer.chrome.com/docs/workbox)

</div>

<br/>

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **UI Framework** | React 19 | Component architecture with hooks |
| **Build Tool** | Vite 7 | Lightning-fast HMR and optimized production builds |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Animations** | Framer Motion 12 | Page transitions, blob morphs, and micro-interactions |
| **OCR Engine** | Tesseract.js 6 | Client-side receipt text extraction (Gemini fallback) |
| **AI Vision** | Gemini 1.5 Flash | Server-side receipt analysis, NL parsing, chatbot, line-item extraction |
| **Voice Input** | Web Speech API | Browser-native speech-to-text for Aaru (`en-IN` locale) |
| **Real-Time** | Server-Sent Events | Push notifications without WebSocket overhead |
| **OAuth** | @react-oauth/google | One-tap Google sign-in from intro and login screens |
| **QR Scanner** | jsQR | Real-time UPI QR code decoding from camera feed |
| **QR Generator** | qrcode.react | Dynamic QR generation for friend invite links |
| **Icons** | React Icons | Comprehensive icon library |
| **Routing** | React Router 7 | Protected + public route management |
| **Server** | Express.js 4 | RESTful API with full middleware pipeline |
| **Database** | MongoDB Atlas + Mongoose 9 | Cloud-hosted NoSQL with ODM |
| **Auth** | JWT + bcryptjs + Google OAuth | Stateless tokens, bcrypt hashing, social login |
| **Validation** | Zod | Server-side schema validation |
| **Security** | Helmet + rate-limit + slowdown + Morgan | XSS, CORS, rate limiting, HTTP logging |
| **File Uploads** | Multer | In-memory image handling for receipt scanning |
| **Caching** | MongoDB TTL Collections | 24h response cache for Gemini API calls |
| **PWA** | vite-plugin-pwa + Workbox | Offline caching, installable, auto-update |
| **Hosting** | Cloudflare Pages (FE) + Render (BE) | Global CDN frontend, auto-deploy backend |

<br/>

---

<br/>

## 📂 Project Structure

```
smart-split/
├── public/
│   ├── aaru-robot.svg           # Aaru chatbot avatar
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── _redirects               # Cloudflare Pages SPA routing
├── src/
│   ├── App.jsx                  # Route definitions, auth guards, Aaru container
│   ├── main.jsx
│   ├── index.css                # Tailwind + Aaru animations + blob styles
│   ├── components/
│   │   ├── Aaru.jsx             # Floating NL chatbot + voice input + quick-reply chips
│   │   ├── Navbar.jsx           # Top nav + SSE notification streaming
│   │   ├── BottomNav.jsx        # Mobile bottom navigation (5 tabs + onboarding guides)
│   │   ├── OnboardingGuide.jsx  # Spotlight walkthrough (5-step SVG mask overlay)
│   │   ├── ScanReceipt.jsx      # Camera OCR + image compression + line items + UPI QR
│   │   ├── MobileOnboarding.jsx # Swipeable intro carousel with Google sign-in
│   │   ├── InsightsPanel.jsx    # AI spending insights display
│   │   └── Statscard.jsx        # Reusable metric display card
│   ├── pages/
│   │   ├── Home.jsx             # Landing + auth + blob transitions + Google OAuth
│   │   ├── Dashboard.jsx        # Metrics, donut chart, activity feed, onboarding trigger
│   │   ├── Groups.jsx           # Group CRUD + member management
│   │   ├── Expenses.jsx         # Per-group expense list + add expense modal
│   │   ├── Balances.jsx         # Settlements + UPI deep links + auto-prompt + payment notifs
│   │   ├── Friends.jsx          # Friend list + QR share + friend requests
│   │   ├── AddFriend.jsx        # Public QR scan landing page
│   │   └── Profile.jsx          # Settings, themes, avatar, UPI ID
│   └── utils/
│       ├── api.js               # Authenticated fetch wrapper + auth state
│       ├── debts.js             # Greedy debt simplification algorithm
│       ├── categories.js        # 200+ keyword category matcher (8 types)
│       ├── export.js            # CSV export with UTF-8 BOM encoding
│       ├── insights.js          # Spending pattern analysis
│       └── theme.js             # 6 accent presets + dark mode engine
├── backend/
│   ├── server.js                # Express: CORS, Helmet, Morgan, rate limiting, routes
│   ├── config/database.js
│   ├── controllers/
│   │   ├── authController.js    # Email/password auth + Google OAuth
│   │   ├── expenseController.js # Expenses + Aaru parse/advice endpoints
│   │   ├── friendController.js
│   │   ├── groupController.js
│   │   └── groupRequestController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification + requireGroupMember guard
│   │   ├── aaruRateLimit.js     # Per-user Gemini rate limiting (10/hr, 50/day)
│   │   └── validate.js          # Zod schema validation middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js             # Groups + admin roles + isMember/isAdmin helpers
│   │   ├── Expense.js
│   │   ├── Friendship.js
│   │   ├── GroupRequest.js
│   │   ├── Notification.js
│   │   ├── ActivityLog.js       # Immutable audit trail (update/delete blocked)
│   │   ├── AaruCache.js         # SHA-256 response cache with 24h TTL
│   │   ├── AaruUsage.js         # Rate limit tracking per user
│   │   └── Payment.js
│   ├── routes/
│   │   ├── expenseRoutes.js     # Includes /parse-text and /aaru-advice (rate limited)
│   │   ├── notificationRoutes.js # SSE streaming + pushToUser + CRUD
│   │   └── ...
│   ├── utils/
│   │   └── gemini.js            # Gemini API: vision, NL parsing, advice + regex-first + cache
│   └── validators/
├── vite.config.js               # PWA manifest + Workbox config + dev proxy
├── tailwind.config.js
└── render.yaml                  # Render backend deploy config
```

<br/>

---

<br/>

## 🤖 Aaru — AI Expense Assistant

Aaru is the floating AI assistant at the bottom-right corner of every page after login. It understands natural language via text or **voice input** and either logs an expense or answers spending questions.

### Expense flow

```
User: "pizza rs 500 with aarushi"  (typed or spoken via 🎤)
  → looksLikeQuestion() = false
  → POST /api/expenses/parse-text
  → Regex-first → 24h cache → Gemini 1.5 Flash → local fallback
  → { title:"pizza", amount:500, category:"food", people:["aarushi"] }
  → ConfirmCard rendered in chat
  → User selects group → expense added → SSE notification sent
```

### Question flow

```
User: "how much did I spend this month?"
  → looksLikeQuestion() = true
  → POST /api/expenses/aaru-advice
  → Context trimming (200 chars, max 5 groups) → cache → Gemini
  → AI generates personalized spending insights
```

### Smart features

| Feature | Details |
|:--------|:--------|
| **Voice Input** | Web Speech API (`en-IN` locale) — tap the mic, speak your expense, auto-fills the text field |
| **Quick-Reply Chips** | Pre-built prompts ("₹ for lunch", "Split 3 ways", "How much do I owe?") + your first 3 group names |
| **Rate Limiting** | 10 requests/hour + 50/day per user to prevent Gemini API abuse |
| **Response Cache** | SHA-256 hash → 24h MongoDB TTL cache for identical queries |
| **Regex-First** | 200+ keyword rules tried before hitting the API — instant response for common inputs |

### Local regex parser — zero dependency fallback

| Input | Result |
|:------|:-------|
| `pizza rs 500 with aarushi` | food · ₹500 · [aarushi] |
| `uber 150 with vishal` | travel · ₹150 · [vishal] |
| `movie tickets 800 split 3 ways` | entertainment · ₹800 · 3-way |
| `petrol 300` | travel · ₹300 |
| `lunch ₹250 for me and priya` | food · ₹250 · [priya] |

<br/>

---

<br/>

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (free M0 tier works)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/AaravPilania/Smart-Split.git
cd Smart-Split
npm install
cd backend && npm install
```

### 2. Environment Variables

**Project root `.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**`/backend/.env`**
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/smartsplit
JWT_SECRET=your-secret-key-min-32-chars
PORT=5000
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key   # Optional — regex fallback works without it
GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Run

```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
npm run dev
```

Open **http://localhost:5173**

<br/>

---

<br/>

## 🔌 API Reference

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/signup` | Register (name, username, email, password) |
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/auth/profile/:userId` | Fetch profile |
| `PUT` | `/api/auth/profile/:userId` | Update name, email, password, UPI ID, avatar |

</details>

<details>
<summary><strong>Groups</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/groups` | Create group |
| `GET` | `/api/groups?userId=X` | Get user's groups |
| `GET` | `/api/groups/:id` | Group with populated members |
| `POST` | `/api/groups/:id/members` | Add members |
| `GET` | `/api/groups/:groupId/activity` | Activity log (last 50) |

</details>

<details>
<summary><strong>Expenses</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/expenses/group/:groupId` | Add expense |
| `GET` | `/api/expenses/group/:groupId` | List expenses |
| `GET` | `/api/expenses/group/:groupId/balances` | Per-member balances |
| `GET` | `/api/expenses/group/:groupId/settlements` | Optimal settlement plan |
| `POST` | `/api/expenses/:expenseId/settle` | Mark settled |
| `PUT` | `/api/expenses/:expenseId` | Edit expense |
| `DELETE` | `/api/expenses/:expenseId` | Delete expense |
| `POST` | `/api/expenses/analyze-receipt` | Image → Gemini Vision extract |
| `POST` | `/api/expenses/parse-text` | NL text → expense object |
| `POST` | `/api/expenses/aaru-advice` | Budget question → Gemini answer |
| `POST` | `/api/expenses/suggest-category` | Title → category |

</details>

<details>
<summary><strong>Friends</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/friends/request/:recipientId` | Send request |
| `GET` | `/api/friends` | Friends list |
| `GET` | `/api/friends/requests` | Pending requests |
| `PATCH` | `/api/friends/accept/:id` | Accept |
| `PATCH` | `/api/friends/reject/:id` | Reject |
| `DELETE` | `/api/friends/:friendId` | Remove |

</details>

<details>
<summary><strong>Notifications</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/notifications/stream?token=JWT` | **SSE stream** — real-time push |
| `POST` | `/api/notifications` | Send payment reminder (+ SSE push) |
| `GET` | `/api/notifications` | Get notifications (latest 50) |
| `PATCH` | `/api/notifications/read-all` | Mark all read |
| `PATCH` | `/api/notifications/:id/read` | Mark one read |

</details>

<details>
<summary><strong>Users</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/users/search?q=X` | Search by name, email, or @username |

</details>

<br/>

---

<br/>

## 🧮 Debt Simplification Algorithm

```
Before                    After
──────                    ─────
A → B  ₹300               A → C  ₹200
B → C  ₹200               B → C  ₹100
A → C  ₹100
C → A  ₹200               4 transactions → 2 ✓
```

Net balances are computed per person, creditors and debtors are sorted, then a greedy two-pointer match iteratively pairs the largest debt against the largest credit — optimal for most real-world cases.

<br/>

---

<br/>

## 🏷️ Smart Category Detection

```
Input → Regex-first (200+ keywords, instant)
      → Cache hit? Return cached result (24h TTL)
      → Gemini 1.5 Flash classification
      → Cache write for future requests
```

| Category | Examples |
|:---------|:---------|
| 🍕 Food | Swiggy, Zomato, KFC, biryani, chai, dhaba |
| ✈️ Travel | Uber, Ola, Rapido, petrol, IRCTC, flights |
| 🏠 Home | Rent, society, furniture, plumber |
| 🎬 Entertainment | PVR, INOX, Netflix, Spotify, gaming |
| 🛍️ Shopping | Amazon, Flipkart, Myntra, Croma |
| 💊 Health | Apollo, gym, pharmacy, 1mg, salon |
| 💡 Utilities | Airtel, Jio, electricity, EMI, insurance |
| 💼 Other | Everything else |

<br/>

---

<br/>

## 💳 UPI Settlement Flow

- Aggregates pending settlements across all groups using **Smart Debt Simplification** (toggle between Standard and Smart views)
- Displays payee UPI ID (from their profile)
- Set Default saves your preferred UPI app for one-tap future payments
- Falls back to QR code scanning when no UPI ID is set
- **Auto-detects app switch** — when you return from UPI, a "Payment complete?" prompt appears
- **Real-time payment notifications** — payee instantly receives "X paid you ₹Y in GroupName! 🎉" via SSE

<br/>

---

<br/>

## 🔴 Real-Time Notifications (SSE)

```
┌─────────┐   SSE stream   ┌─────────┐
│ Browser │ ◄────────────  │  Server │
│ Event   |                |         |
| Source  │   text/event   │ Express │
└─────────┘   -stream      └─────────┘
                               │
               Push on:        │
               • New expense   │
               • Payment sent  │
               • Friend request│
               • Reminders     │
```

- **Primary**: Server-Sent Events with JWT auth via query param
- **Fallback**: 60-second polling interval if SSE disconnects
- **Multi-tab**: In-memory `Map<userId, Set<response>>` supports multiple concurrent connections
- **Render-compatible**: `X-Accel-Buffering: no` header prevents proxy buffering
- **Heartbeat**: `:ping` every 30 seconds to keep the connection alive

<br/>

---

<br/>

## 📱 Progressive Web App

- **Installable** — Add to Home Screen, runs standalone with window controls overlay
- **Offline** — Workbox precaches JS, CSS, HTML, fonts, images (max 3 MB per file)
- **Network-first API** — API responses cached 5-min TTL, 50-entry limit
- **Auto-update** — `skipWaiting` + `clientsClaim` for instant activation
- **Theme sync** — PWA title bar follows your accent color
- **Portrait lock** — Orientation locked to portrait for mobile-first experience

<br/>

---

<br/>

## 🎓 Onboarding Spotlight Guide

First-time users get a **5-step interactive walkthrough** that highlights real UI elements with an animated SVG spotlight mask:

1. **Dashboard** — "See total spend, debts owed, and recent activity at a glance"
2. **Groups** — "Create groups for trips, roommates, anything. Add members by QR"
3. **Quick Actions** — "Scan a receipt or ask Aaru to log an expense in plain English"
4. **Friends** — "Add friends via QR. Once connected, split expenses together"
5. **Settle Up** — "One tap to pay via UPI — Google Pay, PhonePe, or Paytm"

Triggered automatically for guest users and first-time signups via `sessionStorage`.

<br/>

---

<br/>

## 🔐 Security

| Layer | Implementation |
|:------|:---------------|
| **Auth** | JWT, 7-day expiry + Google OAuth 2.0 |
| **Passwords** | bcryptjs, 10 salt rounds |
| **Rate limiting** | 600 req/15min general · 10 req/15min auth · 10/hr + 50/day per-user Aaru |
| **Slowdown** | +50ms/req over 200/15min, capped at 2s |
| **Headers** | Helmet.js (XSS, HSTS, CSP) |
| **CORS** | `thesmartsplit.pages.dev`, `*.pages.dev`, localhost only |
| **Body limit** | 2 MB JSON (supports base64 group images) |
| **Validation** | Zod on all mutation endpoints |
| **Group guards** | `requireGroupMember` middleware — only members can view/modify group data |
| **Admin roles** | Group creators are auto-assigned admin; admin-only operations enforced |
| **Audit trail** | Immutable `ActivityLog` — pre-hooks block all update/delete operations |
| **Request logging** | Morgan HTTP logger on all requests |
| **Session** | localStorage (remember me) / sessionStorage (default) |

<br/>

---

<br/>

## 🌐 Deployment

```
  ┌──────────────────┐   HTTPS    ┌──────────┐   MongoDB Atlas
  │  Cloudflare Pages│ ◄────────► │  Render  │ ◄──────────────► 🗄️
  │  (React + PWA)   │            │ (Express)│
  └──────────────────┘            └──────────┘
    Global CDN edge                keep-alive self-ping
    thesmartsplit.pages.dev        every 14 minutes
```

**Cloudflare Pages** — global CDN, instant cache invalidation on every push to `main`  
**Render** — auto-deploy from Git, keep-alive self-ping every 14 min to prevent cold starts  
**MongoDB Atlas** — M0 free tier

### Backend environment variables (Render)

| Variable | Value |
|:---------|:------|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | ≥ 32 char secret |
| `CORS_ORIGIN` | `https://thesmartsplit.pages.dev` |
| `GEMINI_API_KEY` | Google Gemini key (optional) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `RENDER_EXTERNAL_URL` | Auto-set by Render |

### Frontend environment variables (Cloudflare Pages)

| Variable | Value |
|:---------|:------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Same Google OAuth client ID |

<br/>

---

<br/>

## 🎨 Theming

| Theme | Gradient |
|:------|:---------|
| 🩷 Pink | `#ec4899` → `#f472b6` *(default)* |
| 💜 Violet | `#8b5cf6` → `#a78bfa` |
| 🌊 Ocean | `#0ea5e9` → `#38bdf8` |
| 💚 Emerald | `#10b981` → `#34d399` |
| 🌅 Sunset | `#f97316` → `#fb923c` |
| 🌑 Night | `#6366f1` → `#818cf8` |

<br/>

---

<br/>

## 📷 Advanced Receipt Scanner

| Feature | Details |
|:--------|:--------|
| **Image Compression** | Images >500 KB auto-resized to max 1280px and JPEG 80% before upload |
| **Dual Pipeline** | Primary: Gemini Vision API → Fallback: Tesseract.js client-side OCR |
| **Line Items** | Gemini extracts individual items with names and prices, displayed in a collapsible list |
| **Smart Amount** | Bottom-to-top priority scan for "total due", "grand total", "balance" keywords |
| **QR Detection** | Continuous `requestAnimationFrame` loop with jsQR for UPI and friend QR codes |

<br/>

---

<br/>

## 📊 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Cloudflare Pages CDN                     │
│               React 19 + Vite 7 + Tailwind PWA               │
├──────────────────────────────────────────────────────────────┤
│  Home.jsx       │  Dashboard    │  Aaru.jsx    │  Balances   │
│  blob transitions│  donut chart │  voice input │  UPI deep   │
│  Google OAuth   │  activity feed│  quick chips │  links      │
│  onboarding     │  spotlight    │  NL parsing  │  auto-prompt│
├──────────────────────────────────────────────────────────────┤
│              EventSource (SSE) ← Notifications →             │
├──────────────────────────────────────────────────────────────┤
│                       Render (Express 4)                     │
│  JWT + Google OAuth │ Helmet │ Morgan │ Rate Limiting        │
│  requireGroupMember │ Zod    │ Multer │ aaruRateLimit        │
├──────────────────────────────────────────────────────────────┤
│  Gemini 1.5 Flash API  │  Regex fallback  │  AaruCache (24h) │
├──────────────────────────────────────────────────────────────┤
│                     MongoDB Atlas (M0)                       │
│  Users │ Groups │ Expenses │ Notifications │ ActivityLog     │
│  Friendships │ GroupRequests │ AaruCache │ AaruUsage         │
└──────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 🆕 Latest Updates

### UI Overhaul — Pink & Amber Theme

| Change | Details |
|:-------|:--------|
| **Theme Refresh** | Full pink (`#ec4899`) + amber (`#f97316`) palette — all purple references removed across the entire app |
| **Hero Section** | 4-slide swipeable intro with AI-Powered receipt visual on slide 1, actual app logo in top-left branding bar |
| **Lightning Bolt FAB** | Center FAB redesigned with bolt icon, neon press animation, and smaller 14×14 profile |
| **Login Page** | Animated gradient background, floating ambient orbs, app logo replaces generic icon, smooth form transitions |
| **Blob Transitions** | Expand **from the button you pressed** — origin tracked via `getBoundingClientRect()`, 0.55s ease curve |
| **Wave Trend Chart** | 6-month spending visualized as a smooth SVG cubic bezier curve with gradient fill and glow filter |
| **UPI App Logos** | GPay, PhonePe, Paytm buttons with inline SVG logos + app-specific URL schemes (`tez://`, `phonepe://`, `paytmmp://`) |
| **Partial Settlement** | Editable amount input in UPI modal — pay any portion with real-time "Partial: ₹X of ₹Y" indicator |
| **Local Caching** | `cachedApiFetch()` with 5-min TTL stale-while-revalidate — Dashboard loads instantly from cache |
| **Keyboard Fix** | Virtual keyboard on mobile no longer covers Aaru's input — `visualViewport` listener adjusts sheet position |

### Smooth Animations Everywhere

| Element | Animation |
|:--------|:----------|
| **Sign Out** | Page fades + scales down before navigating; confirmation modal slides up with spring physics |
| **QR Code (Friends)** | Height-animated reveal with spring transition instead of abrupt toggle |
| **All Modals** | 11 modals across Groups, Expenses, Balances, and ScanReceipt wrapped in `AnimatePresence` — backdrop fades, card slides up with spring |
| **Camera/QR Overlays** | Fade in/out transitions for fullscreen camera and QR scanner views |
| **Page Transitions** | `AnimatePresence mode="wait"` with 0.22s fade-in, 0.14s fade-out on all routes |

<br/>

---

<br/>

## 🤝 Contributing

1. Fork the repository
2. `git checkout -b feat/your-feature`
3. `git commit -m 'feat: your feature'`
4. `git push origin feat/your-feature`
5. Open a Pull Request

<br/>

---

<br/>


<div align="center">

---

**Built with mass amounts of caffeine and mass amounts of late nights**

**[Smart Split](https://thesmartsplit.pages.dev)** — Because friendships shouldn't have a price tag.

</div>
