# Hutch

A drawer of Mac utilities — window tiling, file shelf, system toggles, and a smart browser picker, all in one menu bar app.

**Website:** [hutch.coursion.studio](https://hutch.coursion.studio/)

## Install

Hutch isn't publicly available right now. Downloads are paused while a paid
release is prepared — the Homebrew cask and the signed `.dmg` will return
when it ships.

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

Hutch ships with [Sparkle](https://sparkle-project.org). The feed is currently empty, so existing installs keep working and are offered no updates.

The Sparkle feed is [`hutch.coursion.studio/appcast.xml`](https://hutch.coursion.studio/appcast.xml). DMGs are EdDSA-signed; Hutch verifies the signature against an embedded public key before installing anything.

## Privacy

Hutch runs entirely on your Mac. No analytics, no telemetry, no account. The only network call is the daily Sparkle update check.

## Issues & feedback

Open an issue on this repo. Source code lives in a private repo — this one only hosts the public `.dmg`, the Sparkle appcast, and the marketing site.

---

© 2026 Coursion. All rights reserved.
