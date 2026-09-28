# 📚 Student Library Management System

A modern, full-featured library management system built with **React**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Designed for Indian study libraries and reading rooms.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple)

## ✨ Features

### 🎓 Student Portal
- **Dashboard** — View assigned seat, profile summary, and quick info
- **Profile Management** — Edit personal details, change password
- **Chat with Admin** — Real-time helpdesk messaging
- **ID Card** — Digital student ID card with QR code

### 🛡️ Admin Portal
- **Dashboard** — Real-time stats (students, seats, occupancy rate)
- **Student Management** — CRUD operations, search, filter, status management
- **Seat Management** — Visual seat grid with status tracking
- **Seat Allocation** — Step-by-step assignment workflow
- **Subscriptions** — Plan management (₹ INR pricing)
- **Helpdesk** — Chat with students, manage conversations
- **Settings** — Library configuration, branding, notifications
- **Notifications** — Bell dropdown with unread count

### 🌐 Public Pages
- **Landing Page** — Premium hero section with library image, features, floor map preview
- **Book a Demo** — Full-page demo booking form
- **Student Registration** — Self-service sign-up
- **Forgot Password** — Password recovery flow

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (recommended: 20+)
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/student-library-system.git
cd student-library-system

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173/`

### Demo Credentials

| Role    | Email / ID         | Password    |
|---------|-------------------|-------------|
| Admin   | admin@library.com | admin123    |
| Student | STU202601         | student123  |
| Student | STU202602         | student123  |
| Student | STU202603         | student123  |
| Student | STU202604         | student123  |
| Student | STU202605         | student123  |

> 💡 The app works in **Demo Mode** (localStorage) when Supabase is not configured. All data persists in browser storage.

## 🏗️ Project Structure

```
student-library-system/
├── public/
│   └── images/
│       └── hero-library.jpg        # Hero section background
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx     # Admin sidebar + topbar
│   │   │   ├── StudentLayout.tsx   # Student navigation
│   │   │   └── ProtectedRoute.tsx  # Role-based route guard
│   │   └── ui/                     # Reusable UI components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── BookDemoModal.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── DataTable.tsx
│   │       ├── DemoBanner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── NotificationDropdown.tsx
│   │       ├── Pagination.tsx
│   │       ├── SearchInput.tsx
│   │       ├── SeatMapPreview.tsx
│   │       ├── Select.tsx
│   │       ├── Skeleton.tsx
│   │       ├── StatsCard.tsx
│   │       └── StudentIDCard.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication state
│   ├── hooks/
│   │   ├── useChat.ts             # Messaging system
│   │   ├── useDashboardStats.ts   # Admin dashboard data
│   │   ├── useDemoBookings.ts     # Demo booking management
│   │   ├── useNotifications.ts    # Notification system
│   │   ├── useSeatAssignments.ts  # Seat allocation logic
│   │   ├── useSeats.ts            # Seat CRUD
│   │   ├── useStudents.ts         # Student CRUD
│   │   ├── useStudentSeat.ts      # Student's assigned seat
│   │   └── useSubscriptions.ts    # Subscription plans
│   ├── lib/
│   │   ├── auth.ts                # Auth helper functions
│   │   ├── mockStore.ts           # localStorage data layer
│   │   ├── supabase.ts            # Supabase client config
│   │   └── utils.ts               # Utility functions
│   ├── pages/
│   │   ├── admin/                  # Admin pages
│   │   ├── auth/                   # Login/Register/Forgot
│   │   ├── student/                # Student pages
│   │   ├── BookDemo.tsx            # Demo booking page
│   │   └── Landing.tsx             # Public landing page
│   ├── types/
│   │   └── database.ts            # TypeScript type definitions
│   ├── App.tsx                     # Routes & app structure
│   ├── index.css                   # Tailwind directives
│   └── main.tsx                    # Entry point
├── supabase/
│   ├── migration.sql               # Database schema
│   └── seed.sql                    # Sample data
├── .env.example                    # Environment template
├── netlify.toml                    # Netlify deployment config
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Connecting Supabase (Optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migration.sql` in the SQL Editor
3. Run `supabase/seed.sql` for sample data
4. Copy your project URL and anon key to `.env`

> Without Supabase, the app runs in **Demo Mode** using localStorage with pre-seeded data.

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

### Deploy to Netlify

**Option A: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**Option B: Git-based Deploy**
1. Push to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repo
5. Build settings are auto-detected from `netlify.toml`
6. Click "Deploy"

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

## 🎨 Customization

### Branding

Edit these files to customize for different clients:

| What | Where |
|------|-------|
| Library Name | `src/components/layout/AdminLayout.tsx`, `Landing.tsx` |
| Colors | `tailwind.config.js` (change indigo to any color) |
| Hero Image | Replace `public/images/hero-library.jpg` |
| Logo | Update BookOpen icon references in layouts |
| Currency | Search `₹` in source files |
| Seed Data | `src/lib/mockStore.ts` — edit `SEED_PROFILES` |

### Adding Supabase for Production

For production use with real database:
1. Create Supabase project
2. Run migration SQL
3. Update `.env` with real credentials
4. The app automatically switches from demo mode to Supabase

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| TypeScript 5.7 | Type Safety |
| Vite 6 | Build Tool |
| Tailwind CSS 3.4 | Styling |
| Framer Motion | Animations |
| Supabase | Backend (optional) |
| React Router 7 | Routing |
| Lucide React | Icons |
| React Hot Toast | Notifications |

## 📄 License

MIT License — Free for personal and commercial use.

---

**Built with ❤️ for Indian Study Libraries**
