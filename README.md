# Hutch

A drawer of Mac utilities — window tiling, file shelf, system toggles, and a smart browser picker, all in one menu bar app.

**Website:** [hutch.coursion.studio](https://hutch.coursion.studio/)

## Install

### Homebrew

```sh
brew tap coursion-studio/hutch
brew install --cask hutch
```

### Direct download

Grab the latest signed `.dmg` from [Releases](https://github.com/Coursion-Studio/hutch/releases/latest), drag `Hutch.app` into `/Applications`.

Requires **macOS 15 (Sequoia)** or later.

## What's inside

| Tool             | What it does                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Window Manager   | Snap windows to halves, quarters, thirds — by click or global hotkey. Multi-display aware.    |
| Stash            | Floating shelf for files mid-drag. Cursor-shake to summon, hotkey to summon, drag through.    |
| Browser Picker   | Set Hutch as the default browser; route links by domain rule, app source, or a quick picker.  |
| Toggles          | One panel for the macOS switches that hide three menus deep — Dark Mode, Stage Manager, etc.  |

Each tool is independently toggleable from Settings. None depend on each other.

## Updates

Hutch ships with [Sparkle](https://sparkle-project.org). Updates download silently and apply on the next quit. The cask declares `auto_updates true`, so `brew upgrade --cask hutch` is unnecessary unless you've turned in-app updates off.

The Sparkle feed is [`hutch.coursion.studio/appcast.xml`](https://hutch.coursion.studio/appcast.xml). DMGs are EdDSA-signed; Hutch verifies the signature against an embedded public key before installing anything.

## Privacy

Hutch runs entirely on your Mac. No analytics, no telemetry, no account. The only network call is the daily Sparkle update check.

## Issues & feedback

Open an issue on this repo. Source code lives in a private repo — this one only hosts the public `.dmg`, the Sparkle appcast, and the marketing site.

---

© 2026 Coursion. All rights reserved.
