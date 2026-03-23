<div align="center">

<br/>
<br/>

# ✦ Smart Split

### Split bills, not friendships.

<br/>

**The intelligent expense-sharing platform that makes splitting bills effortless.**
**Real-time tracking · Gemini Vision receipt scan · Aaru NL expense chatbot · UPI settlements · QR friend invites**

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
| ✦ | **Aaru — Expense Assistant** | Floating chatbot (bottom-right). Type natural language like "pizza ₹500 with Priya" and Aaru parses it into a ready-to-confirm expense card. Powered by Gemini with a local regex fallback — works even without an API key. |
| 📷 | **Gemini Vision Scanner** | Point your camera at any receipt — Gemini reads the image natively and returns merchant name, total, and category instantly. Tesseract.js is the automatic client-side fallback. |
| 🏷️ | **Auto Categories** | Gemini AI detects expense categories from receipt text; 200+ keyword rules as local fallback. 8 categories: Food, Travel, Home, Entertainment, Shopping, Health, Utilities, Other. |
| 👥 | **Smart Group Splits** | Create groups, add members, log expenses — the greedy debt-simplification algorithm calculates who owes what with minimum transactions. |
| 📊 | **Live Dashboard** | Real-time metrics: total spend, debts owed, monthly trends, category donut chart, recent activity feed. |
| ⚡ | **UPI Settle Flow** | Pick a settlement, choose your UPI app (Google Pay, PhonePe, Paytm...), and pay — with "set default app" memory. |
| 📷 | **QR Code Payments** | Scan any UPI QR code to pay directly from within the app. |
| 🤝 | **QR Friend Invites** | Share your personal QR code — friends scan it and connect instantly, no manual search needed. |
| 🔔 | **Smart Reminders** | Nudge friends about pending payments with one tap — notifications appear in-app. |
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
| **Animations** | Framer Motion 12 | Page transitions and micro-interactions |
| **OCR Engine** | Tesseract.js 6 | Client-side receipt text extraction (Gemini fallback) |
| **AI Vision** | Gemini 1.5 Flash | Server-side receipt image analysis and NL expense parsing |
| **QR Scanner** | jsQR | Real-time UPI QR code decoding from camera feed |
| **QR Generator** | qrcode.react | Dynamic QR generation for friend invite links |
| **Icons** | React Icons | Comprehensive icon library |
| **Routing** | React Router 7 | Protected + public route management |
| **Server** | Express.js 4 | RESTful API with full middleware pipeline |
| **Database** | MongoDB Atlas + Mongoose 9 | Cloud-hosted NoSQL with ODM |
| **Auth** | JWT + bcryptjs | Stateless tokens, bcrypt password hashing (10 rounds) |
| **Validation** | Zod | Server-side schema validation |
| **Security** | Helmet + express-rate-limit + express-slow-down | XSS, CORS, rate limiting, progressive slowdown |
| **File Uploads** | Multer | In-memory image handling for receipt scanning |
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
│   │   ├── Aaru.jsx             # Floating NL expense chatbot
│   │   ├── Navbar.jsx           # Top nav + notification bell
│   │   ├── BottomNav.jsx        # Mobile bottom navigation (5 tabs)
│   │   ├── ScanReceipt.jsx      # Camera OCR + UPI QR scanner + settle flow
│   │   └── Statscard.jsx        # Reusable metric display card
│   ├── pages/
│   │   ├── Home.jsx             # Landing + auth (glassmorphic UI)
│   │   ├── Dashboard.jsx        # Metrics, donut chart, activity feed
│   │   ├── Groups.jsx           # Group CRUD + member management
│   │   ├── Expenses.jsx         # Per-group expense list + add expense modal
│   │   ├── Balances.jsx         # Cross-group settlements view
│   │   ├── Friends.jsx          # Friend list + QR share + friend requests
│   │   ├── AddFriend.jsx        # Public QR scan landing page
│   │   └── Profile.jsx          # Settings, themes, avatar, UPI ID
│   └── utils/
│       ├── api.js               # Authenticated fetch wrapper + auth state
│       ├── debts.js             # Greedy debt simplification algorithm
│       ├── categories.js        # 200+ keyword category matcher (8 types)
│       ├── export.js            # CSV export with UTF-8 BOM encoding
│       └── theme.js             # 6 accent presets + dark mode engine
├── backend/
│   ├── server.js                # Express: CORS, Helmet, rate limiting, routes
│   ├── config/database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── expenseController.js # Expenses + Aaru parse/advice endpoints
│   │   ├── friendController.js
│   │   ├── groupController.js
│   │   ├── groupRequestController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   └── validate.js          # Zod schema validation middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Expense.js
│   │   ├── Friendship.js
│   │   ├── GroupRequest.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── expenseRoutes.js     # Includes /parse-text and /aaru-advice
│   │   └── ...
│   ├── utils/
│   │   └── gemini.js            # Gemini API: vision, NL parsing, advice, local fallback
│   └── validators/
├── vite.config.js               # PWA manifest + Workbox config + dev proxy
├── tailwind.config.js
└── render.yaml                  # Render backend deploy config
```

<br/>

---

<br/>

## 🤖 Aaru — Expense Assistant

Aaru is the floating AI expense assistant at the bottom-right corner of every page after login. It understands natural language and either logs an expense or answers spending questions.

### Expense flow

```
User: "pizza rs 500 with aarushi"
  → looksLikeQuestion() = false
  → POST /api/expenses/parse-text
  → Gemini 1.5 Flash  OR  local regex parser (always available)
  → { title:"pizza", amount:500, category:"food", people:["aarushi"] }
  → ConfirmCard rendered in chat
  → User selects group → expense added
