# File Cloud

A modern Google Drive clone built with Next.js (App Router), React, Supabase, Auth.js, and Tailwind CSS.

## 🚀 Project Overview
File Cloud is a full-featured, secure, and beautiful cloud storage app. Users can sign up, log in, and manage their files and folders with a Google Drive-like interface. All files are stored securely in Supabase Storage, and access is protected by Row Level Security (RLS).

---

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend/API:** Next.js API routes (App Router)
- **Database & Storage:** Supabase (Postgres + Storage)
- **Authentication:** Auth.js (NextAuth), Supabase Auth
- **UI:** Heroicons, custom CSS animations

---

## ✨ Features
- **Authentication:**
  - Sign up & login with live validation
  - Secure session management (NextAuth + Supabase)
  - Redirects and protected routes
- **Drive UI:**
  - Google Drive-like explorer with folders and files
  - Breadcrumb navigation
  - Drag-and-drop and multi-file upload (up to 5 files at once)
  - File type/size validation (images, PDFs, text, video; max 10MB)
  - Unique file naming to avoid conflicts
  - File/folder actions: create, rename, delete, preview
  - File preview (images, PDFs, text, video; fallback to metadata card)
  - Signed URLs for private file previews
  - Responsive/mobile-friendly UI
  - Animated About section and custom favicon
- **Supabase Integration:**
  - All file/folder operations use Supabase Storage and a `files` table
  - RLS: users can only access their own files
  - Secure uploads via Next.js API route (`/api/upload`)
- **Error Handling & UX:**
  - Clear error messages for auth, upload, and preview
  - Loading spinners and polished feedback
  - Accessible forms and keyboard navigation

---

## 📝 Setup Instructions

### 1. **Clone the Repo**
```bash
git clone <your-repo-url>
cd File Cloud/frontend
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Configure Environment Variables**
Create a `.env.local` file in the `frontend` directory:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
> **Do NOT use the service role key in the frontend!**

### 4. **Supabase Setup**
- Create a Supabase project at [supabase.com](https://supabase.com/)
- Create a **Storage bucket** named `user-files`
- Create a `files` table with columns:
  - `id` (uuid, primary key)
  - `name` (text)
  - `type` (text: 'file' or 'folder')
  - `user_id` (uuid)
  - `parent_id` (uuid, nullable)
  - `mimetype` (text, nullable)
  - `size` (int, nullable)
  - `url` (text, nullable)
  - `created_at` (timestamp, default now())
- **Enable RLS** and add a policy so users can only access their own files:
  ```sql
  CREATE POLICY "Users can access their own files" ON files
    FOR ALL USING (auth.uid() = user_id);
  ```
- **CORS:** In Supabase Storage settings, allow your Vercel domain and `localhost:3000` for development.

### 5. **Update Favicon & Branding (Optional)**
- Replace `public/favicon.ico` and update app title in `app/layout.tsx` if desired.

---

## ⚙️ Running the Project

### Development
```bash
npm run dev
```
- App runs at [http://localhost:3000](http://localhost:3000)

### Production
```bash
npm run build
npm start
```

---

## 🚀 Deploying to Vercel
1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com](https://vercel.com) and import your repo.
3. Set the environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!
5. Add your Vercel domain to Supabase Storage CORS settings.

---

## 🛡️ What to Change If You Clone
- **Supabase keys:** Set your own project's URL and anon key in `.env.local`.
- **Storage bucket:** Make sure the bucket name matches (`user-files`).
- **RLS policies:** Double-check RLS is enabled and correct.
- **CORS:** Add your deployed domain to Supabase Storage CORS.
- **(Optional) Branding:** Update favicon, app title, and About section.

---

## 🙏 Credits
- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), [Heroicons](https://heroicons.com/), and [Auth.js](https://authjs.dev/).

---

## 📄 License
MIT
