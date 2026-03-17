# Time Audit

A lean, mobile-first PWA for running a 2-week time audit. Log where your time is actually going at task level, then review the patterns. Three screens — Home, Review, Tags. No planning features.

**Stack**: Next.js 14 (App Router) · Supabase (Postgres + Auth + Realtime) · Tailwind CSS · Recharts · PWA via @ducanh2912/next-pwa

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the SQL schema

In your Supabase project, go to **SQL Editor** and paste this entire block:

```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  colour text not null default '#3b82f6',
  created_at timestamptz default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  tag_id uuid references tags(id) not null,
  task_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz default now()
);

alter table tags enable row level security;
alter table entries enable row level security;

create policy "Users manage own tags" on tags
  for all using (auth.uid() = user_id);
create policy "Users manage own entries" on entries
  for all using (auth.uid() = user_id);

-- Performance indexes
create index entries_user_started on entries (user_id, started_at desc);
create index entries_tag_id on entries (tag_id);
create index tags_user_id on tags (user_id);

-- Enforce only one running timer per user at the database level
create unique index one_running_timer on entries (user_id) where ended_at is null;
```

Click **Run**.

### 3. Enable Realtime

In Supabase: go to **Table Editor**, open the `tags` table, click **Realtime** and toggle it on. Repeat for `entries`. This allows live sync across devices.

### 4. Enable magic link auth

In Supabase: go to **Authentication → Providers**, ensure **Email** is enabled. Magic links are on by default — no further config needed.

### 5. Add environment variables

Edit `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see the login page — enter your email, click the magic link, and you're in.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

After deploying, go back to Supabase → **Authentication → URL Configuration** and add your Vercel URL (e.g. `https://time-audit.vercel.app`) to:
- **Site URL**
- **Redirect URLs**: `https://time-audit.vercel.app/auth/callback`

---

## Install as PWA

### iPhone (Safari)
1. Open the app in Safari
2. Tap the **Share** button (box with arrow at the bottom of the screen)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — the app icon appears on your home screen
5. Launch from the icon for a full-screen experience with no browser chrome

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **three-dot menu** (top right)
3. Tap **Add to Home Screen** (or **Install app** if shown)
4. Tap **Add** — the icon appears on your home screen

---

## How to use

1. **Create tags first** — go to Tags and add your project tags (e.g. "Work", "Consultancy", "Personal")
2. **Start a timer** — on the Home screen, type what you're working on, pick a tag, tap Start
3. **Stop when done** — tap Stop in the timer bar at the top
4. **Log past time** — tap "Log manually" to add entries for time already spent
5. **Review after 2 weeks** — go to Review, look at By Task to see what's eating your time, By Day to see daily patterns

---

## Project structure

```
app/
  layout.tsx          Root layout — fonts, theme, nav
  page.tsx            Home screen (timer + today's entries)
  login/page.tsx      Magic link login
  auth/callback/      Supabase auth callback handler
  review/page.tsx     Review screen (by-task and by-day)
  tags/page.tsx       Tag management
components/
  TimerBar.tsx        Sticky running timer bar
  TaskInput.tsx       Autocomplete task name field
  TagPicker.tsx       Tag selection pills
  EntryList.tsx       Today's entries
  EntryCard.tsx       Single entry row
  Sheet.tsx           Reusable slide-up sheet
  EditSheet.tsx       Edit/delete entry sheet
  ManualEntryForm.tsx Manual entry form
  ReviewByTask.tsx    Task-level breakdown
  ReviewByDay.tsx     Day-level chart (Recharts)
  BottomNav.tsx       Navigation + theme toggle
  ThemeProvider.tsx   Dark/light mode context
lib/
  supabase.ts         Browser Supabase client
  supabase-server.ts  Server Supabase client
  database.types.ts   TypeScript types for DB schema
  constants.ts        Tag colours, formatting utilities
  hooks/
    useTimer.ts       Running timer state + Realtime
    useTags.ts        Tags CRUD + Realtime
    useEntries.ts     Entries CRUD + Realtime
    useAutoComplete.ts Recent task names autocomplete
```