```

### Question flow

```
User: "how much did I spend this month?"
  → looksLikeQuestion() = true
  → POST /api/expenses/aaru-advice
  → Gemini generates contextual response (uses group names as context)
```

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
```

**`/backend/.env`**
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/smartsplit
JWT_SECRET=your-secret-key-min-32-chars
PORT=5000
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key   # Optional
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
| `POST` | `/api/notifications` | Send payment reminder |
| `GET` | `/api/notifications` | Get notifications |
| `PATCH` | `/api/notifications/read-all` | Mark all read |

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

1. **Gemini AI** — server-side classification from receipt image or title
2. **200+ keyword rules** — local fallback matching

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

- Aggregates pending settlements across all groups
- Displays payee UPI ID (from their profile)
- Set Default saves your preferred UPI app for one-tap future payments
- Falls back to QR code scanning when no UPI ID is set

<br/>

---

<br/>

## 📱 Progressive Web App

- **Installable** — Add to Home Screen, runs standalone
- **Offline** — Workbox precaches JS, CSS, HTML, fonts, images
- **Network-first API** — API responses cached 5-min TTL, 50-entry limit
- **Auto-update** — `skipWaiting` + `clientsClaim` for instant activation
- **Theme sync** — PWA title bar follows your accent color

<br/>

---

<br/>

## 🔐 Security

| Layer | Implementation |
|:------|:---------------|
| **Auth** | JWT, 7-day expiry |
| **Passwords** | bcryptjs, 10 salt rounds |
| **Rate limiting** | 600 req/15min general · 10 req/15min on `/api/auth/` |
| **Slowdown** | +50ms/req over 200/15min, capped at 2s |
| **Headers** | Helmet.js (XSS, HSTS, CSP) |
| **CORS** | `thesmartsplit.pages.dev`, `*.pages.dev`, localhost only |
| **Body limit** | 10 KB JSON |
| **Validation** | Zod on all mutation endpoints |
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
| `RENDER_EXTERNAL_URL` | Auto-set by Render |

### Frontend environment variables (Cloudflare Pages)

| Variable | Value |
|:---------|:------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

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

## 🤝 Contributing

1. Fork the repository
2. `git checkout -b feat/your-feature`
3. `git commit -m 'feat: your feature'`
4. `git push origin feat/your-feature`
5. Open a Pull Request

<br/>

---

<br/>

## 📄 License

MIT License — see [LICENSE](LICENSE).

<br/>

<div align="center">

---

**Built with coffee and late nights**

**[Smart Split](https://thesmartsplit.pages.dev)** — Because friendships shouldn't have a price tag.

</div>
