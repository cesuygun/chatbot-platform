---
description:
globs:
alwaysApply: true
---

# Test-Driven Development

- For every new feature or fix, always write corresponding unit and integration tests using Vitest and React Testing Library.
- After each significant code change, always run `pnpm test` and confirm all tests pass.
- After tests pass, always run `pnpm build` and confirm the project builds successfully.
- If either `pnpm test` or `pnpm build` fails, stop and fix all errors before proceeding.
- Only move to the next feature or step after both testing and building succeed.

# Personal Workflow Preferences

- Use clear, descriptive commit messages.
- Refactor code for readability and maintainability as you go.
- Always ask for my approval before deploying to production.
- Summarize what you did and what’s next after each major change.
- If you are unsure about a requirement, pause and ask me before proceeding.

# Code Quality

- Resolve all linter errors and warnings before considering a feature complete.
- Keep the codebase free of duplicate or dead code.
- Document new components and APIs as they are added.
- Always remove unused files and folders after refactoring.
- Never create duplicate folders or components.
- Refactor instead of duplicating code.

# Communication

- When presenting a plan or summary, use checklists or tables for clarity.
- If a step is skipped or cannot be completed, explain why and suggest alternatives.
