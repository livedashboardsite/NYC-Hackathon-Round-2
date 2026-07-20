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

## 🎨 Design System

TidyQuest uses a dark, glassmorphic aesthetic inspired by modern mobile notification centers — the goal was to make the game *feel* like a real phone lock screen you're gleefully tearing apart.

**Color palette**

| Token | Hex | Used for |
|---|---|---|
| `brand-accent` | `#FF7A45` | Streak highlights, warm accents |
| `brand-purple` | `#7C5CFF` | Combo counter, primary CTA gradient |
| `brand-good` | `#3DDC97` | Score, success states, priority "Read" action |
| `brand-warn` | `#FFD166` | Gold notifications, best-combo stat |
| `brand-danger` | `#FF5D7A` | Priority notifications, alerts |

Base surface colors sit on a `slate-950` background with a soft radial indigo glow behind the header, and every panel uses translucent `white/5`–`white/10` fills with `backdrop-blur` to create layered glass cards.

**Typography**

| Font | Role |
|---|---|
| **Space Grotesk** | Display headings, scores, titles — bold and game-like |
| **Inter** | Body copy, instructions, notification text — clean and legible |
| **JetBrains Mono** | Stats labels, timestamps, pills — a "system HUD" feel |

**Layout principles**

- **Two-column responsive grid**: the phone-style notification stack sits on the left (`420px` fixed on desktop), stats/instructions/leaderboard flow on the right — collapsing to a single stacked column on mobile.
- **Rounded, layered depth**: large `rounded-[36px]` outer panel with `rounded-2xl` inner cards, creating a nested "phone within a dashboard" feel.
- **Micro-interactions everywhere**: every stat tile lifts (`hover:-translate-y-1`) and brightens on hover so the UI never feels static, even before you touch a card.

## 🎬 Animations & Motion Design

Every clear, combo, and shake is reinforced with motion so the game feels tactile rather than just clickable. All animations live in `styles.css` and are driven by simple class toggles from `script.js`.

| Animation | Trigger | Effect |
|---|---|---|
| **Live drag** | Pointer down + move on a card | Card follows the cursor/finger in real time, rotating proportionally to horizontal distance (`rotate = dx × 0.08`) and fading out as it travels further from center |
| **Leave right / left** | Swipe past the 100px threshold on a normal/gold card | Card flies off-screen (`translateX(±450px)`) with a matching rotation and scale-down, using a snappy `cubic-bezier(0.2, 0.8, 0.2, 1)` ease |
| **Leave up** | Tapping **✓ Read** on a priority card | Card gently lifts and fades (`translateY(-50px)`), signaling a "safely handled" dismissal rather than a swipe |
| **Shake** | Swiping a priority card (invalid action) | A quick horizontal shake (`@keyframes shake`) paired with a low-toned warning sound — instant, unmistakable negative feedback |
| **Particle burst** | Any successful dismissal | 12 small colored circles spawn from the card's center and fly outward at randomized angles/distances, shrinking to nothing over 0.55s |
| **Floating score pop-up** | Any successful dismissal | A `+N` label pops up from the card, overshoots slightly (`scale(1.15)`), then drifts upward and fades — classic "juicy" game feedback |
| **Fade-in** | New cards rendering into the list | Cards ease in with `opacity`/`scale` rather than popping in abruptly |
| **Bounce** | "Inbox Zero" 🏁 emoji on the results overlay | A celebratory Tailwind `animate-bounce` on completion |

**Design intent:** every interaction has a matching visual *and* audio cue (see `playDismiss`, `playCombo`, `playPriority`, `playVictory` in `script.js`), so feedback is multi-sensory — this was a deliberate choice to make the "just one more batch" loop as satisfying as possible.

## 🧩 Workflow & Architecture

**How the app is wired together:**

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────────┐
│   index.html     │ ──▶  │   script.js       │ ──▶  │   styles.css       │
│  (structure +    │      │  (state, logic,   │      │  (motion, shake,   │
│   Tailwind theme)│      │   audio, DOM)     │      │   particles)       │
└─────────────────┘      └──────────────────┘      └───────────────────┘
```

**Game loop, step by step:**

1. **Init** — `generateBatch(12)` creates a randomized set of notifications (20% priority, 15% gold, remainder normal) and renders them into `#listArea`.
2. **Interact** — each card gets pointer listeners for drag-to-dismiss, plus fallback `✕` / `✓ Read` buttons for accessibility and non-touch use.
3. **Resolve** — on a valid swipe, `dismissCard()` calculates points (base × type multiplier × combo multiplier), updates combo/streak state, fires particles + score pop-up + sound, then removes the notification from state and re-renders.
4. **Guard rails** — swiping a *priority* card is intercepted before it can be dismissed: it shakes, plays a warning tone, and returns to its original position untouched.
5. **Completion** — once the list empties, `showVictory()` locks the game, plays a five-note victory jingle, populates the results card (score, best combo, priority save ratio, a randomized rank), and updates the mock leaderboard.
6. **Replay loop** — `newBatch()` resets all state and generates a fresh set of notifications, keeping the session going without a page reload.

This kept the build intentionally framework-free: a single `IIFE` in `script.js` owns all state, DOM refs are cached once at load, and rendering is a straightforward "wipe and rebuild" of `#listArea` on every state change — simple enough to reason about and debug quickly under hackathon time pressure.

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
