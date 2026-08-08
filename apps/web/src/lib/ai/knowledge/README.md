# Knowledge Base — AI Support Bot

The support bot answers questions from these Markdown files.

## How it works

- Every `.md` file in this folder is loaded automatically (no build step, no registration).
- Each file is split into chunks by headings (`#`, `##`, `###`) and indexed in memory.
- When a visitor asks a question, the best-matching chunks are retrieved by keyword
  scoring and injected into the system prompt alongside the conversation history.

## How to add knowledge

1. Create a new `.md` file here (or edit an existing one).
2. Use `#` headings to structure it — each heading becomes a retrieval unit.
3. Keep paragraphs focused; one idea per heading works best.
4. Restart the dev server or hit `GET /api/chat/knowledge?reload=1` (admin only)
   to refresh the in-memory index.

## Naming

Use lowercase, hyphenated names: `getting-started.md`, `work-permit-canada.md`.

## Tips

- Answer the question the user actually asked — be direct, friendly and specific.
- If the knowledge base doesn't contain the answer, say so and point them to the
  right page or to contact the team.
- Numbers and dates age quickly — prefer "check the site" for anything volatile.
