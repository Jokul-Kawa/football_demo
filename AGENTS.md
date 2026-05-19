# Repository Guidelines

## Project State

- This workspace currently has no Git repository.
- The MVP source is organized as a lightweight monorepo.
- `apps/api` contains the runnable Node.js REST/SSE API.
- `apps/mobile` contains Flutter app source; generate platform shells after installing Flutter.
- Existing local process files live under `.claude/`.
- The configured spec paths are `.claude/specs`, `.claude/steering`, and `.claude/settings`.

## Commands

- Run API tests: `npm test`
- Start API server: `npm start`
- Start API in watch mode: `npm run dev:api`

## Spec Workflow

For non-trivial features, follow the local spec flow before implementation:

1. Create or update `.claude/specs/{feature-name}/requirements.md`.
2. Wait for explicit approval before creating `design.md`.
3. Wait for explicit approval before creating `tasks.md`.
4. Implement only the requested task from `tasks.md`.
5. After completing a task, mark its checkbox done in `tasks.md`.

Requirements should use EARS-style acceptance criteria with `WHEN`, `IF`, `WHERE`, or `WHILE` clauses followed by `SHALL`.

Design documents should include architecture, data flow, component responsibilities, data model, business process diagrams, and error handling. Use Mermaid diagrams where useful.

Tasks should be a numbered checkbox list with at most two hierarchy levels. Each coding task should reference the relevant requirements and focus on writing, modifying, or testing code.

## Coding Practices

- Prefer existing project conventions once source code exists.
- Keep implementation scoped to the approved task and design.
- Add tests proportional to the risk and behavior being changed.
- Do not add functionality that is not covered by approved requirements.
