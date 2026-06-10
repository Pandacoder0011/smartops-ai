# Contributing to SmartOps AI

Thank you for your interest in contributing to SmartOps AI! This document outlines the guidelines, workflows, and standards for developers working on this project. Adhering to these conventions helps maintain code quality, consistency, and clean project history.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Development Workflow](#development-workflow)
   - [Branch Naming Model](#branch-naming-model)
   - [Local Environment Setup](#local-environment-setup)
3. [Coding Standards & Formatting](#coding-standards--formatting)
   - [JSDoc Requirements](#jsdoc-requirements)
   - [Linting & Formatting](#linting--formatting)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request (PR) Submission Checklist](#pull-request-pr-submission-checklist)

---

## Code of Conduct

As a contributor, you are expected to maintain professional and respectful collaboration. Focus on constructive code reviews, structured feedback, and helpful discussions.

---

## Development Workflow

### Branch Naming Model

All development should occur on feature branches branched off the `main` (or `develop` if applicable) branch. Use the following prefix structure:

* **Features**: `feat/` - for new modules, services, or UI components (e.g., `feat/employee-attendance-ui`)
* **Bug Fixes**: `fix/` - for bug fixes and patches (e.g., `fix/dashboard-rate-limiter-leak`)
* **Documentation**: `docs/` - for documentation additions or changes (e.g., `docs/add-api-endpoints`)
* **Refactoring**: `refactor/` - for structural improvements without code behavior changes (e.g., `refactor/optimize-database-aggregations`)
* **Performance**: `perf/` - for optimizations targeting speed, bundle size, or DB queries (e.g., `perf/socket-throttling`)

Example branch name: `feat/ai-insights-charts`

### Local Environment Setup

1. **Clone and Install**:
   ```bash
   git clone https://github.com/your-username/smartops-ai.git
   cd smartops-ai
   npm run install-all
   ```
2. **Environment Variables**:
   Copy `.env.example` in `/server` to `/server/.env` and supply valid local values (MongoDB URI, Gemini API Key, JWT Secret).
3. **Run Services**:
   * **Backend server** (runs on port `5005`):
     ```bash
     cd server && npm run dev
     ```
   * **Client dev server** (runs on port `5173`):
     ```bash
     cd client && npm run dev
     ```

---

## Coding Standards & Formatting

### JSDoc Requirements

All backend API route handlers, database helper methods, middlewares, and services must feature structured JSDoc headers specifying their purpose, input parameter details, types, and return values.

Example:
```javascript
/**
 * Verifies JWT tokens supplied in headers and binds authorized user to request.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware router callback.
 * @throws {Error} Returns 401 response status if authorization fails.
 */
export const protect = async (req, res, next) => { ... }
```

### Linting & Formatting

* Use **ESLint** and **Prettier** for styling rules.
* Indentation: **2 spaces** (no tabs).
* Semicolons: **Always**.
* Use Single Quotes for strings: `'example'` (except for templates or HTML properties).

Before submitting code, run formatting scripts:
```bash
npm run format   # if formatted script is defined
```

---

## Commit Guidelines

SmartOps AI uses **Semantic Commit Messages** to maintain a clean git history and automate changelogs. Commits should be structured as follows:

```
<type>(<scope>): <short description>

[Optional longer body detail]
```

### Supported Commit Types:
* `feat`: A new user-facing feature.
* `fix`: A bug patch.
* `docs`: Documentation edits only.
* `style`: Styling edits (formatting, white-space, missing semi-colons).
* `refactor`: Restructuring code files without altering feature results.
* `test`: Adding missing unit/e2e test specs.
* `chore`: Build files, dependencies, config setups, or internal tooling packages.

### Example:
```
feat(ai): integrate Gemini API stream chat endpoint with fallback simulation
```

---

## Pull Request (PR) Submission Checklist

Before opening a PR, complete the following validation steps:

- [ ] **Build Validation**: Verify that the production React build compiles cleanly:
  ```bash
  cd client && npm run build
  ```
- [ ] **No Unused Imports**: Strip debug logs and unused parameters or imports.
- [ ] **Tests pass**: Run the unit or integration suites.
- [ ] **No Conflicts**: Rebase or merge `main` into your feature branch to clear merge conflicts.
- [ ] **Documentation updated**: Verify README, API.md, or assets references are updated if adding features.
