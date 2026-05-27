# JobFit

An AI-powered job matching platform that analyzes your resume and scores every job opportunity — so you know exactly where to focus your energy and what to improve.

🌐 **Live Demo:** [job-fit-rosy.vercel.app](https://job-fit-rosy.vercel.app)

---

## Features

- **AI Match Scoring** — Analyzes your resume against job postings using Claude AI and returns a match score with matched and missing skills
- **Job Discovery** — Finds relevant job postings via the Adzuna Jobs API based on your industry, location, and job type preferences
- **Cover Letter Generator** — Generates tailored cover letters for any job using your resume and the job description
- **Resume Versions** — Upload and manage multiple resume versions, track which one gets you the most interviews
- **Resume Suggestions** — AI-powered suggestions to improve your resume based on your saved jobs, with LaTeX export
- **Application Tracking** — Track your job applications with status updates (Applied, Interview, Offer, Rejected, Ghosted)
- **Google OAuth + Email Auth** — Secure authentication supporting both Google sign-in and email/password

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| Auth | NextAuth v5 |
| Storage | Supabase Storage |
| AI | Anthropic Claude API |
| Jobs API | Adzuna Jobs API |
| Styling | Tailwind CSS |
| Rich Text | Tiptap |
| PDF | react-pdf |
| Animations | GSAP, Motion |
| Testing | Vitest |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Anthropic API key
- Adzuna API credentials
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fawazm30/JobFit.git
cd JobFit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables — create a `.env` file in the root directory:
```env
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

---

## Testing

Run the full test suite:
```bash
npm run test:run
```

60 tests across 8 API routes covering:
- Resume version management
- Application status updates
- Resume activation
- Onboarding flow
- Profile management
- Password changes
- Skills management
- Cover letter generation

---

## Project Structure
