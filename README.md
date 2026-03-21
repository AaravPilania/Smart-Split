<div align="center">

<br/>
<br/>

# ✦ Smart Split

### Split bills, not friendships.

<br/>

**The intelligent expense-sharing platform that makes splitting bills effortless.**
**Real-time tracking · AI receipt scanning · Smart categories · UPI settlements · QR friend invites**

<br/>

[![Live Demo](https://img.shields.io/badge/▶_LIVE_DEMO-thesmartsplit.netlify.app-F472B6?style=for-the-badge&logo=netlify&logoColor=white)](https://thesmartsplit.netlify.app)
&nbsp;&nbsp;
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
&nbsp;&nbsp;
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#-progressive-web-app)

<br/>
<br/>

---

<br/>

</div>

## 🧠 Why Smart Split?

> Most bill-splitting apps feel like spreadsheets. Smart Split feels like the future.

Built for the way real friend groups actually work — messy tabs, forgotten IOUs, and "I'll pay you back later" promises. Smart Split handles the math, the reminders, and the awkward conversations so you don't have to.

<br/>

<div align="center">

| | Feature | What it does |
|:--:|:--|:--|
| 🧾 | **AI Receipt Scanner** | Point your camera at any receipt — OCR extracts items, totals, and dates instantly |
| 🏷️ | **Smart Categories** | AI auto-detects expense categories from receipt text; manual picker with 8 categories |
| 👥 | **Smart Group Splits** | Create groups, add expenses, and let the algorithm calculate who owes what |
| 📊 | **Live Dashboards** | Real-time metrics: total spend, debts owed, monthly trends, category breakdowns |
| ⚡ | **UPI Settle Flow** | Pick a settlement, choose your UPI app, and pay — with "set default app" support |
| 💳 | **QR Code Payments** | Scan any UPI QR code to pay directly from within the app |
| 📱 | **QR Friend Invites** | Share your QR code — friends scan it and connect instantly, no typing needed |
| 🔔 | **Smart Reminders** | Nudge friends about pending payments with one tap |
| 📥 | **CSV Export** | Download expense reports for any group — perfect for trips and shared living |
| 🎨 | **6 Accent Themes** | Personalize with Pink, Violet, Ocean, Emerald, Sunset, or Night palettes |
| 🌙 | **Dark Mode** | Full dark theme with synced browser chrome and PWA title bar |
| 📡 | **Offline Ready** | Workbox-powered service worker caches data — works without internet |

</div>

<br/>

---

<br/>

## 📱 Mobile-First Design

Smart Split is built **mobile-first** as a Progressive Web App — install it on your home screen and it runs like a native app.

### Mobile Experience

```
┌─────────────────────────┐
│                         │
│      ✦ Smart Split      │   ← Branding at top-center
│                         │
│   Split bills, not      │   ← Hero heading (large, bold)
│     friendships.        │
│                         │
│  The smartest way to    │
│  track shared expenses  │   ← Tagline with breathing room
│                         │
│  🧾 Receipt  👥 Groups  │
│  📊 Balances ⚡ Settle  │   ← USP pills with spacing
│                         │
│                         │
│  ┌───────────────────┐  │
│  │  Welcome back     │  │
│  │                   │  │
│  │ [Sign In|Register]│  │   ← Auth card near bottom
│  │                   │  │      with enough breathing room
│  │  📧 Email         │  │
│  │  🔒 Password      │  │
│  │                   │  │
│  │  [ Sign In →  ]   │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

### Layout Philosophy

- **Heading** — Positioned between top and center, large and commanding
- **USP Pills** — Directly below the heading with comfortable spacing
- **Login Card** — Sits near the bottom with enough padding beneath, creating a natural visual flow
- **Glassmorphic UI** — Frosted glass cards over animated gradient blobs
- **Zero scroll** — Everything fits in one viewport, no scrolling on the login screen

### Desktop Experience

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ✦ Smart Split                                       │
│                                                      │
│  Split bills,              ┌──────────────────────┐  │
│  not friendships.          │  Welcome back         │  │
│                            │                      │  │
│  The smartest way to       │  [Sign In | Register] │  │
│  track shared expenses     │                      │  │
│  — automated splits,       │  📧 Email address     │  │
│  instant settlement,       │  🔒 Password          │  │
│  zero drama.               │                      │  │
│                            │  ☑ Keep me signed in  │  │
│  ✓ Track every shared bill │                      │  │
│  ✓ AI-powered receipt scan │  [ Sign In →       ]  │  │
│  ✓ Simplified debts        │                      │  │
│  ✓ QR code friend adds     │  New? Create account  │  │
│                            └──────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 🛠️ Tech Stack

<div align="center">

### Frontend

[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://motion.dev)
[![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com)

### Backend

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

### Infrastructure

[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://netlify.com)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com)
[![Workbox](https://img.shields.io/badge/Workbox_PWA-FF6F00?style=flat-square&logo=google&logoColor=white)](https://developer.chrome.com/docs/workbox)

</div>

<br/>

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **UI Framework** | React 19 | Component architecture with hooks |
| **Build Tool** | Vite 7 | Lightning-fast HMR and optimized builds |
| **Styling** | Tailwind CSS 3 | Utility-first responsive design |
| **Animations** | Framer Motion | Smooth page transitions and micro-interactions |
| **OCR Engine** | Tesseract.js 6 | Client-side receipt text extraction |
| **QR Scanner** | jsQR | Real-time UPI QR code decoding from camera |
| **QR Codes** | qrcode.react | Dynamic QR generation for friend invites |
| **Icons** | Lucide + React Icons | Consistent icon system |
| **Routing** | React Router 7 | Protected + public route management |
| **Server** | Express.js | RESTful API with middleware pipeline |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL with Mongoose ODM |
| **Auth** | JWT + bcryptjs | Stateless authentication with password hashing |
| **Security** | Helmet + Rate Limiting | XSS protection, CORS, request throttling |
| **PWA** | vite-plugin-pwa + Workbox | Offline caching, installable app, push-ready |
| **Hosting** | Netlify (FE) + Render (BE) | Auto-deploy with keep-alive cron |

<br/>

---

<br/>

## 📂 Project Structure

```
smart-split/
├── public/                  # Static assets & PWA icons
├── src/
│   ├── App.jsx              # Route definitions & auth guards
│   ├── main.jsx             # React entry point
│   ├── index.css            # Tailwind + animated blob styles
│   ├── components/
│   │   ├── Navbar.jsx       # Top nav + hamburger + notifications
│   │   ├── BottomNav.jsx    # Mobile bottom navigation
│   │   ├── ScanReceipt.jsx  # Camera OCR scanner + QR scanner + settle flow
│   │   └── Statscard.jsx    # Reusable metric display card
│   ├── pages/
│   │   ├── Home.jsx         # Landing + auth (glassmorphic UI)
│   │   ├── Dashboard.jsx    # Metrics, charts, recent activity
│   │   ├── Groups.jsx       # Group CRUD + member management
│   │   ├── Expenses.jsx     # Per-group expense tracking
│   │   ├── Balances.jsx     # Cross-group settlements view
│   │   ├── Friends.jsx      # Friend list + QR code sharing
│   │   ├── AddFriend.jsx    # Public QR scan landing page
│   │   └── Profile.jsx      # Settings, themes, avatar picker
│   └── utils/
│       ├── api.js           # API client + auth state management
│       ├── debts.js         # Greedy debt simplification algorithm
│       ├── categories.js    # AI expense categorization (8 types) + full-text detection
│       ├── export.js        # CSV export with BOM encoding
│       └── theme.js         # 6 accent presets + dark mode engine
├── backend/
│   ├── server.js            # Express app with security middleware
│   ├── config/
│   │   └── database.js      # MongoDB Atlas connection
│   ├── controllers/         # Route handlers (auth, groups, expenses…)
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── models/              # Mongoose schemas (User, Group, Expense…)
│   └── routes/              # Express route definitions
├── netlify/
│   └── functions/
│       └── keep-alive.js    # Cron ping to prevent cold starts
├── vite.config.js           # PWA manifest + dev proxy
├── tailwind.config.js       # Theme extensions
└── netlify.toml             # Build & redirect config
```

<br/>

---

<br/>

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB Atlas** account (free tier works)
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone https://github.com/your-username/smart-split.git
cd smart-split

# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Environment Variables

Create `.env` in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

Create `.env` in `/backend`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/smartsplit
JWT_SECRET=your-secret-key
PORT=5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
npm run dev
```

Open **http://localhost:5173** and you're in.

<br/>

---

<br/>

## 🔌 API Reference

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/signup` | Register (name, email, password) |
| `POST` | `/api/auth/login` | Login (email, password) → JWT |
| `GET` | `/api/auth/profile/:userId` | Fetch user profile |
| `PUT` | `/api/auth/profile/:userId` | Update name, email, or password |

</details>

<details>
<summary><strong>Groups</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/groups` | Create group |
| `GET` | `/api/groups?userId=X` | Get user's groups |
| `GET` | `/api/groups?all=true` | Discover all groups |
| `GET` | `/api/groups/:id` | Get group with members |
| `POST` | `/api/groups/:id/members` | Add members by ID |

</details>

<details>
<summary><strong>Expenses</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/expenses/group/:groupId` | Add expense with split + category |
| `GET` | `/api/expenses/group/:groupId` | List group expenses |
| `GET` | `/api/expenses/group/:groupId/balances` | Calculate balances |
| `GET` | `/api/expenses/group/:groupId/settlements` | Optimal settlements |
| `POST` | `/api/expenses/:expenseId/settle` | Mark as settled |

</details>

<details>
<summary><strong>Friends</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/friends/request/:recipientId` | Send friend request |
| `GET` | `/api/friends` | Get friends list |
| `GET` | `/api/friends/requests` | Pending requests |
| `PATCH` | `/api/friends/accept/:id` | Accept request |
| `PATCH` | `/api/friends/reject/:id` | Reject request |
| `DELETE` | `/api/friends/:friendId` | Remove friend |

</details>

<details>
<summary><strong>Notifications</strong></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/notifications` | Send payment reminder |
| `GET` | `/api/notifications` | Get notifications |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |

</details>

<br/>

---

<br/>

## 🧮 Debt Simplification Algorithm

Smart Split uses a **greedy two-pointer algorithm** to minimize the number of transactions needed to settle all debts:

```
Before simplification          After simplification
━━━━━━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━━━━━━
  A ──₹300──→ B                  A ──₹200──→ C
  B ──₹200──→ C                  B ──₹100──→ C
  A ──₹100──→ C
  C ──₹200──→ A                  3 txns → 2 txns ✓
```

The algorithm separates creditors from debtors, sorts them, and iteratively matches the smallest transferable amount — efficiently reducing transactions using a greedy heuristic. This is optimal in most real-world cases.

<br/>

---

<br/>

## 🏷️ Smart Category Detection

Every expense is automatically categorized using a **two-layer AI detection system**:

1. **Title-based detection** — Matches expense title against 200+ keywords across 8 categories
2. **Full-text OCR detection** — When scanning receipts, the entire OCR text is scored for category keywords (catches "restaurant", "cinema", etc. even when the title alone doesn't match)

| Category | Examples |
|:---------|:---------|
| 🍕 Food & Dining | Swiggy, Zomato, KFC, Dominos, Starbucks, chai, biryani, dhaba |
| ✈️ Travel | Uber, Ola, Rapido, IRCTC, MakeMyTrip, petrol, parking, flights |
| 🏠 Home & Rent | Rent, society, furniture, IKEA, plumber, packers & movers |
| 🎬 Entertainment | PVR, INOX, Netflix, Spotify, gaming, birthdays, festivals |
| 🛍️ Shopping | Amazon, Flipkart, Myntra, Croma, electronics, fashion |
| 💊 Health | Apollo, Fortis, gym, pharmacy, 1mg, salon, spa |
| 💡 Utilities | Airtel, Jio, electricity, EMI, insurance, mutual funds |
| 💼 Other | Anything that doesn't match the above |

Categories are **stored with each expense** in the database, so the Dashboard donut chart and expense list always show the correct category — even for manually-created expenses.

<br/>

---

<br/>

## 💳 UPI Settlement Flow

Settle debts directly from the app with the **built-in UPI integration**:

```
┌─ Settle Payment ─────────────────┐
│                                  │
│  Select a payment to settle:     │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Pay Rahul        ₹450.00  │→ │
│  │ Weekend Trip  rahul@upi   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Pay Priya        ₹200.00  │→ │
│  │ House Expenses             │  │
│  └────────────────────────────┘  │
│                                  │
│  ──── Choose UPI app ────────    │
│  ┌──────────┐  ┌──────────┐     │
│  │ Google   │  │ PhonePe  │     │
│  │  Pay     │  │          │     │
│  │[Use Once]│  │[Use Once]│     │
│  │[Default ]│  │[Default ]│     │
│  └──────────┘  └──────────┘     │
│                                  │
│  [ Scan QR Instead ]             │
└──────────────────────────────────┘
```

- Fetches all pending settlements across every group
- Shows payee UPI ID (fetched from their profile)
- **Set Default** saves your preferred UPI app for one-tap future payments
- Falls back to **QR code scanning** if the payee hasn't set their UPI ID

<br/>

---

<br/>

## 📱 Progressive Web App

Smart Split is a fully installable PWA:

- **Add to Home Screen** — Runs in standalone mode (no browser chrome)
- **Portrait-first** — Optimized for one-handed phone use
- **Offline caching** — Workbox caches static assets + API responses (5-min network-first)
- **Auto-update** — New versions deploy and activate seamlessly
- **Theme sync** — PWA title bar matches your chosen accent color

<br/>

---

<br/>

## 🔐 Security

| Layer | Implementation |
|:------|:---------------|
| **Authentication** | JWT tokens with 7-day expiration |
| **Passwords** | bcryptjs hashing (10 salt rounds) |
| **Rate Limiting** | 300 req/15min general · 20 req/15min auth |
| **Headers** | Helmet.js (XSS, HSTS, content-type sniffing) |
| **CORS** | Whitelisted origins only |
| **Body Parsing** | 10KB JSON limit to prevent payload abuse |
| **Session** | Dual storage — localStorage (remember) / sessionStorage (default) |

<br/>

---

<br/>

## 🌐 Deployment

### Architecture

```
  ┌──────────┐     HTTPS      ┌──────────┐     MongoDB Atlas
  │  Netlify │ ◄───────────► │  Render   │ ◄───────────────►  🗄️
  │ (React)  │   API calls    │ (Express) │     persistent
  └──────────┘                └──────────┘       storage
       │
  Cron: */5 min
  keep-alive ping ──────────────► /api/health
```

- **Frontend** → Netlify with SPA redirects and scheduled keep-alive function
- **Backend** → Render with auto-deploy from Git and environment secrets
- **Database** → MongoDB Atlas free tier (M0)
- **Cold-start mitigation** → Netlify cron pings the Render backend every 5 minutes

<br/>

---

<br/>

## 🎨 Theming

6 built-in accent presets — applied across gradients, buttons, badges, and the PWA chrome:

| Theme | Colors |
|:------|:-------|
| 🩷 **Pink** | `#ec4899` → `#f472b6` *(default)* |
| 💜 **Violet** | `#8b5cf6` → `#a78bfa` |
| 🌊 **Ocean** | `#0ea5e9` → `#38bdf8` |
| 💚 **Emerald** | `#10b981` → `#34d399` |
| 🌅 **Sunset** | `#f97316` → `#fb923c` |
| 🌑 **Night** | `#6366f1` → `#818cf8` |

Toggle dark mode from the navbar or profile page — it syncs the `<meta theme-color>`, Tailwind's `dark:` classes, and the browser's `color-scheme` in one click.

<br/>

---

<br/>

## 🤝 Contributing

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a **Pull Request**

<br/>

---

<br/>

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

<br/>

<div align="center">

---

<br/>

**Built with ☕ and late nights**

**[Smart Split](https://thesmartsplit.netlify.app)** — Because friendships shouldn't have a price tag.

<br/>
<br/>

</div>
