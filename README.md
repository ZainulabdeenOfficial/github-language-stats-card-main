# GitHub Language Stats Card

Generate an embeddable SVG card showing your GitHub language usage, estimated lines of code, and optional WakaTime hours. Includes a web UI to preview and copy Markdown.

## Features
- Aggregates languages across your public, non-fork, non-archived repos
- Estimates lines of code from language byte counts
- Optional WakaTime hours (last 30 days) via a public share JSON
- SVG card endpoint for Markdown embedding
- Next.js (App Router) + API routes; easy to deploy on Vercel

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set a GitHub token to raise API limits:
```bash
# create .env.local and add
GITHUB_TOKEN=ghp_...
```

3. Run locally:
```bash
npm run dev
```
Open http://localhost:3000

## Usage

- UI: Enter your GitHub username. Optionally add WakaTime username and a public share id. Click Generate to preview and copy Markdown.
- Markdown embed (example):
```md
![GitHub Language Stats](https://your-deployment.vercel.app/api/card?username=octocat&wakatime_user=yourname&wakatime_share_id=0123abcd-...)
```

Parameters:
- `username` (required): GitHub username
- `wakatime_user` (optional): WakaTime username
- `wakatime_share_id` (optional): ID from a public WakaTime share URL
- `theme` (optional): `light` or `dark`

## Examples


![GitHub Language Stats](https://testlangauge.vercel.app/api/card?username=Taha170717&theme=tokyonight)

![GitHub Language Stats](https://testlangauge.vercel.app/api/card?username=ZainulabdeenOfficial&theme=tokyonight)

![GitHub Language Stats](https://github-language-stats-card-main.vercel.app/api/card?username=ExploitEngineer&theme=github)

## Deploy on Vercel

- Push this project to GitHub.
- Go to Vercel and "New Project" → import your repo.
- Framework preset: Next.js
- Environment variables (optional):
  - `GITHUB_TOKEN` (recommended)
- Deploy. Your endpoints will be:
  - `/api/stats?username=...`
  - `/api/card?username=...`

## Notes

- LOC is a heuristic (bytes ÷ 50). For precise metrics, integrate your own logic.
- The card returns SVG and is cached at the edge for 1 hour by default.
- Private repos are not included; only public repo language stats are used.
