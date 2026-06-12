# Contributing to Tawazun

Thanks for taking the time to contribute! Whether it's a bug fix, a small improvement, or a new feature — all PRs are welcome.

---

## Ground rules

- Be respectful. That's it.
- Open an issue before starting work on a large feature so we can discuss it first.
- Keep PRs focused — one fix or feature per PR, not a mix of both.

---

## How to set up locally

### 1. Fork the repo
Click **Fork** in the top-right corner of the GitHub page. This creates your own copy.

### 2. Clone your fork
```bash
git clone https://github.com/YOUR_USERNAME/budget-app.git
cd budget-app
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run the app in dev mode
```bash
npm run dev
```

The app window will open. Changes to the renderer (React) hot-reload instantly. Changes to the main process (Electron) require a restart.

---

## Making changes

### Create a branch
Never work directly on `main`. Create a branch named after what you're fixing:

```bash
git checkout -b fix/savings-screen-crash
# or
git checkout -b feat/dark-mode-improvements
```

### Commit your changes
Keep commit messages short and descriptive:

```bash
git commit -m "fix: handle invalid timestamp in SavingsScreen"
git commit -m "feat: add export to PDF for savings tab"
```

### Push and open a PR
```bash
git push origin your-branch-name
```

Then go to your fork on GitHub and click **"Compare & pull request"**.

---

## PR checklist

Before submitting, make sure:

- [ ] The app runs without crashing (`npm run dev`)
- [ ] Your change does what the PR description says it does
- [ ] You haven't accidentally included personal data or unrelated files
- [ ] The PR description explains *what* you changed and *why*

---

## Project structure (quick reference)

```
src/
  main/           — Electron main process: file I/O, IPC handlers, CSV logic
  preload/        — Context bridge between main and renderer
  renderer/
    src/
      components/ — Reusable UI components
      hooks/      — React hooks (transactions, theme, font size, …)
      screens/    — Full-page views (Entry, Analytics, Savings, Import)
      types/      — TypeScript type definitions
      index.css   — Tailwind base + all theme CSS variables
```

The most common areas people will want to touch:
- **New theme** → `src/renderer/src/index.css` + `src/renderer/src/hooks/useTheme.ts`
- **CSV import logic** → `src/main/csvStore.ts`
- **UI changes** → relevant screen in `src/renderer/src/screens/`

---

## Building the installer

```bash
npm run package
```

Output goes to `release/Tawazun Setup 1.0.0.exe`. Don't commit the `release/` folder — it's in `.gitignore`.
