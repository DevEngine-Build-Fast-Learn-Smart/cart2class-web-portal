# Cart2Class Web Portal & Content Management System

A mission-based educational grocery learning portal built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + RLS + Storage + Auth)**. 

Cart2Class bridges classroom learning with real-world supermarket trips. Students use physical QR cards on the Flutter mobile app to scan grocery items, practice phonics, read fluency passages, solve math challenges, and earn stars toward classroom celebrations.

---

## 🌐 Live Production URLs

| Page / Portal | Live URL | Color Theme & Scope |
| :--- | :--- | :--- |
| **🏠 Landing Screen (Home)** | [cart2class-web-portal.vercel.app](https://cart2class-web-portal.vercel.app) | Animated hero, K-2 pedagogy showcase & direct portal gateways |
| **🏛️ Super Admin Login** | [cart2class-web-portal.vercel.app/super-admin](https://cart2class-web-portal.vercel.app/super-admin) | **Blues** · District governance, FERPA/COPPA compliance & system oversight |
| **🍎 Teacher Login** | [cart2class-web-portal.vercel.app/teacher](https://cart2class-web-portal.vercel.app/teacher) | **Purples** · Classroom missions, voice recording reviews & student QR cards |
| **👨‍👩‍👧 Parent & Guardian Login** | [cart2class-web-portal.vercel.app/parent](https://cart2class-web-portal.vercel.app/parent) | **Yellows** · Child reading playback, grocery star progress & family rewards |
| **🛒 Store Partner Login** | [cart2class-web-portal.vercel.app/store](https://cart2class-web-portal.vercel.app/store) | **Greens** · Storefront check-in kiosk, produce barcode catalog & check-ins |
| **🚪 General Portal Gateway** | [cart2class-web-portal.vercel.app/login](https://cart2class-web-portal.vercel.app/login) | Role-selector gateway & unified fallback sign-in |

> **Note on Role-Separated Security:** Each portal URL strictly enforces credentials for its respective role. Users attempting to sign in on an unauthorized role URL will have their session rejected and will be directed to their designated portal.

---

## 🌟 The 4 Portal Roles

| Role | Access URL | Primary Responsibilities |
| :--- | :--- | :--- |
| **A.L.M.A. Admin** | `/super-admin` ➔ `/admin` | Root authority: registers verified schools (NCES/District claims), provisions classrooms, stores, teachers, parents, reviews curriculum missions, audits system logs. |
| **Teacher** | `/teacher` | Creates four-stage learning missions, manages classroom rosters, prints student QR card sheets, reviews student reading voice recordings, tracks star goals. |
| **Parent** | `/parent` | Links children via private invite codes, tracks completed supermarket missions, listens to child reading audio, views aisle phonics & math tips. |
| **Store Partner** | `/store` | Displays printable storefront check-in QR posters, tracks aggregate student visits, manages sponsored class rewards (e.g. pizza party). *Zero access to student identities.* |

---

## 🚀 Key Modules & Capabilities

1. **Mission Content Management System (CMS):**
   - Structured 4-stage builder:
     - **Stage 1 (Phonemic Awareness):** Multiple choice audio/spoken prompts, image hints.
     - **Stage 2 (Products & Barcodes):** Scannable Code128 / UPC grocery items with pricing & weight provenance.
     - **Stage 3 (Reading Fluency):** Full passages with private voice recording uploads.
     - **Stage 4 (Mathematics):** Real-world aisle math (unit cost, comparison, quantity).
   - Approval lifecycle: `Draft` ➔ `Submitted` ➔ `Under Review` ➔ `Approved` ➔ `Published`.

2. **QR & Barcode Telemetry & Usage Counters:**
   - Real-time scan telemetry tracking across Product Barcodes, Mission QRs, Student Login Cards, and Store Check-ins.
   - Interactive testing buttons and filter/sort by usage frequency.

3. **Zero-Typing Student QR Login:**
   - Young learners log in instantly by showing their laminated student card to the tablet camera.
   - Opaque token hashes stored in `student_qr_credentials`.
   - See [`cart2class_app_readme.md`](./cart2class_app_readme.md) for full Flutter Dart code and offline caching architecture.

4. **Legal School Claims & Verification:**
   - Schools registered with official NCES School ID, School District / LEA, Principal / Administrator details, and institutional verification status.

5. **Security & COPPA Compliance:**
   - No GPS tracking. No facial recognition. Minimal student PII (first name + last initial only).
   - Audio recordings stored in a private Supabase Storage bucket accessible solely by verified teachers and linked parents through time-limited signed URLs.

---

## 🔑 Development Demo Credentials

| Role | Email | Password | Dedicated Login URL |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin1@gmail.com` | `12345678` | [`/super-admin`](https://cart2class-web-portal.vercel.app/super-admin) |
| **Teacher** | `teacher1@gmail.com` | `12345678` | [`/teacher`](https://cart2class-web-portal.vercel.app/teacher) |
| **Parent** | `parent1@gmail.com` | `12345678` | [`/parent`](https://cart2class-web-portal.vercel.app/parent) |
| **Store Partner** | `store1@gmail.com` | `12345678` | [`/store`](https://cart2class-web-portal.vercel.app/store) |

*Note: In development, these accounts are provisioned via `ALLOW_DEMO_USERS=true`. In production, accounts are provisioned securely through the Admin panel.*

---

## 🏡 How to Pull and Work from Home (Quick Start Guide)

When you return home, follow these steps to get the project running immediately:

### Step 1: Clone or Pull the Repository

If you haven't cloned it yet on your home machine:
```bash
git clone https://github.com/DevEngine-Build-Fast-Learn-Smart/cart2class-web-portal.git
cd cart2class-web-portal
```

If you already have a local copy on your home machine, pull the latest changes:
```bash
git pull origin main
```

### Step 2: Configure Environment Variables

Create your local environment file:
```bash
cp .env.example .env.local
```

Open `.env.local` and ensure your Supabase project credentials are set:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxmzpgicfcamizjschfy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALLOW_DEMO_USERS=true
```

*(Never commit `.env.local` to GitHub. It is protected by `.gitignore`.)*

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can sign in immediately using any of the 4 demo accounts above!

### Step 5: Verification Commands

Before creating a new pull request or pushing further changes, verify typing and build:
```bash
npm run typecheck    # Verifies all TypeScript types pass
npm run build        # Verifies all 32 Next.js routes compile
```

---

## 📱 Mobile Student App Integration

For full API specifications, Flutter Dart camera code, offline SQLite caching architecture, and the complete zero-typing login sequence, refer to:
👉 **[`cart2class_app_readme.md`](./cart2class_app_readme.md)**

---

## 📄 License & Confidentiality

Property of Cart2Class / A.L.M.A. Educational Technologies. All rights reserved.
