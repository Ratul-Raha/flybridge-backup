# Knowledge Base — AI Support Bot

The support bot answers questions from these Markdown files plus two
auto-generated sources.

## How it works

- Every `.md` file in this folder is loaded automatically (no build step, no
  registration) and split into chunks by headings (`#`, `##`, `###`).
- **Seminars are auto-synced from the database**: every create/update/delete of
  a seminar (admin Seminars page or `/api/seminars`) regenerates the seminar
  chunks — title, date/time, price, duration, description and live link.
- **Programs are auto-synced from code**: program chunks are generated from
  `src/lib/programs.ts` and `src/app/programs/[id]/course-data.ts`, so they
  always match the Programs page. Edits to those files take effect on deploy /
  restart, or on a manual reload.
- When a visitor asks a question, the best-matching chunks are retrieved by
  keyword scoring and injected into the system prompt alongside the
  conversation history.

## How to add knowledge

1. Create a new `.md` file here (or edit an existing one).
2. Use `#` headings to structure it — each heading becomes a retrieval unit.
3. Keep paragraphs focused; one idea per heading works best.
4. Restart the dev server or hit `GET /api/chat/knowledge?reload=1` (admin only)
   to refresh the in-memory index.

Do **not** put seminar or program listings in `.md` files — they are generated
automatically and duplicates would contradict the live data.

## Naming

Use lowercase, hyphenated names: `getting-started.md`, `work-permit-canada.md`.

## Tips

- Answer the question the user actually asked — be direct, friendly and specific.
- If the knowledge base doesn't contain the answer, say so and point them to the
  right page or to contact the team.
- Numbers and dates age quickly — prefer "check the site" for anything volatile.
