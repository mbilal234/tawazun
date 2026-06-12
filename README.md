# Tawazun — Finance Tracker

Track your finances easily. All data stays on your machine. Nothing is sent to any server.
Safe and Simple.

---

## Features

- **Log entries** — Add income, expense, or savings with daily / weekly / monthly / yearly views
- **Analytics** — Charts and summaries with CSV and PDF export
- **Savings tracker** — View savings chronologically or grouped by category
- **CSV import** — Bring in transactions from your old spreadsheets; undo any import in one click
- **9 themes** — Book Paper, Studio Olive, Weathered Copper, Alpha Grass, Monastery, Apex Dark, Minecraft, Mario, iOS Glass (My favorite is Weathered Copper. The rest were attempts but Im not too fond of them. Would appreciate theme contributions lol)
- **High contrast mode** and 6 font size options (for the old folks)
- **100% local** — Data lives in a plain CSV file on your PC; no accounts, no cloud

---


## Download (Windows)

Grab the latest installer from the [Releases](../../releases) page, run it, and you're done. No terminal needed.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Desktop shell | Electron 31 |
| UI | React 18 + TypeScript 5 |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion 11 |
| Charts | Recharts 2 |
| CSV parsing | PapaParse 5 |
| Build tool | electron-vite 2 |
| Installer | electron-builder 24 (NSIS) |

---

## Running from source

### Prerequisites

You need **Node.js** and **Git** installed. If you don't have them:

1. **Node.js** — Download the LTS installer from [nodejs.org](https://nodejs.org) and run it. Accept all defaults.
2. **Git** — Download from [git-scm.com](https://git-scm.com/download/win) and run it. Accept all defaults.

To verify both installed correctly, open **PowerShell** (press `Win + R`, type `powershell`, hit Enter) and run:

```powershell
node --version
git --version
```

Both commands should print a version number. If they do, you're ready.

---

### 1. Clone the repository

Open PowerShell and run:

```powershell
git clone https://github.com/YOUR_USERNAME/budget-app.git
cd budget-app
```

---

### 2. Install dependencies

```powershell
npm install
```

This downloads all the libraries the project needs. It may take a minute or two.

---

### 3. Start in development mode

```powershell
npm run dev
```

The app window will open automatically. Any code changes you save will hot-reload the renderer instantly.

---

### 4. Build a Windows installer

```powershell
npm run package
```

This compiles everything and produces a ready-to-install `.exe` at:

```
release/Tawazun Setup 1.0.0.exe
```

Run that file to install Tawazun on any Windows PC.

---

## Project structure

```
src/
  main/           — Electron main process (file I/O, IPC handlers)
  preload/        — Context bridge (exposes safe APIs to the renderer)
  renderer/
    src/
      components/ — Reusable UI pieces (Sidebar, TitleBar, charts)
      hooks/      — React hooks (transactions, theme, font size, …)
      screens/    — Full-page views (Entry, Analytics, Savings, Import)
      types/      — TypeScript types
      index.css   — Tailwind base + all theme CSS variables
```

---

## Data storage

All data is stored locally at:

```
C:\Users\<you>\AppData\Roaming\tawazun\transactions.csv
```

It's a plain CSV file you can open in Excel at any time. No encryption, no cloud sync — what's on your machine stays on your machine.

---

## License

MIT — do whatever you like with it.
