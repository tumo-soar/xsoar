# X SOAR frontend

The SOAR console: alert queue, AI analysis, incidents, approvals, playbooks, indicators and integrations. React 19, Vite, [Refine](https://refine.dev), shadcn/ui and Tailwind v4.

Screens, what is live and what is preview, the design system and how to connect a preview screen to the api: [docs/ui.md](../../docs/ui.md).

## Run

```sh
pnpm install
VITE_API_URL=http://localhost:3000/api VITE_COLLECTOR_URL=http://localhost:8000 pnpm dev
```

Or start the whole stack from the repository root with `docker compose -f docker-compose-dev.yml up --build`.

## Commands

```sh
pnpm dev                  # development server on :5173
pnpm build                # production build
npx tsc --noEmit -p .     # type check
npx eslint src            # lint
```
