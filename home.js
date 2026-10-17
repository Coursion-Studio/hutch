(() => {
  "use strict";

  const root = document.documentElement;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const typing = (el) => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

  function watch(el, enter, leave, threshold = 0.35) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? enter() : leave && leave()));
    }, { threshold }).observe(el);
  }

  watch($(".sec-price"), () => $(".sec-price").classList.add("live"), () => $(".sec-price").classList.remove("live"), 0.2);

  // ─── springs ───

  class Spring {
    constructor(value, response = 0.45, damping = 0.85) {
      this.x = value; this.v = 0; this.target = value;
      this.tune(response, damping);
    }
    tune(response, damping) {
      this.k = Math.pow((2 * Math.PI) / response, 2);
      this.c = (4 * Math.PI * damping) / response;
      return this;
    }
    to(target, velocity) {
      this.target = target;
      if (velocity !== undefined) this.v = velocity;
      return this;
    }
    jump(value) { this.x = this.target = value; this.v = 0; return this; }
    step(dt) {
      const a = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += a * dt;
      this.x += this.v * dt;
    }
    get settled() { return Math.abs(this.x - this.target) < 0.01 && Math.abs(this.v) < 0.05; }
  }

  const tasks = new Set();
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.064, (now - last) / 1000 || 0.016);
    last = now;
    tasks.forEach((task) => {
      const steps = Math.ceil(dt / (1 / 240));
      for (let i = 0; i < steps; i++) task.springs.forEach((s) => s.step(dt / steps));
      task.render();
      if (task.springs.every((s) => s.settled)) {
        task.springs.forEach((s) => s.jump(s.target));
        task.render();
        tasks.delete(task);
      }
    });
    if (tasks.size) requestAnimationFrame(frame);
  }
  function run(task) {
    if (!tasks.size) { last = performance.now(); requestAnimationFrame(frame); }
    tasks.add(task);
  }

  // ─── palettes, mirrored from PounceTheme.swift ───

  const DARK = { text: "#FFFFFF", text2: "#C9C9D8", text3: "rgb(255 255 255 / 0.58)", chip: "rgb(255 255 255 / 0.08)", rule: "rgb(255 255 255 / 0.06)", border: "rgb(255 255 255 / 0.12)" };
  const EMBER = { text: "#F5F3F2", text2: "rgb(245 243 242 / 0.62)", text3: "rgb(245 243 242 / 0.42)", chip: "rgb(255 255 255 / 0.08)", rule: "rgb(245 243 242 / 0.09)", border: "rgb(245 243 242 / 0.10)" };
  const LIGHT = { text: "#0F1115", text2: "#3A3F4A", text3: "#6B7180", chip: "rgb(0 0 0 / 0.06)", rule: "rgb(0 0 0 / 0.06)", border: "rgb(0 0 0 / 0.12)" };
  const T = (id, label, base, accent, stops, fg = DARK) => ({ id, label, base, accent, stops, fg });
  const THEMES = [
    T("aurora", "Aurora", "#070A1C", "#FF3D88", [["#FF3D88", 0.26], ["#5B3BFF", 0.20], ["#061238", 0.74]]),
    T("hibiscus", "Hibiscus", "#130408", "#FF2D55", [["#FF2D55", 0.42], ["#8B0000", 0.24], ["#000000", 0.72]]),
    T("eclipse", "Eclipse", "#07050F", "#9D4EDD", [["#9D4EDD", 0.28], ["#4B0082", 0.16], ["#06040F", 0.65]]),
    T("neon", "Neon", "#030D0A", "#00F0B5", [["#00F0B5", 0.22], ["#0070FF", 0.12], ["#020A08", 0.65]]),
    T("wildfire", "Wildfire", "#120500", "#FF4D00", [["#FF4D00", 0.42], ["#FF8C00", 0.24], ["#0F0200", 0.72]]),
    T("ember", "Ember", "#0B0A0C", "#FF7A59", [["#FF7A59", 0.07], null, ["#070609", 0.55]], EMBER),
    T("hutch", "Hutch", "#100B1C", "#FF7A59", [["#2A1B45", 0.55], ["#150E22", 0.50], ["#0E0918", 0.82]]),
    T("coral", "Coral", "#150E22", "#FF7A59", [["#FF7A59", 0.16], null, ["#0E0918", 0.6]]),
    T("midnight", "Midnight", "#0B1325", "#5AAEFF", [["#5AAEFF", 0.18], null, ["#050814", 0.65]]),
    T("forest", "Forest", "#0D1A14", "#3FD485", [["#3FD485", 0.14], null, ["#050D08", 0.6]]),
    T("sunset", "Sunset", "#1F0F14", "#FFB347", [["#FF7A3D", 0.18], ["#C13B7A", 0.08], ["#0F0608", 0.6]]),
    T("mono", "Mono", "#141416", "#E0E0E0", [["#FFFFFF", 0.06], null, ["#000000", 0.55]]),
    T("candy", "Candy", "#1A0E1C", "#FF6BB5", [["#FF6BB5", 0.18], ["#52C5FF", 0.08], ["#0E0612", 0.6]]),
    T("paper", "Paper", "#FAFAFA", "#4287F5", [["#000000", 0.02], null, ["#000000", 0.04]], LIGHT),
    T("graphite", "Graphite", "#1C1C1E", "#4287F5", [["#FFFFFF", 0.02], null, ["#000000", 0.25]])
  ];
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const rgba = (stop) => (stop ? `rgb(${rgb(stop[0]).join(" ")} / ${stop[1]})` : "transparent");
  const lum = (hex) => {
    const c = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const onAccent = (hex) => (1.05 / (lum(hex) + 0.05) >= (lum(hex) + 0.05) / 0.0533 ? "#FFFFFF" : "#0B0A0C");

  const look = { theme: THEMES[2], mat: "ledger" };
  const PAL_VARS = ["--pal-base", "--pal-accent", "--pal-second", "--pal-s1", "--pal-s2", "--pal-s3", "--pal-text", "--pal-text2", "--pal-text3", "--pal-chip", "--pal-rule", "--pal-border", "--on-accent"];

  function applyLook() {
    const t = look.theme;
    const vars = {
      "--pal-base": t.base,
      "--pal-accent": t.accent,
      "--pal-second": (t.stops[1] || t.stops[0])[0],
      "--pal-s1": rgba(t.stops[0]), "--pal-s2": rgba(t.stops[1]), "--pal-s3": rgba(t.stops[2]),
      "--pal-text": t.fg.text, "--pal-text2": t.fg.text2, "--pal-text3": t.fg.text3,
      "--pal-chip": t.fg.chip, "--pal-rule": t.fg.rule, "--pal-border": t.fg.border,
      "--on-accent": onAccent(t.accent)
    };
    if (t.id === "mono" || t.id === "graphite") vars["--pal-second"] = t.id === "mono" ? "#3a3a40" : "#24324a";
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    $$(".pp:not(.ghost)").forEach((p) => {
      p.dataset.mat = look.mat;
      p.toggleAttribute("data-light", t.id === "paper");
    });
    document.dispatchEvent(new Event("pp:look"));
  }
  applyLook();

  // ─── app list and result rows ───

  const G = {
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" fill="currentColor"/>',
    mail: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="m4 7 8 6 8-6"/>',
    notes: '<path d="M7 4.5h10v15H7z"/><path d="M9.5 9h5M9.5 12h5M9.5 15h3"/>',
    music: '<path d="M10 17V6.5l9-2V15"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3"/>',
    bubble: '<path d="M12 5c4.7 0 8 2.9 8 6.4s-3.3 6.4-8 6.4c-.9 0-1.8-.1-2.6-.3L5.5 19l1-3.2C5 14.6 4 13.1 4 11.4 4 7.9 7.3 5 12 5z"/>',
    pin: '<path d="M12 20s6-5.4 6-10a6 6 0 0 0-12 0c0 4.6 6 10 6 10z"/><circle cx="12" cy="10" r="2.2"/>',
    photos: '<circle cx="12" cy="7.5" r="3"/><circle cx="16.5" cy="12" r="3"/><circle cx="12" cy="16.5" r="3"/><circle cx="7.5" cy="12" r="3"/>',
    finder: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 4c-1.5 3-2 5.5-1.6 9H13M8.5 9v1.5M15.5 9v1.5M8 15.5c2.4 1.6 5.6 1.6 8 0"/>',
    terminal: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="m7.5 10 2.5 2-2.5 2M12 15h4.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5M6 6l1.8 1.8M16.2 16.2 18 18M6 18l1.8-1.8M16.2 7.8 18 6"/>',
    store: '<path d="M8.5 16.5 12.8 9M15.5 16.5 11.2 9M6.5 14h11"/>',
    list: '<circle cx="7" cy="8" r="1.3" fill="currentColor"/><circle cx="7" cy="12" r="1.3" fill="currentColor"/><circle cx="7" cy="16" r="1.3" fill="currentColor"/><path d="M10.5 8H18M10.5 12H18M10.5 16H18"/>',
    camera: '<rect x="3.5" y="7" width="11" height="10" rx="2.5"/><path d="m14.5 11 5-3v8l-5-3"/>',
    preview: '<rect x="4.5" y="4" width="15" height="16" rx="2"/><circle cx="10" cy="10" r="2"/><path d="m5 18 5-4 3 2 3-3 3.5 3"/>',
    hammer: '<path d="m13 5 6 6-2 2-6-6zM12 8 5 15l2 2 7-7"/>',
    figma: '<path d="M9 3.5h3v5H9a2.5 2.5 0 0 1 0-5zM12 3.5h3a2.5 2.5 0 0 1 0 5h-3zM9 8.5h3v5H9a2.5 2.5 0 0 1 0-5zM14.5 8.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM9 13.5h3V16a2.5 2.5 0 1 1-3-2.5z"/>',
    hash: '<path d="M9.5 4.5 8 19.5M16 4.5l-1.5 15M5 9h14.5M4.5 15H19"/>',
    podcast: '<circle cx="12" cy="10" r="2.5"/><path d="M12 13v7M7.8 14.5a6 6 0 1 1 8.4 0"/>',
    calc: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'
  };
  const SYS = "/System/Applications", APPDIR = "/Applications";
  const A = (name, glyph, a, b, fg = "#fff", dir = SYS, running = false) => ({ name, glyph, bg: `linear-gradient(${a}, ${b})`, fg, dir, running });
  const APPS = [
    A("Safari", "compass", "#46B2FF", "#1A6FE0", "#fff", APPDIR, true),
    A("Safari Technology Preview", "compass", "#9B6BFF", "#5B2BD1", "#fff", APPDIR),
    A("Mail", "mail", "#55C6FF", "#1677F2", "#fff", SYS, true),
    A("Messages", "bubble", "#64F383", "#1DBE3D"),
    A("Maps", "pin", "#72E38A", "#2D9CDB"),
    A("Music", "music", "#FF6A85", "#F5264D"),
    A("Notes", "notes", "#FFE66B", "#F6C21B", "#5C4600", SYS, true),
    A("Calendar", "calendar", "#FFFFFF", "#E7E7EC", "#E8453C"),
    A("Reminders", "list", "#FFFFFF", "#E7E7EC", "#2F7CF6"),
    A("Photos", "photos", "#FFFFFF", "#E7E7EC", "#F28C28"),
    A("FaceTime", "camera", "#64F383", "#1DBE3D"),
    A("Finder", "finder", "#6BC4FF", "#2B7DE9", "#fff", "/System/Library/CoreServices", true),
    A("Preview", "preview", "#70CDFF", "#2D86E6"),
    A("Podcasts", "podcast", "#D884FF", "#8D3BEB"),
    A("App Store", "store", "#45B8FF", "#1471F0"),
    A("System Settings", "gear", "#A8A8B0", "#6B6B74"),
    A("Terminal", "terminal", "#4D4D52", "#1E1E21", "#fff", "/System/Applications/Utilities", true),
    A("Xcode", "hammer", "#55C6FF", "#1A6EE8", "#fff", APPDIR, true),
    A("Figma", "figma", "#2E2E31", "#19191B", "#fff", APPDIR),
    A("Slack", "hash", "#8A4597", "#4A154B", "#fff", APPDIR, true)
  ];
  const OTHER = {
    "Google Chrome": A("Google Chrome", "globe", "#FDFDFE", "#DCDCE2", "#3B7BEF", APPDIR, true),
    Spotify: A("Spotify", "music", "#3A3A3F", "#151517", "#4ADE80", APPDIR, true),
    "Docker Desktop": A("Docker Desktop", "box", "#5BB4FF", "#1D63ED", "#fff", APPDIR, true),
    Keynote: A("Keynote", "podium", "#5AB0FF", "#1C6CF0", "#fff", APPDIR, true)
  };
  const appNamed = (name) => APPS.find((a) => a.name === name) || OTHER[name];
  const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${G[name]}</svg>`;
  Object.assign(G, {
    ruler: '<path d="M4 15.5 15.5 4l4.5 4.5L8.5 20z"/><path d="m8 12 2 2M10.5 9.5l1.5 1.5M13 7l2 2"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2 0 2.8 5.4 1.4 5.4 4.2 0 1.2-1.2 2-2.8 2-1.2 0-2.3-.5-2.8-1.4M12 6.2v1.7M12 16.1v1.7"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    trash: '<path d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
    restart: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
    power: '<path d="M12 3.5v8M7 6.5a7.5 7.5 0 1 0 10 0"/>',
    halfmoon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor"/>',
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M11.5 3.5v2.5"/>',
    desktop: '<rect x="3.5" y="4.5" width="17" height="12" rx="2"/><path d="M9 20h6M12 16.5V20"/>',
    sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
    half: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><rect x="5.5" y="7" width="5.5" height="10" rx="1" fill="currentColor" stroke="none"/>',
    full: '<path d="M4.5 9.5v-5h5M19.5 9.5v-5h-5M4.5 14.5v5h5M19.5 14.5v5h-5"/>',
    clip: '<rect x="5.5" y="5" width="13" height="16" rx="2.5"/><path d="M9 5V3.5h6V5M9 11h6M9 15h4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    text: '<path d="M5 6.5h14M5 11h14M5 15.5h9"/>',
    doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 13h5M9.5 16.5h5"/>',
    folder: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    sparkles: '<path d="M11 4.5 12.6 9 17 10.5 12.6 12 11 16.5 9.4 12 5 10.5 9.4 9z"/><path d="M18 15v4M16 17h4"/>',
    octagon: '<path d="M8.3 3.5h7.4l4.8 4.8v7.4l-4.8 4.8H8.3l-4.8-4.8V8.3z"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>',
    port: '<path d="M9 3.5v4M15 3.5v4M6.5 7.5h11V11a5.5 5.5 0 0 1-11 0zM12 16.5v4M4 4l16 16"/>',
    grid: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>',
    windows: '<rect x="3.5" y="8" width="13" height="10" rx="2"/><path d="M7.5 8V6a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 20.5 6v8a1.5 1.5 0 0 1-1.5 1.5h-2.5"/>',
    toggle: '<rect x="3.5" y="7.5" width="17" height="9" rx="4.5"/><circle cx="15.5" cy="12" r="2.3" fill="currentColor"/>',
    bolt: '<path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z"/>',
    command: '<path d="M9 9h6v6H9zM9 9H7a2 2 0 1 1 2-2zM15 9V7a2 2 0 1 1 2 2zM15 15h2a2 2 0 1 1-2 2zM9 15v2a2 2 0 1 1-2-2z"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 6h2"/>'
  });

  Object.assign(G, {
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z"/>',
    box: '<path d="m12 3.5 8 4.2v8.6l-8 4.2-8-4.2V7.7z"/><path d="m4 7.7 8 4.3 8-4.3M12 12v8.5"/>',
    podium: '<path d="M5 7.5h14l-2 6H7z"/><path d="M12 13.5v6M8.5 19.5h7M12 4v3.5"/>',
    smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c1.8 2 5.2 2 7 0M9.3 9.6h.01M14.7 9.6h.01"/>',
    fx: '<path d="M13.5 4.5c-2 0-2.8 1-3.2 3L8.5 19.5c-.3 1.5-1 2-2 2"/><path d="M7.5 9.5h6M13.5 12.5l5 6M18.5 12.5l-5 6"/>',
    scroll: '<path d="M8 4.5h10a2 2 0 0 1 0 4h-2v9a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 17.5V17h9.5"/><path d="M8 4.5A2 2 0 0 0 6 6.5V17M10 9.5h3M10 13h3"/>',
    stack: '<path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4M4 16l8 4 8-4"/>'
  });

  const DOCS = { pdf: "#EF4B3F", numbers: "#2FB55A", key: "#2E86F5", png: "#8E6CF0", txt: "#8A8A94" };
  const docArt = (title) => {
    const ext = (/\.([a-z0-9]+)$/i.exec(title) || [0, "txt"])[1].toLowerCase();
    const c = DOCS[ext] || DOCS.txt;
    return `<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M5.2 1.5h8.3l4.3 4.3v13.4a1.3 1.3 0 0 1-1.3 1.3H5.2a1.3 1.3 0 0 1-1.3-1.3V2.8a1.3 1.3 0 0 1 1.3-1.3z" fill="#FBFBFD" stroke="rgb(0 0 0 / 0.18)" stroke-width="0.5"/><path d="M13.5 1.5v3a1.3 1.3 0 0 0 1.3 1.3h3" fill="#E1E1E7" stroke="rgb(0 0 0 / 0.14)" stroke-width="0.5"/><rect x="3.9" y="12" width="13.9" height="4.6" fill="${c}"/><path d="M6.5 8.3h6M6.5 10h8" stroke="#C9C9D1" stroke-width="0.9" stroke-linecap="round"/></svg>`;
  };
  function artHTML(r) {
    if (r.app) return `<span class="pp-art app" style="background:${r.app.bg};color:${r.app.fg}">${svg(r.app.glyph)}</span>`;
    if (r.doc) return `<span class="pp-art pp-file">${docArt(r.title)}</span>`;
    return `<span class="pp-art sym" style="--tint:${r.tint || "var(--pal-accent)"}">${svg(r.glyph)}</span>`;
  }

  const KIND = {
    app: ["Application", "Launch"], toggle: ["Toggle", "Toggle"], action: ["Command", "Run"],
    file: ["File", "Open"], web: ["Web Search", "Search"], calculator: ["Calculator", "Copy"]
  };
  const primaryHint = (r) => (!r ? "Open" : r.pk === "app" && r.app.running ? "Switch" : KIND[r.pk][1]);

  function rowEl(r) {
    const li = document.createElement("li");
    li.className = "pp-row";
    li.setAttribute("role", "option");
    li.innerHTML = '<span class="pp-ico"></span><span class="pp-tx"><span class="pp-t"></span><span class="pp-s"></span></span><span class="pp-tag">Licence</span><span class="pp-run" title="Running"></span><span class="pp-kind"></span><span class="pp-ret"></span><span class="pp-act"><b>⌘K</b>Actions</span>';
    fill(li, r);
    return li;
  }
  function fill(li, r) {
    const ico = $(".pp-ico", li);
    const face = r.app ? "app:" + r.app.name : r.doc ? "doc:" + r.title : r.glyph + (r.tint || "");
    if (ico.dataset.face !== face) {
      ico.dataset.face = face;
      ico.innerHTML = artHTML(r);
    }
    $(".pp-t", li).textContent = r.title;
    $(".pp-s", li).textContent = r.sub || "";
    $(".pp-kind", li).textContent = KIND[r.pk][0];
    $(".pp-ret", li).textContent = r.ret;
    li.classList.toggle("lic", !!r.paid);
    li.classList.toggle("running", !!(r.app && r.app.running && r.pk === "app"));
    li.classList.toggle("acts", !!r.actions);
  }

  const plural = (n, one) => `${n} ${n === 1 ? one : one + "s"}`;
  const BADGE = [["app", "app"], ["toggle", "toggle"], ["action", "action"], ["file", "file"], ["calculator", "calculation"], ["web", "web result"]];
  const badge = (rows) => BADGE.map(([k, one]) => [rows.filter((r) => r.pk === k).length, one]).filter(([n]) => n).map(([n, one]) => plural(n, one)).join(" · ");

  function hintsFor(r) {
    const h = [["↩", primaryHint(r)]];
    if (r && r.cmd) h.push(["⌘↩", r.cmd]);
    if (r && r.opt) h.push(["⌥↩", r.opt]);
    h.push(["↑↓", "Navigate"], ["Esc", "Dismiss"]);
    if (r && r.actions) h.push(["⌘K", "Actions"]);
    return h;
  }
  function paintFoot(panel, rows, r) {
    const hints = $(".pp-hints", panel);
    hints.textContent = "";
    hintsFor(r).forEach(([k, t]) => {
      const s = document.createElement("span");
      s.className = "pp-hint";
      const b = document.createElement("b");
      b.textContent = k;
      s.append(b, document.createTextNode(t));
      hints.appendChild(s);
    });
    $(".pp-badge", panel).textContent = badge(rows);
    const cp = $(".pp-cbtn.primary", panel), ca = $(".pp-cbtn.act", panel);
    $("span", cp).textContent = r && r.pk === "app" ? (r.app.running ? "Switch to Application" : "Open Application") : primaryHint(r);
    cp.hidden = !rows.length;
    ca.hidden = !(r && r.actions);
  }

  // ─── a small arithmetic parser; no eval ───

  function evaluate(src) {
    const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/(\d)\s*x\s*(?=[\d(.])/gi, "$1*").replace(/,/g, "");
    if (!/\d/.test(s) || !/[-+*/^%()]/.test(s.replace(/^\s*-/, ""))) return null;
    let i = 0;
    const peek = () => { while (s[i] === " ") i++; return s[i]; };
    const fail = () => { throw 0; };
    function number() {
      peek();
      const m = /^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i.exec(s.slice(i));
      if (!m) fail();
      i += m[0].length;
      return parseFloat(m[0]);
    }
    function primary() {
      const c = peek();
      if (c === "(") { i++; const v = expr(); if (peek() !== ")") fail(); i++; return v; }
      return number();
    }
    function postfix() {
      let v = primary();
      while (peek() === "%") { i++; v /= 100; }
      return v;
    }
    function unary() {
      const c = peek();
      if (c === "-") { i++; return -unary(); }
      if (c === "+") { i++; return unary(); }
      return power();
    }
    function power() {
      const b = postfix();
      if (peek() === "^") { i++; return Math.pow(b, unary()); }
      return b;
    }
    function term() {
      let v = unary();
      for (let c = peek(); c === "*" || c === "/"; c = peek()) {
        i++;
        const r = unary();
        if (c === "/" && r === 0) fail();
        v = c === "*" ? v * r : v / r;
      }
      return v;
    }
    function expr() {
      let v = term();
      for (let c = peek(); c === "+" || c === "-"; c = peek()) { i++; v = c === "+" ? v + term() : v - term(); }
      return v;
    }
    try {
      const v = expr();
      if (peek() !== undefined || !isFinite(v)) return null;
      return v;
    } catch (e) { return null; }
  }
  const fmt = (v) => parseFloat(v.toPrecision(12)).toLocaleString("en-US", { maximumFractionDigits: 10 });

  function score(q, name) {
    const n = name.toLowerCase();
    if (n.startsWith(q)) return 300 - n.length;
    if (n.split(/\s+/).some((w) => w.startsWith(q))) return 200 - n.length;
    if (n.includes(q)) return 150 - n.length;
    let at = -1, gaps = 0;
    for (const ch of q) {
      const next = n.indexOf(ch, at + 1);
      if (next < 0) return null;
      gaps += next - at - 1;
      at = next;
    }
    return 100 - gaps - n.length * 0.1;
  }
  const best = (q, names, fuzzy) => {
    let top = null;
    names.forEach((n) => {
      const s = score(q, n);
      if (s !== null && (fuzzy || s >= 150 - n.length) && (top === null || s > top)) top = s;
    });
    return top;
  };

  const TINT = { teal: "#2ECC71", green: "#30D158", pink: "#FF5188", purple: "#9B59B6", blue: "#3A9EFF", amber: "#F39C12", red: "#E74C3C", indigo: "#5E5CE6", cyan: "#32ADE6", mint: "#00C7BE", orange: "#FF9F0A", sys: "#FF453A" };

  const SCOPES = [
    ["app:", "apps:", "Apps", "grid", TINT.purple, "Search apps…"],
    ["file:", "files:", "Files", "folder", TINT.blue, "Search files…"],
    ["clip:", "clipboard:", "Clipboard", "clip", TINT.pink, "Search clipboard…", true],
    ["win:", "windows:", "Windows", "windows", TINT.teal, "Switch to window…"],
    ["toggle:", "toggles:", "Toggles", "toggle", TINT.amber, "Search toggles…"],
    [">", ">", "Actions", "bolt", null, "Run an action…"],
    ["sc:", "shortcuts:", "Shortcuts", "command", TINT.cyan, "Run a shortcut…", true],
    ["script:", "scripts:", "Scripts", "terminal", TINT.mint, "Run a script…", true],
    ["sim:", "simulators:", "Simulators", "phone", TINT.indigo, "Boot a simulator…", true]
  ].map(([prefix, canon, name, glyph, tint, placeholder, paid]) => ({ prefix, canon, name, glyph, tint, placeholder, paid }));
  const ALIASES = { "apps:": "app:", "a:": "app:", "files:": "file:", "f:": "file:", "clipboard:": "clip:", "clips:": "clip:", "c:": "clip:", "windows:": "win:", "toggles:": "toggle:", "t:": "toggle:", "actions:": ">", "action:": ">", "do:": ">", "shortcuts:": "sc:", "shortcut:": "sc:", "scripts:": "script:", "simulators:": "sim:" };

  const SYSTEM = [
    ["Lock Screen", "Lock and require password", "lock", ["lock"], TINT.sys],
    ["Sleep", "Put the Mac to sleep", "moon", [], TINT.indigo],
    ["Display Sleep", "Put the display to sleep", "desktop", [], TINT.indigo],
    ["Restart…", "Confirm before restarting", "restart", ["reboot"], TINT.orange],
    ["Shut Down…", "Confirm before powering off", "power", ["shutdown", "power off"], TINT.sys],
    ["Empty Trash", "Permanently remove items in Trash", "trash", ["trash"], TINT.sys]
  ];
  const TOGGLES = [
    { name: "Dark Mode", sub: "Switch system appearance", glyph: "halfmoon", tint: TINT.indigo, on: false, keys: ["dark", "appearance"] },
    { name: "Caffeinate", sub: "Keep the Mac awake", onSub: "Active indefinitely", glyph: "cup", tint: TINT.orange, on: false, keys: ["keep awake", "awake", "no sleep"] },
    { name: "Hide Desktop Icons", sub: "Clean look while presenting or recording", glyph: "desktop", tint: TINT.blue, on: false, keys: ["hide desktop", "desktop"] },
    { name: "Night Shift", sub: "Warmer colours after dark", glyph: "moon", tint: TINT.amber, on: true, keys: [] },
    { name: "True Tone", sub: "Match the display to the room", glyph: "sun", tint: TINT.amber, on: true, keys: [] }
  ];
  const SNAPS = [["Left Half", "half"], ["Right Half", "half"], ["Top Half", "half"], ["Fullscreen", "full"], ["Center", "full"], ["Left Third", "half"], ["Next Screen", "windows"]];
  const CLIPS = [
    { title: "https://hutch.coursion.studio/pricing", sub: "2 min. ago" },
    { title: "#FF7A59", sub: "14 min. ago" },
    { title: "Moved to Thursday 3pm, same room. I'll bring the deck.", sub: "1 hr. ago" },
    { title: "git commit -m \"Ship the pricing page\"", sub: "yesterday" }
  ];
  const FILES = [
    ["Invoice-2026-10.pdf", "~/Documents"],
    ["Q4 budget.numbers", "~/Documents/Finance"],
    ["Launch deck.key", "~/Desktop"],
    ["Screenshot 2026-10-14 at 09.41.png", "~/Desktop"],
    ["trip-itinerary.pdf", "~/Downloads"]
  ];
  const WINDOWS = [["Inbox", "Mail"], ["hutch-release", "Terminal"], ["Launch deck.key", "Keynote"], ["Pricing · Hutch", "Safari"]];
  const PROCS = [["Google Chrome", 812, "com.google.Chrome"], ["Slack", 1043, "com.tinyspeck.slackmacgap"], ["Xcode", 2210, "com.apple.dt.Xcode"], ["Spotify", 1388, "com.spotify.client"], ["Docker Desktop", 977, "com.docker.docker"]];
  const PORTS = [[3000, "node", 4127], [5173, "vite", 4380], [8000, "python3", 5012], [5432, "postgres", 611]];
  const EMOJI = [["🔥", "Fire", "lit hot fire"], ["🥳", "Partying Face", "party celebrate"], ["🎉", "Party Popper", "celebrate party tada"], ["🎊", "Confetti Ball", "celebrate party"], ["🎈", "Balloon", "party birthday"], ["🚀", "Rocket", "launch ship fast"], ["✨", "Sparkles", "shine magic ai"], ["👍", "Thumbs Up", "yes good approve lgtm"], ["❤️", "Red Heart", "love heart"]];
  const SHORTCUTS = [["Morning routine", "Shortcut"], ["Resize images", "Shortcut"], ["Log water", "Shortcut"]];
  const SCRIPTS = [["Rename screenshots", "AppleScript"], ["Mute all tabs", "AppleScript"]];
  const SIMS = [["iPhone 16 Pro", "iOS 18.2 · Shut down"], ["iPad Air 13-inch", "iPadOS 18.2 · Shut down"], ["Apple Watch Series 10", "watchOS 11.2 · Shut down"]];

  const FX = { usd: 1, eur: 0.92, gbp: 0.79, jpy: 152, chf: 0.91, cad: 1.37, aud: 1.52, cny: 7.24, inr: 83.5, try: 32.5, sek: 10.5, nok: 10.8, pln: 4.05 };
  const FX_ALIAS = { $: "usd", dollar: "usd", dollars: "usd", "€": "eur", euro: "eur", euros: "eur", "£": "gbp", pound: "gbp", pounds: "gbp", quid: "gbp", yen: "jpy", tl: "try", lira: "try" };
  const UNITS = {
    m: ["len", 1], meter: ["len", 1], meters: ["len", 1], km: ["len", 1000], cm: ["len", 0.01], mm: ["len", 0.001], in: ["len", 0.0254], inch: ["len", 0.0254], inches: ["len", 0.0254], ft: ["len", 0.3048], feet: ["len", 0.3048], foot: ["len", 0.3048], yd: ["len", 0.9144], mi: ["len", 1609.344], mile: ["len", 1609.344],
    kg: ["mass", 1], g: ["mass", 0.001], lb: ["mass", 0.453592], lbs: ["mass", 0.453592], oz: ["mass", 0.0283495],
    c: ["temp", 1], celsius: ["temp", 1], f: ["temp", 2], fahrenheit: ["temp", 2], k: ["temp", 3], kelvin: ["temp", 3],
    l: ["vol", 1], liter: ["vol", 1], liters: ["vol", 1], ml: ["vol", 0.001], gal: ["vol", 3.78541], qt: ["vol", 0.946353], cup: ["vol", 0.24],
    s: ["time", 1], sec: ["time", 1], min: ["time", 60], h: ["time", 3600], hr: ["time", 3600], hour: ["time", 3600], d: ["time", 86400], day: ["time", 86400]
  };
  const num = (v, d) => v.toLocaleString("en-US", { maximumFractionDigits: d });

  function convert(q) {
    const t = q.toLowerCase().replace(/,/g, ".").split(/\s+/).filter(Boolean);
    if (t.length < 4 || (t[2] !== "to" && t[2] !== "in")) return null;
    const v = Number(t[0]);
    if (!isFinite(v) || t[0] === "") return null;
    const cf = FX[t[1]] ? t[1] : FX_ALIAS[t[1]], ct = FX[t[3]] ? t[3] : FX_ALIAS[t[3]];
    if (cf && ct) {
      const out = num((v / FX[cf]) * FX[ct], 2) + " " + ct.toUpperCase();
      return { id: "fx", title: out, raw: out, sub: `${q.trim()} · example rate, live in the app`, glyph: "coin", tint: TINT.green, ret: "Copy", pk: "calculator", kind: "copy", paid: true };
    }
    const a = UNITS[t[1]], b = UNITS[t[3]];
    if (!a || !b || a[0] !== b[0]) return null;
    let out;
    if (a[0] === "temp") {
      const c = a[1] === 1 ? v : a[1] === 2 ? (v - 32) * 5 / 9 : v - 273.15;
      out = b[1] === 1 ? c : b[1] === 2 ? c * 9 / 5 + 32 : c + 273.15;
    } else out = (v * a[1]) / b[1];
    const text = `${num(out, 4)} ${t[3]}`;
    return { id: "convert", title: text, raw: text, sub: q.trim(), glyph: "ruler", tint: TINT.mint, ret: "Copy", pk: "calculator", kind: "copy", paid: true };
  }

  const R = {
    app: (app) => ({ id: "app:" + app.name, title: app.name, sub: app.running ? `${app.dir} · Running` : app.dir, app, ret: "Launch", pk: "app", kind: "app", actions: true, cmd: app.running ? "Quit" : null, opt: "Reveal in Finder" }),
    system: ([title, sub, glyph, , tint]) => ({ id: "sys:" + title, title, sub, glyph, tint, ret: "Run", pk: "action", kind: "system" }),
    toggle: (t) => ({ id: "tg:" + t.name, title: t.name, sub: t.on && t.onSub ? t.onSub : t.sub, glyph: t.glyph, tint: t.tint, ret: t.on ? "Off" : "On", pk: "toggle", kind: "toggle", ref: t }),
    snap: ([label, glyph]) => ({ id: "snap:" + label, title: "Snap to " + label, sub: "Window Manager", glyph, tint: TINT.purple, ret: "Snap", pk: "action", kind: "snap" }),
    clip: (c, n) => ({ id: "clip:" + n, title: c.title, sub: c.sub, glyph: "clip", tint: TINT.purple, ret: "Paste", pk: "action", kind: "clip", paid: true }),
    file: ([title, sub]) => ({ id: "file:" + title, title, sub, doc: true, ret: "Open", pk: "file", kind: "file" }),
    win: ([title, app]) => ({ id: "win:" + title, title, sub: app, app: appNamed(app), ret: "Switch", pk: "action", kind: "win" }),
    emoji: ([char, name, keys]) => ({ id: "emo:" + name, title: `${char}  ${name}`, raw: char, sub: keys.split(" ").slice(0, 4).join(" · "), glyph: "smile", tint: "#FFB347", ret: "Copy", pk: "action", kind: "copy", cmd: "Paste into focused app", opt: "Copy character only" }),
    proc: ([name, pid, bundle]) => ({ id: "kill:" + pid, title: name, sub: `PID ${pid} · ${bundle}`, app: appNamed(name), ret: "Run", pk: "action", kind: "kill", paid: true, actions: true, cmd: "Force Quit" }),
    port: ([port, cmd, pid]) => ({ id: "port:" + port, title: `Kill port ${port} — ${cmd}`, sub: `PID ${pid} · listening on 127.0.0.1:${port}`, glyph: "port", tint: TINT.red, ret: "Run", pk: "action", kind: "port", paid: true, actions: true }),
    scope: (s) => ({ id: "scope:" + s.name, title: s.name, sub: `Type "${s.canon}" · press ↩ to activate`, glyph: s.glyph, tint: s.tint, ret: "Run", pk: "action", kind: "scope", scope: s, paid: s.paid }),
    plain: (kind, glyph, tint, paid, actions) => ([title, sub]) => ({ id: kind + ":" + title, title, sub, glyph, tint, ret: "Run", pk: "action", kind, paid, actions })
  };

  function rank(q, items, names, make, limit, fuzzy) {
    return items
      .map((it) => ({ it, s: q ? best(q, names(it), fuzzy) : 0 }))
      .filter((m) => m.s !== null)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((m, n) => make(m.it, n));
  }

  function scoped(prefix, rest, limit) {
    const q = rest.trim().toLowerCase();
    const one = (n) => [n.toLowerCase()];
    switch (prefix) {
      case "app:": return rank(q, APPS, (a) => one(a.name), R.app, limit, true);
      case "file:": return rank(q, FILES, (f) => one(f[0]), R.file, limit, true);
      case "clip:": return rank(q, CLIPS, (c) => one(c.title), R.clip, limit, false);
      case "win:": return rank(q, WINDOWS, (w) => [w[0].toLowerCase(), w[1].toLowerCase()], R.win, limit, true);
      case "toggle:": return rank(q, TOGGLES, (t) => [t.name.toLowerCase(), ...t.keys], R.toggle, limit, true);
      case ">": return [...rank(q, SYSTEM, (s) => [s[0].toLowerCase(), ...s[3]], R.system, limit, false), ...rank(q, SNAPS, (s) => ["snap to " + s[0].toLowerCase()], R.snap, limit, false)].slice(0, limit);
      case "sc:": return rank(q, SHORTCUTS, (s) => one(s[0]), R.plain("shortcut", "stack", TINT.purple, true, true), limit, true);
      case "script:": return rank(q, SCRIPTS, (s) => one(s[0]), R.plain("script", "scroll", TINT.amber, true, true), limit, true);
      case "sim:": return rank(q, SIMS, (s) => one(s[0]), R.plain("sim", "phone", TINT.blue, true, true), limit, true);
    }
    return [];
  }

  function scopeOf(query) {
    const lq = query.toLowerCase();
    const keys = [...SCOPES.map((s) => s.prefix), ...Object.keys(ALIASES)].sort((a, b) => b.length - a.length);
    const hit = keys.find((k) => lq.startsWith(k));
    if (!hit) return null;
    const prefix = ALIASES[hit] || hit;
    return { scope: SCOPES.find((s) => s.prefix === prefix), rest: query.slice(hit.length) };
  }

  const webRow = (q) => ({ id: "web", title: `Search the web for "${q}"`, sub: "Routed through Browser Picker", glyph: "search", tint: TINT.teal, ret: "Search", pk: "web", kind: "web" });
  const RECENT = ["Safari", "Mail", "Notes", "Terminal", "Xcode", "Calendar", "Music"].map((n) => R.app(appNamed(n)));

  function results(query, limit = 3) {
    const q = query.trim();
    if (!q) return [];
    const lq = q.toLowerCase();
    if (lq === ":") return SCOPES.map(R.scope);
    const sc = scopeOf(q);
    if (sc) return scoped(sc.scope.prefix, sc.rest, limit).map((r) => Object.assign(r, { paid: false }));

    const emo = /^emoji(\s+(.*))?$/.exec(lq) || (/^:\S/.test(lq) ? [0, 0, lq.slice(1)] : null);
    if (emo) {
      const n = (emo[2] || "").trim();
      return EMOJI.filter(([, name, keys]) => !n || name.toLowerCase().split(" ").concat(keys.split(" ")).some((w) => w.startsWith(n))).slice(0, limit).map(R.emoji);
    }
    const ai = /^ai\s+(.+)/.exec(q);
    if (ai) {
      const p = ai[1].length > 54 ? ai[1].slice(0, 54) + "…" : ai[1];
      return [
        { id: "ai", title: `Ask AI: ${p}`, sub: "Uses your own API key · Anthropic or OpenAI-compatible", glyph: "sparkles", ret: "Run", pk: "action", kind: "ai", paid: true },
        webRow(q)
      ];
    }
    const kill = /^(?:kill|quit)(?:\s+(.*))?$/.exec(lq);
    if (kill && !/^kill port/.test(lq)) return rank((kill[1] || "").trim(), PROCS, (p) => [p[0].toLowerCase(), p[2]], R.proc, limit, false);
    const port = /^(?:kill\s+)?ports?(?:\s+(\d*))?$/.exec(lq);
    if (port) return PORTS.filter((p) => !port[1] || String(p[0]).startsWith(port[1])).slice(0, limit).map(R.port);

    const rows = [];
    const conv = convert(q);
    if (conv) rows.push(conv);
    const v = conv ? null : evaluate(q);
    if (v !== null) rows.push({ id: "calc", title: fmt(v), raw: String(parseFloat(v.toPrecision(12))), sub: q, glyph: "fx", tint: TINT.pink, ret: "Copy", pk: "calculator", kind: "copy" });
    const pool = [];
    const add = (s, w, row) => { if (s !== null) pool.push({ s: s + w, row }); };
    APPS.forEach((a) => add(score(lq, a.name), 40, R.app(a)));
    if (lq.length > 1) {
      TOGGLES.forEach((t) => add(best(lq, [t.name.toLowerCase(), ...t.keys], false), 22, R.toggle(t)));
      SYSTEM.forEach((s) => add(best(lq, [s[0].toLowerCase(), ...s[3]], false), 18, R.system(s)));
      SNAPS.forEach((s) => add(best(lq, [s[0].toLowerCase(), "snap to " + s[0].toLowerCase()], false), 18, R.snap(s)));
      FILES.forEach((f) => add(best(lq, [f[0].toLowerCase()], false), 8, R.file(f)));
    }
    pool.sort((a, b) => b.s - a.s).forEach((p) => rows.push(p.row));
    rows.push(webRow(q));
    return rows.slice(0, limit);
  }

  // ─── Try it ───

  (() => {
    const panel = $(".js-try");
    if (!panel) return;
    const input = $(".js-try-input", panel);
    const list = $(".js-try-results", panel);
    const box = $(".pp-results", panel);
    const chip = $(".js-try-scope", panel);
    const clear = $(".js-try-clear", panel);
    const emptyTitle = $(".js-try-empty", panel);
    const emptyTip = $(".js-try-tip", panel);
    const statuses = $$(".js-try-status", panel);
    const count = $(".js-try-count");
    const lic = $(".js-try-lic", panel);
    const chips = $$(".chip-q");
    const LIMIT = 8;
    const narrow = matchMedia("(max-width: 560px)");
    const visibleRows = () => (narrow.matches ? 4 : 8);
    const PLACEHOLDER = input.placeholder;
    const TIPS = [
      "Type a maths expression like 5 * 120. ↩ copies the result.",
      "Type “left half” or “fullscreen” to snap the focused window.",
      "Try “dark mode” to flip Dark Mode without leaving the keyboard.",
      "⌘↩ on a running app quits it. ⌥↩ reveals it in Finder."
    ];
    const TOUR = ["10 km to mi", "clip:", "dark", ":fire", "kill chrome", "100 usd to eur"];
    let rows = [], sel = 0, els = new Map(), scope = null, statusTimer = 0, countTimer = 0, auto = 0, touched = false, visible = false, tourAt = 0, tipAt = 0;

    const metric = (name) => parseFloat(getComputedStyle(panel).getPropertyValue(name)) || 0;
    const height = new Spring(0, 0.34, 0.86);
    const sizer = { springs: [height], render() { box.style.height = height.x.toFixed(2) + "px"; } };
    function fit(animate) {
      const row = metric("--row"), gap = metric("--gap"), pad = metric("--pad-t") + metric("--pad-b");
      const n = Math.min(rows.length, visibleRows());
      const target = n ? pad + n * row + (n - 1) * gap : metric("--empty-h");
      box.classList.toggle("scroll", rows.length > visibleRows());
      if (!animate || still.matches || !box.style.height) { height.jump(target); sizer.render(); return; }
      height.to(target);
      run(sizer);
    }

    const full = () => (scope ? scope.prefix : "") + input.value;
    const norm = (text) => { const sc = scopeOf(text); return sc ? sc.scope.prefix + sc.rest.replace(/^\s+/, "") : text; };
    function showScope() {
      chip.hidden = !scope;
      if (scope) {
        $(".pp-scope-ico", chip).innerHTML = svg(scope.glyph);
        $("b", chip).textContent = scope.name;
        chip.setAttribute("aria-label", `Remove the ${scope.name} scope`);
      }
      input.placeholder = scope ? scope.placeholder : PLACEHOLDER;
      clear.hidden = !scope && !input.value;
    }
    function setQuery(text) {
      const sc = scopeOf(text);
      scope = sc ? sc.scope : null;
      input.value = sc ? sc.rest.replace(/^\s+/, "") : text;
      showScope();
    }
    function absorb() {
      if (scope) { showScope(); return; }
      setQuery(input.value);
    }

    function render(animate = true) {
      const q = full();
      rows = q.trim() || scope ? results(q, LIMIT) : RECENT.slice(0, 5);
      sel = Math.min(sel, Math.max(0, rows.length - 1));
      const next = new Map();
      rows.forEach((r) => {
        let li = els.get(r.id);
        if (li) fill(li, r);
        else {
          li = rowEl(r);
          li.id = "try-" + r.id.replace(/[^a-z0-9]/gi, "-");
          li.addEventListener("mousedown", (e) => { e.preventDefault(); });
          li.addEventListener("click", () => { interact(); sel = rows.findIndex((x) => x.id === li.dataset.rid); mark(); activate(); });
          if (!still.matches) li.classList.add("enter");
        }
        li.dataset.rid = r.id;
        next.set(r.id, li);
        list.appendChild(li);
      });
      els.forEach((li, id) => { if (!next.has(id)) li.remove(); });
      els = next;
      requestAnimationFrame(() => requestAnimationFrame(() => $$(".enter", list).forEach((li) => li.classList.remove("enter"))));
      const empty = !rows.length;
      if (empty && !box.classList.contains("empty")) {
        emptyTitle.textContent = scope ? `No ${scope.name.toLowerCase()}` : "No matches";
        emptyTip.textContent = TIPS[tipAt++ % TIPS.length];
      }
      box.classList.toggle("empty", empty);
      if (lic) lic.hidden = !(scope && scope.paid);
      chips.forEach((c) => c.classList.toggle("on", norm(c.dataset.q) === q));
      clearTimeout(countTimer);
      countTimer = setTimeout(() => { if (count) count.textContent = q.trim() ? `${rows.length} result${rows.length === 1 ? "" : "s"}` : ""; }, 400);
      fit(animate);
      mark();
    }
    function mark() {
      box.style.setProperty("--sel", sel);
      rows.forEach((r, n) => {
        const li = els.get(r.id);
        li.classList.toggle("sel", n === sel);
        li.setAttribute("aria-selected", n === sel ? "true" : "false");
      });
      const r = rows[sel];
      paintFoot(panel, rows, r);
      if (r) {
        input.setAttribute("aria-activedescendant", els.get(r.id).id);
        const step = metric("--row") + metric("--gap"), padT = metric("--pad-t"), padB = metric("--pad-b");
        const top = padT + sel * step, bottom = top + metric("--row");
        const view = height.target || box.clientHeight;
        if (top - padT < box.scrollTop) box.scrollTop = top - padT;
        else if (bottom + padB > box.scrollTop + view) box.scrollTop = bottom + padB - view;
      } else input.removeAttribute("aria-activedescendant");
      if (!rows.length) box.scrollTop = 0;
    }
    function status(text) { statuses.forEach((s) => { s.textContent = text; }); }
    function say(text) {
      clearTimeout(statusTimer);
      status(text);
      panel.classList.add("flash");
      statusTimer = setTimeout(() => { statusTimer = 0; status("Pounce"); panel.classList.remove("flash"); }, 2000);
    }
    function copy(text) {
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    }
    function activate() {
      const r = rows[sel];
      if (!r) return;
      switch (r.kind) {
        case "copy": copy(r.raw); say(`Copied ${r.raw}`); break;
        case "toggle":
          r.ref.on = !r.ref.on;
          render();
          say(`${r.title} ${r.ref.on ? "on" : "off"}`);
          break;
        case "scope":
          scope = r.scope;
          input.value = "";
          sel = 0;
          showScope();
          render();
          input.focus({ preventScroll: true });
          break;
        case "app": say(r.app.running ? `On your Mac, ${r.title} comes forward` : `On your Mac, ${r.title} opens`); break;
        case "system": say(/…$/.test(r.title) ? "On your Mac, this asks first" : `On your Mac: ${r.title}`); break;
        case "snap": say("Your last window snaps"); break;
        case "clip": say("Pastes into your last app"); break;
        case "file": say(`On your Mac, ${r.title} opens`); break;
        case "win": say(`Switches to ${r.sub}`); break;
        case "ai": say("Answers stream into a window"); break;
        case "kill": say(`${r.title} quits gracefully`); break;
        case "port": say("Sends SIGTERM to the listener"); break;
        case "web": say("Hutch hands this to your browser"); break;
        default: say("Runs on your Mac");
      }
    }
    function dropScope() {
      scope = null;
      input.value = "";
      sel = 0;
      showScope();
      render();
    }

    function stopAuto() { clearTimeout(auto); auto = 0; }
    function interact() { touched = true; stopAuto(); }
    function typeIn(text, done) {
      stopAuto();
      if (still.matches) { setQuery(text); sel = 0; render(); if (done) done(); return; }
      setQuery("");
      sel = 0;
      let n = 0;
      const step = () => {
        setQuery(text.slice(0, ++n));
        render();
        if (n < text.length) auto = setTimeout(step, 55 + Math.random() * 55);
        else { auto = 0; if (done) done(); }
      };
      auto = setTimeout(step, 140);
    }
    function tour() {
      if (touched || !visible || still.matches) return;
      typeIn(TOUR[tourAt++ % TOUR.length], () => {
        if (!touched) auto = setTimeout(tour, 2300);
      });
    }

    input.addEventListener("input", () => { interact(); sel = 0; absorb(); render(); });
    input.addEventListener("focus", interact);
    panel.addEventListener("pointerdown", interact);
    chip.addEventListener("click", () => { interact(); dropScope(); input.focus({ preventScroll: true }); });
    clear.addEventListener("click", () => { interact(); dropScope(); input.focus({ preventScroll: true }); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!rows.length) return;
        sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
        mark();
      } else if (e.key === "Enter") { e.preventDefault(); activate(); }
      else if (e.key === "Escape") {
        e.preventDefault();
        if (scope && input.value) { input.value = ""; sel = 0; showScope(); render(); }
        else dropScope();
      } else if (e.key === "Backspace" && !input.value && scope) { e.preventDefault(); dropScope(); }
    });
    chips.forEach((b) => b.addEventListener("click", () => {
      interact();
      typeIn(b.dataset.q, () => input.focus({ preventScroll: true }));
    }));
    document.addEventListener("pp:look", () => fit(false));
    narrow.addEventListener("change", () => { fit(false); mark(); });

    const preset = new URLSearchParams(location.search).get("q");
    if (preset !== null) { touched = true; setQuery(preset); }
    render(false);
    watch(panel, () => {
      visible = true;
      if (touched) return;
      if (still.matches) { if (!full()) { setQuery("saf"); render(); } return; }
      if (!auto) auto = setTimeout(tour, 450);
    }, () => {
      visible = false;
      if (!touched) stopAuto();
    }, 0.6);
  })();

  // ─── Make it yours ───

  (() => {
    const panel = $(".js-theme-panel");
    const swatches = $(".js-swatches");
    const name = $(".js-swatch-name");
    if (!panel || !swatches) return;
    const ul = $(".js-theme-rows", panel);
    const sample = results("saf", 2);
    sample.forEach((r, n) => {
      const li = rowEl(r);
      li.classList.add("stat");
      if (n === 0) li.classList.add("sel");
      ul.appendChild(li);
    });
    paintFoot(panel, sample, sample[0]);

    function crossfade(change) {
      if (still.matches) {
        panel.style.transition = "opacity 0.15s ease";
      }
      const ghost = panel.cloneNode(true);
      ghost.classList.add("ghost");
      const cs = getComputedStyle(root);
      PAL_VARS.forEach((v) => ghost.style.setProperty(v, cs.getPropertyValue(v)));
      ghost.style.top = panel.offsetTop + "px";
      ghost.style.width = panel.offsetWidth + "px";
      panel.parentNode.appendChild(ghost);
      change();
      panel.classList.add("fresh");
      panel.getBoundingClientRect();
      requestAnimationFrame(() => {
        panel.classList.remove("fresh");
        ghost.style.opacity = "0";
        if (!still.matches) ghost.style.transform = "translateX(-50%) scale(0.985)";
      });
      setTimeout(() => ghost.remove(), 400);
    }

    function describe() {
      name.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = look.theme.label;
      name.append(b, document.createTextNode(` · ${look.mat[0].toUpperCase() + look.mat.slice(1)}${look.theme.id === "eclipse" && look.mat === "ledger" ? " — the default" : ""}`));
    }

    function radioGroup(group, items, pick) {
      items.forEach((b, n) => {
        b.addEventListener("click", () => pick(b));
        b.addEventListener("keydown", (e) => {
          const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!d) return;
          e.preventDefault();
          const to = items[(n + d + items.length) % items.length];
          to.focus();
          pick(to);
        });
      });
    }
    function check(items, on) {
      items.forEach((b) => {
        b.setAttribute("aria-checked", b === on ? "true" : "false");
        b.tabIndex = b === on ? 0 : -1;
      });
    }

    const sw = THEMES.map((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-label", t.label);
      b.title = t.label;
      b.style.setProperty("--b", t.base);
      b.style.setProperty("--a", t.accent);
      b.dataset.id = t.id;
      swatches.appendChild(b);
      return b;
    });
    const mats = $$(".mat");
    check(sw, sw[2]);
    check(mats, mats.find((m) => m.dataset.style === look.mat));
    describe();

    radioGroup(swatches, sw, (b) => {
      const t = THEMES.find((x) => x.id === b.dataset.id);
      if (t === look.theme) return;
      check(sw, b);
      crossfade(() => { look.theme = t; applyLook(); });
      describe();
    });
    radioGroup($(".materials"), mats, (b) => {
      if (b.dataset.style === look.mat) return;
      check(mats, b);
      crossfade(() => { look.mat = b.dataset.style; applyLook(); });
      describe();
    });
  })();

  // ─── keyboard ───

  (() => {
    const kb = $(".js-kb");
    if (!kb) return;
    const pill = $(".js-kb-pill");
    const text = $(".js-kb-text");
    const keysEl = $(".js-kb-keys");
    const K = (id, label, w = 1, sm = false) => ({ id, label, w, sm });
    const letters = (s) => [...s].map((c) => K(c, c.toUpperCase()));
    const ROWS = [
      [K("`", "`"), ...letters("1234567890-="), K("delete", "⌫", 1.5, true)],
      [K("tab", "⇥", 1.5, true), ...letters("qwertyuiop[]\\")],
      [K("caps", "⇪", 1.75, true), ...letters("asdfghjkl;'"), K("return", "⏎", 1.75, true)],
      [K("shiftL", "⇧", 2.25, true), ...letters("zxcvbnm,./"), K("shiftR", "⇧", 2.25, true)],
      [K("fn", "fn", 1, true), K("controlL", "⌃"), K("optionL", "⌥"), K("commandL", "⌘", 1.25), K("space", "", 5), K("commandR", "⌘", 1.25), K("optionR", "⌥"), K("leftArrow", "←", 1, true), K("vertical", "", 1, true), K("rightArrow", "→", 1, true)]
    ];
    const caps = new Map();
    ROWS.forEach((row) => {
      const r = document.createElement("div");
      r.className = "kb-row";
      row.forEach((k) => {
        const key = document.createElement("div");
        key.className = "key";
        key.style.setProperty("--w", k.w);
        const cap = (id, label, sm) => {
          const c = document.createElement("div");
          c.className = "cap" + (sm ? " sm" : "");
          c.innerHTML = "<span></span>";
          c.firstChild.textContent = label;
          caps.set(id, c);
          return c;
        };
        if (k.id === "vertical") {
          key.classList.add("stack");
          key.append(cap("upArrow", "↑", true), cap("downArrow", "↓", true));
        } else key.append(cap(k.id, k.label, k.sm));
        r.appendChild(key);
      });
      kb.appendChild(r);
    });

    const CODE = {
      Backquote: "`", Minus: "-", Equal: "=", Backspace: "delete", Tab: "tab", BracketLeft: "[", BracketRight: "]", Backslash: "\\",
      CapsLock: "caps", Semicolon: ";", Quote: "'", Enter: "return", NumpadEnter: "return", ShiftLeft: "shiftL", ShiftRight: "shiftR",
      Comma: ",", Period: ".", Slash: "/", ControlLeft: "controlL", ControlRight: "controlL", AltLeft: "optionL", AltRight: "optionR",
      MetaLeft: "commandL", MetaRight: "commandR", OSLeft: "commandL", OSRight: "commandR", Space: "space",
      ArrowLeft: "leftArrow", ArrowRight: "rightArrow", ArrowUp: "upArrow", ArrowDown: "downArrow", IntlBackslash: "`"
    };
    const toId = (code) => CODE[code] || (/^Key[A-Z]$/.test(code) ? code[3].toLowerCase() : /^Digit\d$/.test(code) ? code[5] : null);
    const MOD = { controlL: "⌃", optionL: "⌥", optionR: "⌥", shiftL: "⇧", shiftR: "⇧", commandL: "⌘", commandR: "⌘" };
    const ORDER = ["⌃", "⌥", "⇧", "⌘"];
    const NAME = { space: "Space", return: "⏎", delete: "⌫", tab: "⇥", caps: "⇪", leftArrow: "←", rightArrow: "→", upArrow: "↑", downArrow: "↓" };
    const IDLE = ["commandL", "space", "commandR"];

    const down = new Set();
    let active = false, idleTimer = 0, recent = [];

    function light(ids) { caps.forEach((c, id) => c.classList.toggle("on", ids.includes(id))); }
    function showKeys(ids) {
      const mods = [...new Set(ids.filter((id) => MOD[id]).map((id) => MOD[id]))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
      const rest = ids.filter((id) => !MOD[id]).map((id) => NAME[id] || id.toUpperCase());
      keysEl.innerHTML = "";
      [...mods, ...rest].forEach((t) => { const k = document.createElement("kbd"); k.textContent = t; keysEl.appendChild(k); });
    }
    function idle() {
      kb.classList.remove("live");
      pill.classList.remove("live");
      text.textContent = "Type on your keyboard. The keys light up with yours.";
      light(IDLE);
      showKeys(IDLE.slice(0, 2));
    }
    function update() {
      const ids = [...down];
      light(ids);
      kb.classList.add("live");
      pill.classList.add("live");
      if (ids.length) { recent = ids; text.textContent = "Listening…"; }
      showKeys(ids.length ? ids : recent);
      clearTimeout(idleTimer);
      if (!ids.length) {
        text.textContent = "You pressed";
        idleTimer = setTimeout(idle, 2200);
      }
    }
    addEventListener("keydown", (e) => {
      if (!active || typing(e.target) || !$(".js-palette").hidden) return;
      const id = toId(e.code);
      if (!id) return;
      if (id === "caps") { down.add(id); update(); setTimeout(() => { down.delete(id); update(); }, 180); return; }
      down.add(id);
      update();
    });
    addEventListener("keyup", (e) => {
      const id = toId(e.code);
      if (!id || !down.size) return;
      down.delete(id);
      if (id === "commandL" || id === "commandR") [...down].forEach((d) => { if (!MOD[d]) down.delete(d); });
      update();
    });
    addEventListener("blur", () => { if (down.size) { down.clear(); update(); } });
    if (matchMedia("(hover: none)").matches) {
      light(IDLE);
      text.textContent = "On a Mac, these keys light up as you type.";
      return;
    }
    watch(kb, () => { active = true; }, () => { active = false; down.clear(); idle(); clearTimeout(idleTimer); }, 0.3);
    idle();
  })();

  // ─── windows ───

  (() => {
    const desk = $(".js-desk");
    if (!desk) return;
    const W = {};
    $$(".win", desk).forEach((el) => {
      W[el.dataset.win] = {
        el, skin: $(".win-skin", el), content: $(".win-content", el),
        s: { x: new Spring(0), y: new Spring(0), w: new Spring(0), h: new Spring(0) },
        target: null, laid: null
      };
    });
    const MOVES = [["browser", "left"], ["notes", "right"], ["browser", "tl"], ["notes", "tr"], ["browser", "full"]];
    const snaps = $$(".snap");
    let area = null, front = "notes", cycle = 0, inView = false, pausedUntil = 0, step = 0;

    function measure() {
      const w = desk.clientWidth, h = desk.clientHeight;
      area = { x: 6, y: 26, w: w - 12, h: h - 32 };
    }
    function frame(target, win) {
      const g = 4, a = area, hw = (a.w - g) / 2, hh = (a.h - g) / 2;
      switch (target) {
        case "left": return { x: a.x, y: a.y, w: hw, h: a.h };
        case "right": return { x: a.x + hw + g, y: a.y, w: hw, h: a.h };
        case "tl": return { x: a.x, y: a.y, w: hw, h: hh };
        case "tr": return { x: a.x + hw + g, y: a.y, w: hw, h: hh };
        case "full": return { ...a };
        default: {
          const w = a.w * 0.55, h = a.h * 0.66;
          return win === "browser"
            ? { x: a.x + a.w * 0.08, y: a.y + a.h * 0.08, w, h }
            : { x: a.x + a.w - w - a.w * 0.06, y: a.y + a.h * 0.26, w, h };
        }
      }
    }
    function paint(win) {
      const s = win.s, t = win.laid;
      const x = s.x.x, y = s.y.x, w = Math.max(20, s.w.x), h = Math.max(20, s.h.x);
      win.content.style.transform = `translate(${x}px, ${y}px)`;
      win.content.style.clipPath = `inset(0px ${Math.max(0, t.w - w)}px ${Math.max(0, t.h - h)}px 0px round 7px)`;
      win.skin.style.transform = `translate(${x}px, ${y}px) scale(${w / t.w}, ${h / t.h})`;
    }
    function place(name, target, animate) {
      const win = W[name];
      const r = frame(target, name);
      win.target = target;
      win.laid = r;
      win.skin.style.width = r.w + "px";
      win.skin.style.height = r.h + "px";
      win.content.style.width = r.w + "px";
      win.content.style.height = r.h + "px";
      const s = win.s;
      if (!animate || still.matches) {
        s.x.jump(r.x); s.y.jump(r.y); s.w.jump(r.w); s.h.jump(r.h);
        paint(win);
        return;
      }
      s.x.to(r.x); s.y.to(r.y); s.w.to(r.w); s.h.to(r.h);
      run({ springs: [s.x, s.y, s.w, s.h], render: () => paint(win) });
    }
    function setFront(name) {
      front = name;
      Object.entries(W).forEach(([n, w]) => {
        w.el.classList.toggle("front", n === name);
        w.el.style.zIndex = n === name ? 2 : 1;
      });
    }
    function perform(n, animate = true) {
      const [name, target] = MOVES[n];
      setFront(name);
      place(name, target, animate);
      snaps.forEach((b, i) => b.classList.toggle("on", i === n));
    }
    function reset(animate) {
      place("browser", null, animate);
      place("notes", null, animate);
      snaps.forEach((b) => b.classList.remove("on"));
    }
    function tick() {
      clearTimeout(cycle);
      if (!inView || still.matches) return;
      const wait = pausedUntil - Date.now();
      if (wait > 0) { cycle = setTimeout(tick, wait); return; }
      if (document.hidden) { cycle = setTimeout(tick, 1000); return; }
      if (step < MOVES.length) { perform(step++); cycle = setTimeout(tick, 1500); }
      else { reset(true); step = 0; cycle = setTimeout(tick, 1100); }
    }
    function user(n) {
      pausedUntil = Date.now() + 6000;
      step = (n + 1) % MOVES.length;
      perform(n);
      tick();
    }

    measure();
    if (still.matches) { perform(0, false); perform(1, false); }
    else { reset(false); setFront("notes"); }
    snaps.forEach((b, n) => b.addEventListener("click", () => user(n)));
    addEventListener("keydown", (e) => {
      if (!inView || !e.ctrlKey || !e.altKey || typing(e.target)) return;
      const n = { ArrowLeft: 0, ArrowRight: 1, KeyU: 2, KeyI: 3, KeyF: 4 }[e.code];
      if (n !== undefined) user(n);
    });
    addEventListener("resize", () => {
      measure();
      Object.entries(W).forEach(([n, w]) => place(n, w.target, false));
    });
    watch(desk, () => { if (!inView) { inView = true; cycle = setTimeout(tick, 700); } }, () => { inView = false; clearTimeout(cycle); }, 0.4);
  })();

  // ─── stash ───

  (() => {
    const stage = $(".js-stash");
    if (!stage) return;
    const fit = stage.parentNode;
    const file = $(".js-file", stage);
    const cursor = $(".js-cursor", stage);
    const count = $(".js-shelf-n", stage);
    const status = $(".js-stash-status");
    const HOME = { x: 86, y: 154 }, PARK = { x: 426, y: 212 };
    const SHELF = { x: 370, y: 112, w: 264, h: 178 };
    let narrow = null;
    const f = { x: new Spring(HOME.x), y: new Spring(HOME.y), s: new Spring(1), r: new Spring(0) };
    const c = { x: new Spring(170), y: new Spring(250) };
    let scale = 1, parked = false, drag = null, interacted = false, demoed = false, timers = [];

    const paint = () => { file.style.transform = `translate(${f.x.x}px, ${f.y.x}px) rotate(${f.r.x}deg) scale(${f.s.x})`; };
    const paintCursor = () => { cursor.style.transform = `translate(${c.x.x}px, ${c.y.x}px)`; };
    const go = (props) => run({ springs: Object.values(f), render: paint, ...props });
    function fitStage() {
      const n = fit.clientWidth < 600;
      if (n !== narrow) {
        narrow = n;
        stage.classList.toggle("narrow", n);
        const shelfX = n ? 268 : 380;
        PARK.x = shelfX + 46;
        SHELF.x = shelfX - 10;
        if (parked) { f.x.jump(PARK.x); paint(); }
      }
      scale = Math.min(1, fit.clientWidth / (narrow ? 520 : 640));
      fit.style.setProperty("--s", scale);
    }
    function shelfUp(on) { stage.classList.toggle("shelf-up", on); }
    function over(x, y) { return x > SHELF.x && x < SHELF.x + SHELF.w && y > SHELF.y && y < SHELF.y + SHELF.h; }
    function local(e) {
      const r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    }
    function settle(toShelf, vx = 0, vy = 0) {
      parked = toShelf;
      stage.classList.remove("hot");
      file.classList.remove("lifted");
      file.classList.toggle("parked", toShelf);
      stage.classList.toggle("away", toShelf);
      count.textContent = toShelf ? "1" : "0";
      const dest = toShelf ? PARK : HOME;
      if (still.matches) {
        f.x.jump(dest.x); f.y.jump(dest.y); f.s.jump(toShelf ? 0.62 : 1); f.r.jump(0); paint();
      } else {
        const [resp, damp] = toShelf ? [0.42, 0.55] : [0.45, 0.85];
        Object.values(f).forEach((s) => s.tune(resp, damp));
        f.x.to(dest.x, vx); f.y.to(dest.y, vy); f.s.to(toShelf ? 0.62 : 1); f.r.to(0);
        go({});
      }
      if (!toShelf) setTimeout(() => { if (!parked && !drag) shelfUp(false); }, 260);
      file.setAttribute("aria-label", toShelf ? "Moodboard.jpg, parked on the shelf. Drag it out, or press to put it back." : "Moodboard.jpg. Drag it onto the shelf, or press to park it there.");
    }
    function say(t) { status.textContent = t; }
    function cancelDemo() { timers.forEach(clearTimeout); timers = []; cursor.classList.remove("on"); }

    file.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      interacted = true;
      cancelDemo();
      const p = local(e);
      drag = { dx: p.x - f.x.x, dy: p.y - f.y.x, moved: false, start: p, hist: [{ ...p, t: e.timeStamp }] };
      file.setPointerCapture(e.pointerId);
      file.classList.add("dragging");
    });
    file.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = local(e);
      if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        file.classList.add("lifted");
        shelfUp(true);
        Object.values(f).forEach((s) => s.tune(0.3, 0.75));
        f.s.to(1.08);
      }
      drag.hist.push({ ...p, t: e.timeStamp });
      if (drag.hist.length > 5) drag.hist.shift();
      const h = drag.hist, a = h[0], b = h[h.length - 1], dt = Math.max(1, b.t - a.t) / 1000;
      f.x.jump(p.x - drag.dx); f.y.jump(p.y - drag.dy);
      f.r.to(Math.max(-12, Math.min(12, ((b.x - a.x) / dt) * 0.012)) - 3);
      stage.classList.toggle("hot", over(f.x.x, f.y.x));
      paint();
      go({});
    });
    const end = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      file.classList.remove("dragging");
      if (!d.moved) return;
      const h = d.hist, a = h[0], b = h[h.length - 1], dt = Math.max(1, b.t - a.t) / 1000;
      const fresh = e.timeStamp - b.t < 80;
      const vx = fresh ? (b.x - a.x) / dt : 0, vy = fresh ? (b.y - a.y) / dt : 0;
      const hit = over(f.x.x, f.y.x);
      settle(hit, vx, vy);
      say(hit ? "Parked. Switch apps, then drag it out where it belongs." : "Back in Downloads. Drag it onto the shelf.");
      file.dataset.dragged = "1";
      setTimeout(() => delete file.dataset.dragged, 0);
    };
    file.addEventListener("pointerup", end);
    file.addEventListener("pointercancel", end);
    file.addEventListener("click", () => {
      if (file.dataset.dragged) return;
      interacted = true;
      cancelDemo();
      if (parked) { settle(false); say("Back in Downloads."); return; }
      shelfUp(true);
      Object.values(f).forEach((s) => s.tune(0.45, 0.85));
      f.s.to(1.08);
      go({});
      timers.push(setTimeout(() => { settle(true); say("Parked. Switch apps, then drag it out where it belongs."); }, still.matches ? 0 : 220));
    });

    function demo() {
      if (demoed || interacted || still.matches) return;
      demoed = true;
      const at = (ms, fn) => timers.push(setTimeout(fn, ms));
      const move = (x, y, resp = 0.5) => { c.x.tune(resp, 0.9).to(x); c.y.tune(resp, 0.9).to(y); run({ springs: [c.x, c.y], render: paintCursor }); };
      c.x.jump(190); c.y.jump(250); paintCursor();
      cursor.classList.add("on");
      say("Watch: grab, drag, drop.");
      move(HOME.x + 14, HOME.y + 8);
      at(650, () => {
        file.classList.add("lifted");
        Object.values(f).forEach((s) => s.tune(0.3, 0.75));
        f.s.to(1.08); go({});
        shelfUp(true);
      });
      at(1000, () => {
        Object.values(f).forEach((s) => s.tune(0.6, 0.85));
        const mid = (HOME.x + PARK.x) / 2 + 40;
        f.x.to(mid); f.y.to(74); f.r.to(-7); go({});
        move(mid + 14, 82, 0.6);
      });
      at(1550, () => {
        Object.values(f).forEach((s) => s.tune(0.45, 0.8));
        f.x.to(PARK.x + 4); f.y.to(150); f.r.to(4); go({});
        move(PARK.x + 18, 158, 0.45);
        stage.classList.add("hot");
      });
      at(2450, () => {
        settle(true);
        move(PARK.x + 54, 196, 0.5);
      });
      at(3300, () => {
        cursor.classList.remove("on");
        say("Your turn. Drag it back out, then onto the shelf again.");
      });
    }

    fitStage();
    paint();
    addEventListener("resize", fitStage);
    watch(stage, () => { timers.push(setTimeout(demo, 1100)); }, () => { if (!interacted && !demoed) cancelDemo(); }, 0.55);
  })();

  // ─── permission ───

  (() => {
    const sw = $(".js-perm");
    if (!sw) return;
    const row = sw.closest(".ax-row");
    const pill = $(".js-perm-status");
    const title = $(".js-perm-title");
    const burst = $(".js-burst");
    sw.addEventListener("click", () => {
      const on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      row.classList.toggle("granted", on);
      pill.classList.toggle("ok", on);
      $("span", pill).textContent = on ? "Accessibility granted" : "Not granted yet";
      pill.querySelector("svg").innerHTML = on
        ? '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="m7.8 12.3 2.9 2.9 5.6-5.9" stroke="#0b1a10"/>'
        : '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3.4"/>';
      title.textContent = on ? "You're in" : "One permission";
      if (on && !still.matches && burst.animate) sparkle();
    });
    function sparkle() {
      const accent = getComputedStyle(root).getPropertyValue("--pal-accent").trim() || "#9D4EDD";
      for (let i = 0; i < 26; i++) {
        const dot = document.createElement("span");
        const size = i % 3 === 0 ? 5 : 3;
        const angle = (i * 2.399963) % (Math.PI * 2);
        const reach = 70 * (0.45 + 0.55 * (((i * 37) % 11) / 10));
        const x = Math.cos(angle) * reach, y = Math.sin(angle) * reach;
        dot.style.cssText = `width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;background:${i % 4 === 0 ? "#fff" : i % 2 ? "#2ECC71" : accent}`;
        burst.appendChild(dot);
        dot.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${x * 0.8}px, ${y * 0.8 + 4}px) scale(0.8)`, opacity: 0.9, offset: 0.55 },
          { transform: `translate(${x}px, ${y + 22}px) scale(0.4)`, opacity: 0 }
        ], { duration: 1200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).onfinish = () => dot.remove();
      }
    }
  })();
})();
