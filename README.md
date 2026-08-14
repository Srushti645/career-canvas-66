Career Canvas 🎯

Career Canvas is a web-based career assistance platform designed to help students and job seekers improve their career preparation through resume analysis and interview preparation.

✨ Features

- 📄 Resume analysis and evaluation
- 🤖 AI-powered interview preparation
- 📊 Interview performance feedback
- 👤 User-friendly dashboard
- 🔐 User authentication
- 📱 Responsive and user-friendly interface

🛠️ Technologies Used

React 19 — UI library
TanStack Start (full-stack React framework on Vite) + TanStack Router — file-based routing, SSR
TanStack React Query — server-state & data fetching/caching
Tailwind CSS v4 — utility-first styling (via @tailwindcss/vite, native CSS @import/@theme)
shadcn/ui components built on Radix UI primitives — dialogs, dropdowns, tabs, accordions, tooltips, etc.
lucide-react — icon set
class-variance-authority + clsx + tailwind-merge — variant styling utilities
react-hook-form + @hookform/resolvers + zod — forms & validation
react-markdown — renders the AI interviewer's markdown replies
recharts — score/charts visualisation
sonner — toast notifications
vaul — drawer component
cmdk — command palette
date-fns — date formatting

Backend / Server
TanStack Start server functions (createServerFn) — typed RPC for resume analysis & interview logic
Supabase (via Lovable Cloud) — Postgres database, Auth, Row-Level Security
@supabase/supabase-js — client + server Supabase SDK
Lovable AI Gateway — server-side calls to google/gemini-3.6-flash for resume scoring & mock interviews
Zod — server-side input validation on every server function
Nitro + Cloudflare Workers runtime — serverless edge deployment target (nodejs_compat)

Authentication
Supabase Auth — email/password sessions
Google OAuth via the Lovable broker (@lovable.dev/cloud-auth-js)
Bearer-token middleware (attachSupabaseAuth / requireSupabaseAuth) securing protected server functions

Tooling / Build
Vite 8 — dev server & bundler
TypeScript 5.8 (strict mode)
ESLint 9 + Prettier + typescript-eslint — lint/format
pdfjs-dist — in-browser PDF text extraction for resume uploads
Database schema (Supabase / Postgres)
profiles, resume_analyses, interview_sessions, interview_messages — all RLS-scoped to the signed-in student

📂 Project Structure

career-canvas-66/
├── public/
├── src/
├── supabase/
├── .gitignore
├── package.json
├── README.md
└── ...

🚀 Getting Started

Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git

Installation

Clone the repository:

git clone https://github.com/Srushti645/career-canvas-66.git

Navigate to the project directory:

cd career-canvas-66

Install the dependencies:

npm install

Start the development server:

npm run dev

Open the local URL shown in the terminal to view the application.

📸 Screenshots

<img width="1173" height="752" alt="Screenshot 2026-08-14 103145" src="https://github.com/user-attachments/assets/60dda655-8deb-4bc5-ad5e-b543ba67ec27" />
<img width="1171" height="686" alt="Screenshot 2026-08-14 103210" src="https://github.com/user-attachments/assets/b7c54351-eb4f-466c-81c0-b1d84bf90153" />
<img width="1183" height="701" alt="Screenshot 2026-08-14 103257" src="https://github.com/user-attachments/assets/908059c2-0f87-41c4-820c-96fc98502187" />
<img width="1163" height="741" alt="Screenshot 2026-08-14 103326" src="https://github.com/user-attachments/assets/e60e0a03-310b-426a-af80-ebcea26d7eb2" />

🎯 Future Enhancements

- Improve AI-based resume analysis
- Add more personalized job recommendations
- Enhance mock interview capabilities
- Add detailed career recommendations
- Improve performance analytics
- Add additional authentication and user features

👩‍💻 Author

Srushti C S

Computer Science Engineering Student

📌 Project Purpose

This project was developed as a portfolio and academic project to demonstrate skills in web development, database integration, user interface design, and AI-powered career assistance.

📄 License

This project is intended for educational and portfolio purposes.
