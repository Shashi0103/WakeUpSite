# WakeUpSite

> Prevent inactivity sleep and idle spin-down delays on your deployed websites with customizable scheduled health checks.

WakeUpSite is a modern, lightweight, responsive SaaS MVP built using **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Neon PostgreSQL**, **Prisma ORM**, and **Firebase Authentication**.

It is designed to solve the "cold start" spin-up delay associated with free tier hosts (like Render, Railway, Fly.io, or Glitch) by scheduling periodic, lightweight HTTP GET pings.

---

## Features

- **Responsive Landing Page**: Clean, modern startup marketing page detailing how it works, features, pricing, FAQs, and dark mode toggling.
- **Email Verification Guard**: Allows signups from any email provider (Yahoo, Outlook, Gmail, custom domains, etc.). Prompts email verification links for standard email signups.
- **PostgreSQL Synchronization**: Automatic backend user profile provisioning in Neon PostgreSQL on auth status changes.
- **Monitoring Dashboard**:
  - Statistics grid counting Total, Active, and Disabled website checks.
  - Interactive Search/Filter bar.
  - Card list indicating target URLs, schedule frequencies, last ping, next ping, and action toggles.
  - Modals for adding, editing, and deleting website checks with validations.
- **Zero-Dependency Mock Fallback**: Runs instantly out-of-the-box (simulating auth sessions and writing user/website records to a local JSON file) if connection credentials are placeholders.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Lucide Icons, Framer Motion
- **Database**: Neon PostgreSQL, Prisma ORM
- **Authentication**: Firebase Client SDK & Firebase Admin SDK (server-side ID Token verification)

---

## Folder Structure

```text
/app               # Next.js App Router (Layouts, Pages, and API endpoints)
/components        # Global React Contexts (Auth, Theme, Toasts)
/features          # UI features & sub-sections
/lib               # Database & Firebase configuration helpers
/prisma            # Database schema (schema.prisma) and migrations
/types             # Shared TypeScript declarations
/utils             # String validators and utility functions
```

---

## Environment Setup

Create a `.env` file at the root of the project with the following configuration:

```env
# Database connection string (Neon PostgreSQL URL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Firebase Client Configuration (from Firebase console Web App setup)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin Configuration (for backend JWT authentication verification)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----"
```

> [!NOTE]
> Make sure to replace `\n` characters in your `FIREBASE_PRIVATE_KEY` with actual newlines or store it exactly as shown so that they parse correctly.

---

## Getting Started

### 1. Run immediately in Mock Mode (Zero Setup)
If the `.env` file is left with placeholder values, the app will automatically run in **Mock Fallback Mode**. Data will persist locally to a `mock-db.json` file in the workspace, and Firebase auth will be simulated client-side.
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and register any mock address or click "Continue with Google" to test the app.

---

### 2. Run in Production Mode (Prisma + Neon + Firebase)

#### A. Install Dependencies
```bash
npm install
```

#### B. Setup Environment Variables
Populate the real secrets in your `.env` file.

#### C. Push Database Schema
Sync your tables with Neon PostgreSQL:
```bash
npx prisma db push
```

#### D. Start Dev Server
```bash
npm run dev
```

---

## Background Worker Integration

As requested, the background scheduler is designed to be run as a separate service (e.g. deployed on Railway) connecting to the same Neon PostgreSQL database using a cron job, BullMQ, or custom worker thread.

### Worker Flow (Every 1 Minute)
The worker should execute the following operations:
1. **Query due checks**:
   ```sql
   SELECT * FROM "Website" 
   WHERE "enabled" = true AND "next_ping_at" <= NOW();
   ```
2. **Execute Health Check**:
   Send an HTTP GET request to each `website_url`.
3. **Reschedule & Update Uptime**:
   For each completed ping, calculate the next ping timestamp:
   ```typescript
   const nextPing = new Date(Date.now() + website.schedule_minutes * 60 * 1000);
   ```
   Update the Database record:
   ```sql
   UPDATE "Website" 
   SET "last_ping_at" = NOW(), "next_ping_at" = $nextPing 
   WHERE "id" = $websiteId;
   ```
