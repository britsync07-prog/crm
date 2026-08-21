# BritCRM SEO Agent Guide

## Installed SEO/AEO Skill

The project SEO work uses the local `ai-seo` skill and current AEO guidance. External trackers found during online research include ZipTie, Semrush AI Visibility Toolkit, Otterly AI, Profound, Peec AI, Ahrefs Brand Radar, and Evertune. These are monitoring products, not required runtime dependencies.

## Implemented Project SEO

- Global metadata in `src/app/layout.tsx`.
- Organization and SoftwareApplication JSON-LD in the root layout.
- Public sitemap in `src/app/sitemap.ts`.
- Robots policy in `src/app/robots.ts`.
- PWA/web manifest in `src/app/manifest.ts`.
- LLM-readable product summary in `src/app/llms.txt/route.ts`.
- `X-Robots-Tag: noindex` headers for private dashboards and API routes in `next.config.ts`.

## Public Indexable Pages

- `/landing`
- `/pricing`
- `/features/ai-discovery`
- `/features/cognitive-writing`
- `/solutions/enterprise`
- `/solutions/global-scale`
- `/vision/manifesto`
- `/contact`
- `/signup`
- `/privacy`
- `/terms`

## Private Noindex Areas

Private CRM pages, admin pages, API routes, user forms, meeting rooms, billing, inbox, leads, campaigns, settings, team, and customer dashboards are excluded from public indexing.

## Agent SEO Checklist

1. Keep public pages answer-first and extractable.
2. Add page-level metadata when converting client-only marketing pages to server components.
3. Add FAQ/schema sections to high-intent public pages.
4. Keep `/llms.txt` updated when product capabilities change.
5. Keep `/sitemap.xml` limited to public pages.
6. Never expose user dashboards or API routes to indexing.
