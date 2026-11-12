# KKC Family Website & Archive 🌳

A premium, elegant, and responsive family portal built with **React**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

---

## 🌟 Key Features

### 🏛️ Main Family Website
- **Warm, Timeless Heritage Design**: Built with refined serif typography (`Playfair Display`), warm amber and stone earth tones, subtle ornaments, and accessible responsive layouts.
- **Interactive Family Tree (`/tree`)**:
  - Pan, smooth zoom, and pinch controls for phones, tablets, and desktops powered by `react-zoom-pan-pinch`.
  - Couples displayed side-by-side with spouse linkage.
  - Expandable and collapsible descendant branches.
  - Clicking any member opens an interactive profile drawer with instant details.
- **Family Members Directory (`/members`)**:
  - Search by name, occupation, or hometown.
  - Filter by Generation or Family Branch.
  - Cards show calculated age, generation badges, and status.
- **Comprehensive Member Profiles (`/members/:id`)**:
  - Full biographical archive, milestones, birthplace, and career.
  - Relationship links (parents, spouses, children, siblings).
  - Private contact details and notes are **strictly concealed** from public visitors.
- **Family History & Milestones (`/history`)**:
  - Elegant alternating timeline for migration stories, ancestral beginnings, weddings, and milestones.
- **Photo Gallery (`/gallery`)**:
  - Categorized gallery (Portraits, Reunions, Historical, Weddings, Celebrations).
  - High-resolution modal lightbox with keyboard and swipe navigation.

---

### 🛡️ Private Admin Area (`/admin`)
- **Founders Setup Wizard (`/admin/setup-founders`)**:
  - Specialized starting-point setup to add the First Family Head and Partner.
  - Pre-wired with the user's uploaded archival photograph (`/uploads/founders.jpg`).
  - Automatically initializes Generation 1 and creates their spouse relationship.
- **Member Management (`/admin/members`)**:
  - Add, edit, review, and archive members.
  - Parent selector, spouse picker, and child relationships.
  - Profile photo uploads and private notes management.
- **Review & Publish Workflow**:
  - Draft state prevents incomplete records from appearing on the public site until reviewed and approved.
- **Data Export & Backups (`/admin/settings`)**:
  - 1-click full JSON backup export of all members, relationships, stories, and gallery records.
- **Sample Data Controls**:
  - Easily toggle or wipe fictional sample records with a single click.

---

## 🚀 Quick Start (Running Locally)

The application has a **zero-configuration interactive mode**: you can start and test it immediately without needing Supabase keys right away. Data automatically persists in your browser.

```bash
# In the project directory:
pnpm dev
# or
npm run dev
```

Open your browser at `http://localhost:5173`.

### 🔑 Signing into the Admin Area
- Navigate to: `http://localhost:5173/admin/login`
- In Local Mode, click the **"Click to pre-fill test admin credentials"** button or use:
  - **Email**: `admin@kkc-family.com`
  - **Password**: `admin123`

---

## ⚡ Connecting to Live Supabase Database

When you are ready to connect a live Supabase backend:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.

### 2. Run Database Schema
1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Open the file [`supabase-schema.sql`](./supabase-schema.sql) in this repository.
3. Paste the contents into the SQL Editor and click **Run**.
   - This creates tables (`family_members`, `relationships`, `life_events`, `member_photos`, `gallery_items`, `family_history`), indexes, triggers, and Row Level Security policies.

### 3. Create Storage Buckets
In the Supabase Dashboard under **Storage**, create these buckets:
- `profile-photos` (Public bucket)
- `gallery` (Public bucket)
- `documents` (Private bucket)

### 4. Configure Environment Variables
Create a file named `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Restart your Vite dev server (`pnpm dev`). The application will automatically switch from local mode to your live Supabase cloud database.

---

## 📸 Archival Founders Portrait
The founders photograph provided by the user is saved at:
```
public/uploads/founders.jpg
```
It is automatically displayed on the homepage hero, the founders preview cards, and the setup wizard.
