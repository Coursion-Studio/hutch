(() => {
  "use strict";

  const DMG_URL = "https://github.com/Coursion-Studio/hutch/releases/latest/download/Hutch.dmg";
  const root = document.documentElement;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const typing = (el) => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

  clearTimeout(window.__rv);
  $$("[data-download]").forEach((a) => { a.href = DMG_URL; });

  function watch(el, enter, leave, threshold = 0.35) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? enter() : leave && leave()));
    }, { threshold }).observe(el);
  }

  $$(".reveal").forEach((el) => {
    if (el.classList.contains("stage-hero")) {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
      watch(el, () => el.classList.add("live"), () => el.classList.remove("live"), 0);
      return;
    }
    watch(el, () => el.classList.add("in"), null, 0.12);
  });
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

  const look = { theme: THEMES[2], mat: "glass" };
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
  const A = (name, glyph, a, b, fg = "#fff") => ({ name, glyph, bg: `linear-gradient(${a}, ${b})`, fg });
  const APPS = [
    A("Safari", "compass", "#46B2FF", "#1A6FE0"),
    A("Safari Technology Preview", "compass", "#9B6BFF", "#5B2BD1"),
    A("Mail", "mail", "#55C6FF", "#1677F2"),
    A("Messages", "bubble", "#64F383", "#1DBE3D"),
    A("Maps", "pin", "#72E38A", "#2D9CDB"),
    A("Music", "music", "#FF6A85", "#F5264D"),
    A("Notes", "notes", "#FFE66B", "#F6C21B", "#5C4600"),
    A("Calendar", "calendar", "#FFFFFF", "#E7E7EC", "#E8453C"),
    A("Reminders", "list", "#FFFFFF", "#E7E7EC", "#2F7CF6"),
    A("Photos", "photos", "#FFFFFF", "#E7E7EC", "#F28C28"),
    A("FaceTime", "camera", "#64F383", "#1DBE3D"),
    A("Finder", "finder", "#6BC4FF", "#2B7DE9"),
    A("Preview", "preview", "#70CDFF", "#2D86E6"),
    A("Podcasts", "podcast", "#D884FF", "#8D3BEB"),
    A("App Store", "store", "#45B8FF", "#1471F0"),
    A("System Settings", "gear", "#A8A8B0", "#6B6B74"),
    A("Terminal", "terminal", "#4D4D52", "#1E1E21"),
    A("Xcode", "hammer", "#55C6FF", "#1A6EE8"),
    A("Figma", "figma", "#2E2E31", "#19191B"),
    A("Slack", "hash", "#8A4597", "#4A154B")
  ];
  const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${G[name]}</svg>`;

  function rowEl(r) {
    const li = document.createElement("li");
    li.className = "pp-row";
    li.setAttribute("role", "option");
    const ico = document.createElement("span");
    ico.className = "pp-ico " + (r.app ? "app" : "sym");
    if (r.app) { ico.style.background = r.app.bg; ico.style.color = r.app.fg; }
    ico.innerHTML = svg(r.glyph);
    li.innerHTML = '<span class="pp-tx"><span class="pp-t"></span><span class="pp-s"></span></span><span class="pp-tr"></span>';
    li.prepend(ico);
    fill(li, r);
    return li;
  }
  function fill(li, r) {
    $(".pp-t", li).textContent = r.title;
    $(".pp-s", li).textContent = r.sub;
    $(".pp-tr", li).textContent = r.trailing || "";
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
    let at = -1, gaps = 0;
    for (const ch of q) {
      const next = n.indexOf(ch, at + 1);
      if (next < 0) return null;
      gaps += next - at - 1;
      at = next;
    }
    return 100 - gaps - n.length * 0.1;
  }

  function results(query, limit = 3) {
    const q = query.trim();
    if (!q) return [];
    const rows = [];
    const v = evaluate(q);
    if (v !== null) rows.push({ id: "calc", title: fmt(v), raw: String(parseFloat(v.toPrecision(12))), sub: `Maths · ${q}`, glyph: "calc", trailing: "Copy", kind: "calc" });
    const lq = q.toLowerCase();
    APPS.map((app) => ({ app, s: score(lq, app.name) }))
      .filter((m) => m.s !== null)
      .sort((a, b) => b.s - a.s || a.app.name.localeCompare(b.app.name))
      .slice(0, limit)
      .forEach(({ app }) => rows.push({ id: "app:" + app.name, title: app.name, sub: "Application", glyph: app.glyph, app, trailing: "Open", kind: "app" }));
    rows.push({ id: "web", title: `Search the web for "${q}"`, sub: "Routed through Browser Picker", glyph: "search", trailing: "Search", kind: "web" });
    return rows.slice(0, limit);
  }

  // ─── Try it ───

  (() => {
    const panel = $(".js-try");
    if (!panel) return;
    const input = $(".js-try-input", panel);
    const list = $(".js-try-results", panel);
    const box = $(".pp-results", panel);
    const status = $(".js-try-status", panel);
    const verb = $(".js-try-verb", panel);
    let rows = [], sel = 0, els = new Map(), statusTimer = 0, auto = 0, touched = false;

    function render() {
      rows = results(input.value);
      sel = Math.min(sel, Math.max(0, rows.length - 1));
      const next = new Map();
      rows.forEach((r, n) => {
        let li = els.get(r.id);
        if (li) fill(li, r);
        else {
          li = rowEl(r);
          li.id = "try-" + r.id.replace(/[^a-z0-9]/gi, "-");
          li.addEventListener("mousedown", (e) => { e.preventDefault(); });
          li.addEventListener("click", () => { sel = rows.findIndex((x) => x.id === r.id); mark(); activate(); });
          if (!still.matches) li.classList.add("enter");
        }
        next.set(r.id, li);
        list.appendChild(li);
      });
      els.forEach((li, id) => { if (!next.has(id)) li.remove(); });
      els = next;
      requestAnimationFrame(() => requestAnimationFrame(() => $$(".enter", list).forEach((li) => li.classList.remove("enter"))));
      box.classList.toggle("empty", !rows.length);
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
      verb.textContent = r ? r.trailing : "Open";
      if (r) input.setAttribute("aria-activedescendant", els.get(r.id).id); else input.removeAttribute("aria-activedescendant");
    }
    function say(text) {
      clearTimeout(statusTimer);
      status.textContent = text;
      status.classList.add("flash");
      statusTimer = setTimeout(() => { status.textContent = "Pounce"; status.classList.remove("flash"); }, 1800);
    }
    function activate() {
      const r = rows[sel];
      if (!r) return;
      if (r.kind === "calc") {
        if (navigator.clipboard) navigator.clipboard.writeText(r.raw).catch(() => {});
        say(`Copied ${r.title}`);
      } else if (r.kind === "app") say(`On your Mac, ${r.title} opens now`);
      else say("Hutch hands this to your browser");
    }
    function stopAuto() { clearTimeout(auto); auto = 0; }
    function typeIn(text, focus) {
      stopAuto();
      if (still.matches) { input.value = text; render(); if (focus) input.focus({ preventScroll: true }); return; }
      input.value = "";
      render();
      let n = 0;
      const step = () => {
        input.value = text.slice(0, ++n);
        render();
        if (n < text.length) auto = setTimeout(step, 70 + Math.random() * 60);
        else { auto = 0; if (focus) input.focus({ preventScroll: true }); }
      };
      auto = setTimeout(step, 120);
    }

    input.addEventListener("input", () => { touched = true; stopAuto(); sel = 0; render(); });
    input.addEventListener("focus", () => { touched = true; stopAuto(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!rows.length) return;
        sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
        mark();
      } else if (e.key === "Enter") { e.preventDefault(); activate(); }
      else if (e.key === "Escape") { input.value = ""; sel = 0; render(); }
    });
    $$(".chip-q").forEach((b) => b.addEventListener("click", () => { touched = true; sel = 0; typeIn(b.dataset.q, true); }));

    render();
    watch(panel, () => {
      if (touched || input.value) return;
      touched = true;
      if (still.matches) { input.value = "saf"; render(); return; }
      auto = setTimeout(() => typeIn("saf", false), 450);
    }, null, 0.6);
  })();

  // ─── Make it yours ───

  (() => {
    const panel = $(".js-theme-panel");
    const swatches = $(".js-swatches");
    const name = $(".js-swatch-name");
    if (!panel || !swatches) return;
    const ul = $(".js-theme-rows", panel);
    results("saf", 2).forEach((r, n) => {
      const li = rowEl(r);
      li.classList.add("stat");
      if (n === 0) li.classList.add("sel");
      ul.appendChild(li);
    });

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
      name.append(b, document.createTextNode(` · ${look.mat[0].toUpperCase() + look.mat.slice(1)}${look.theme.id === "eclipse" ? " — the default" : ""}`));
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
    check(mats, mats[0]);
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

  // ─── ⌘K ───

  (() => {
    const back = $(".js-palette");
    if (!back) return;
    const input = $(".js-palette-input", back);
    const list = $(".js-palette-results", back);
    const ITEMS = [
      { g: "Tools", mk: "○", t: "Pounce — the launcher", h: "Try it", go: "#try" },
      { g: "Tools", mk: "⌘", t: "The launcher hotkey", h: "Section", go: "#hotkey" },
      { g: "Tools", mk: "▥", t: "Window Manager", h: "Try it", go: "#windows" },
      { g: "Tools", mk: "▧", t: "Stash — the file shelf", h: "Try it", go: "#stash" },
      { g: "Tools", mk: "◑", t: "Toggles", h: "Tools", go: "#tools" },
      { g: "Tools", mk: "↗", t: "Browser Picker", h: "Tools", go: "#tools" },
      { g: "Tools", mk: "◆", t: "Reaper — resource review", h: "Tools", go: "#tools" },
      { g: "Go", mk: "◐", t: "Themes and materials", h: "Section", go: "#themes" },
      { g: "Go", mk: "→", t: "Why Hutch — one permission", h: "Section", go: "#why" },
      { g: "Go", mk: "$", t: "14 days of everything", h: "Section", go: "#pricing" },
      { g: "Go", mk: "↓", t: "Download free trial", h: "Download", act: "download" },
      { g: "Pages", mk: "$", t: "Pricing — $29 once", h: "Page", go: "pricing.html" },
      { g: "Pages", mk: "§", t: "Privacy Policy", h: "Page", go: "privacy.html" },
      { g: "Pages", mk: "§", t: "Terms of Service", h: "Page", go: "terms.html" },
      { g: "Pages", mk: "§", t: "Refunds", h: "Page", go: "refunds.html" },
      { g: "Pages", mk: "⚿", t: "Lost your licence key?", h: "Page", go: "licence.html" },
      { g: "Pages", mk: "@", t: "@kuraydev on X", h: "External", go: "https://x.com/kuraydev" }
    ];
    let shown = [], sel = 0, lastFocus = null;
    const hit = (q, text) => {
      const t = text.toLowerCase();
      let n = 0;
      for (const ch of q) { n = t.indexOf(ch, n); if (n < 0) return false; n++; }
      return true;
    };
    function draw() {
      const q = input.value.trim().toLowerCase();
      shown = ITEMS.filter((it) => hit(q, it.t + " " + it.g));
      sel = 0;
      list.innerHTML = "";
      if (!shown.length) {
        const e = document.createElement("li");
        e.className = "palette-empty";
        e.textContent = "Nothing here. Hutch itself would have searched your Mac.";
        list.appendChild(e);
        return;
      }
      let group = null;
      shown.forEach((it, n) => {
        if (it.g !== group) {
          group = it.g;
          const h = document.createElement("li");
          h.className = "group";
          h.textContent = group;
          list.appendChild(h);
        }
        const li = document.createElement("li");
        li.className = "item";
        li.setAttribute("role", "option");
        li.dataset.n = n;
        li.innerHTML = '<span class="mk"></span><span class="lb"></span><span class="hint"></span>';
        $(".mk", li).textContent = it.mk;
        $(".lb", li).textContent = it.t;
        $(".hint", li).textContent = it.h;
        li.addEventListener("mousemove", () => { sel = n; mark(); });
        li.addEventListener("click", () => { sel = n; go(); });
        list.appendChild(li);
      });
      mark();
    }
    function mark() {
      $$(".item", list).forEach((n) => {
        const on = +n.dataset.n === sel;
        n.setAttribute("aria-selected", on ? "true" : "false");
        if (on) n.scrollIntoView({ block: "nearest" });
      });
    }
    function go() {
      const it = shown[sel];
      if (!it) return;
      close();
      if (it.act === "download") { location.href = DMG_URL; return; }
      if (/^https?:/.test(it.go)) { open(it.go, "_blank", "noopener"); return; }
      if (it.go[0] === "#") { const t = $(it.go); if (t) t.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" }); return; }
      location.href = it.go;
    }
    function openPalette() {
      lastFocus = document.activeElement;
      back.hidden = false;
      requestAnimationFrame(() => back.classList.add("on"));
      input.value = "";
      draw();
      input.focus();
    }
    function close() {
      back.classList.remove("on");
      setTimeout(() => { back.hidden = true; }, 170);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    $$(".js-palette-open").forEach((b) => b.addEventListener("click", openPalette));
    input.addEventListener("input", draw);
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    addEventListener("keydown", (e) => {
      const isOpen = !back.hidden;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isOpen ? close() : openPalette(); return; }
      if (!isOpen && e.key === "/" && !typing(document.activeElement)) { e.preventDefault(); openPalette(); return; }
      if (!isOpen) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); go(); }
    });
  })();
})();
