# 🧹 TidyQuest — Clear the Clutter

> A gamified notification center where you swipe away digital noise, chain combos, and protect what actually matters.

![Made with HTML](https://img.shields.io/badge/HTML-5-orange) ![Made with CSS](https://img.shields.io/badge/CSS-3-blue) ![Made with JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow) ![Tailwind](https://img.shields.io/badge/TailwindCSS-CDN-38bdf8)

Built for **NYC CodeQuest 2026**.

---

## 📖 Overview

We've all felt it — the endless scroll of notifications burying the one that actually matters. **TidyQuest** turns that daily annoyance into a fast-paced, satisfying game.

Swipe cards away, stack combos for bigger scores, and watch out for **Priority** alerts that punish careless swiping. It's part stress-reliever, part arcade high-score chase — a playful reminder that clearing clutter beats burying it.

## 🎮 How to Play

1. **Swipe right** (or tap **✕**) on a notification card to dismiss it.
2. Clear notifications **fast and back-to-back** to build a **combo multiplier** — the quicker your streak, the higher your score.
3. **⭐ Gold** alerts are worth **3× points** — prioritize them when you see one.
4. **⚡ Priority** alerts can't be swiped away. You must tap **✓ Read** to clear them safely — swiping one instead makes it **shake** and buzzes an alert sound.
5. Clear the whole batch to reach **Inbox Zero** and see your final score, best combo, priority save rate, and rank.

## ✨ Features

- 🎯 **Combo system** — chain fast dismissals within a 2-second window for multiplier bonuses (up to ×10).
- 🌟 **Gold notifications** — bonus point multipliers with a flat bonus on top.
- 🚨 **Priority notifications** — a risk/reward mechanic that requires careful attention instead of instinctive swiping.
- 🖱️ **Drag-to-dismiss** — real pointer-based swipe physics with rotation and fade, plus tap-to-dismiss fallback buttons.
- 🔊 **Procedural sound effects** — dismiss, combo, priority-warning, and victory jingles generated live via the Web Audio API (no audio files needed).
- 🎉 **Particle bursts & floating score pop-ups** on every successful clear.
- 🏆 **Local leaderboard** simulation comparing your score against sample players.
- 📤 **Share your score** via the native Web Share API, clipboard copy, or a Twitter/X intent fallback.
- ♿ **Accessible status updates** via a screen-reader-only live region.
- ⌨️ **Keyboard shortcuts** on the results screen: `R` to replay, `S` to share.
- 📱 Fully responsive, dark-mode-first UI styled with Tailwind CSS.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | Tailwind CSS (CDN) + custom CSS animations |
| Logic | Vanilla JavaScript (ES5-compatible, no framework, no build step) |
| Fonts | Google Fonts — Inter, Space Grotesk, JetBrains Mono |
| Audio | Web Audio API (procedural tones, zero audio assets) |

No package manager, bundler, or build step is required — it's a static site that runs directly in the browser.

## 📂 Project Structure

```
.
├── index.html      # Page structure, layout, and Tailwind config
├── styles.css      # Card swipe animations, particles, score pop-ups, shake effects
├── script.js       # Game logic: notifications, scoring, combos, audio, leaderboard
└── README.md       # You are here
```

## 🚀 Getting Started

No installation or dependencies needed — this is a static HTML/CSS/JS project.

### Option 1: Open directly
Simply double-click `index.html`, or open it in your browser:

```bash
open index.html        # macOS
start index.html        # Windows
xdg-open index.html     # Linux
```

### Option 2: Run a local server (recommended)
Some browsers restrict features (like the Web Share API) on `file://` URLs, so a local server gives the most accurate experience.

**Using Python:**
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

**Using Node.js:**
```bash
npx serve .
```

**Using VS Code:**
Install the **Live Server** extension, right-click `index.html`, and choose *Open with Live Server*.

## 🕹️ Controls

| Action | How |
|---|---|
| Dismiss a normal/gold notification | Swipe right/left, or tap **✕** |
| Clear a priority notification | Tap **✓ Read** |
| Attempt to swipe a priority notification | Triggers a shake + warning tone (no effect) |
| Start a new batch | Tap **Clear another batch** on the results screen, or press **R** |
| Share your score | Tap **Share my score**, or press **S** on the results screen |

## 🧠 Scoring Logic

- Base value per notification: **10 points**
- **Gold** notifications: **3× multiplier + 20 bonus points**
- **Combo multiplier**: increases by 0.5 for every dismissal within 2 seconds of the last one (capped at ×10), and decays by 0.5 when you slow down
- **Priority** notifications: worth 0 points if swiped (and can't actually be dismissed that way) — they must be marked **Read** instead

## 🙌 Credits

Built with ❤️ during **NYC CodeQuest 2026** as a fun take on turning notification fatigue into a rewarding, game-like experience.

---

*Have fun clearing the clutter — and don't just bury it.*
