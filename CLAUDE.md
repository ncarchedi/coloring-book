# Coloring Book Generator

## Stack
- Next.js 15 (App Router, `src/` directory)
- TypeScript
- Tailwind CSS v4 (config in `src/app/globals.css`)
- shadcn/ui (components in `src/components/ui/`)
- OpenAI SDK (`openai` package)
- jsPDF for client-side PDF export

## Commands
- `npm run dev` — start dev server
- `npm run build` — typecheck + build
- `npm run lint` — eslint

## Patterns
- Use shadcn/ui components, not raw HTML elements
- API routes in `src/app/api/`
- No server-side photo storage — everything in-memory
- OpenAI API key via `OPENAI_API_KEY` in `.env.local`
- Resend API key via `RESEND_API_KEY` in `.env.local` (for email feature)
