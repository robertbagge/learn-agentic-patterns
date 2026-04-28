# Web App Blueprint

## What this is

A practical, opinionated guide to building web apps with Vite + React +
Tailwind: SOLID-style principles applied to React components, plus
framework-specific best practices for the stage's tech stack.

## Who it's for

Engineers and AI agents building or refactoring the web app.

## Scope

Covers general React principles and stack-specific patterns:

* **Vite** — bundler, dev server, environment variables
* **React** — components, hooks, composition
* **Tailwind** — utility classes, design tokens, component variants

## How to use this guide

### For AI agent research

Unless otherwise instructed, read all documents to get a full picture of
best practices & clean code before distilling for your task.

### For implementation guidance

Lead with the [Best Practices index](./best-practices/index.md), then dip
into the clean-code principles as needed. Common starting points:
[SRP](./clean-code/single-responsibility.md) and
[DIP](./clean-code/dependency-inversion.md).

### For framework-specific patterns

* **Styling**: [styling.md](./best-practices/styling.md)

## Clean code principles

* [Single Responsibility (SRP)](./clean-code/single-responsibility.md)
  – One responsibility per component/hook. Split
  fetching/formatting/presentation.
* [Interface Segregation (ISP)](./clean-code/interface-segregation.md)
  – Lean props; composition over fat prop bags.
* [Dependency Inversion (DIP)](./clean-code/dependency-inversion.md)
  – Depend on interfaces; inject implementations via props/context.
* [Open–Closed (OCP)](./clean-code/open-closed.md)
  – Extend via composition/children; avoid modifying core components.
* [Liskov Substitution (LSP)](./clean-code/liskov-substitution.md)
  – Variants honor the same contract; consistent callbacks/semantics.
* [Don't Repeat Yourself (DRY)](./clean-code/dry.md)
  – Centralize repeating patterns (cards, date formatting, rules).
* [Keep It Simple (KISS)](./clean-code/kiss.md)
  – Start simple; refactor when pressure appears.
