(() => {
  "use strict";

  const DMG_URL = "https://github.com/Coursion-Studio/hutch/releases/latest/download/Hutch.dmg";
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
    if (el.classList.contains("stage-hero") || el.classList.contains("page-stage")) {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
      watch(el, () => el.classList.add("live"), () => el.classList.remove("live"), 0);
      return;
    }
    watch(el, () => el.classList.add("in"), null, 0.12);
  });
  $$(".js-live").forEach((el) => watch(el, () => el.classList.add("live"), () => el.classList.remove("live"), 0.2));

  const PALETTE = `
    <div class="palette" role="dialog" aria-modal="true" aria-label="Search this site">
      <div class="palette-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>
        <input class="js-palette-input" type="text" placeholder="Jump to anything…" aria-label="Search this site" autocomplete="off" spellcheck="false" />
        <kbd>esc</kbd>
      </div>
      <ul class="palette-results js-palette-results" role="listbox"></ul>
      <div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd>Navigate</span><span><kbd>↩</kbd>Open</span><span class="spacer"></span><span>Yes — the website has one too.</span></div>
    </div>`;

  (() => {
    if (!$(".js-palette-open")) return;
    let back = $(".js-palette");
    if (!back) {
      back = document.createElement("div");
      back.className = "palette-backdrop js-palette";
      back.hidden = true;
      back.innerHTML = PALETTE;
      document.body.prepend(back);
    }
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
      if (it.go[0] === "#") {
        const t = $(it.go);
        if (t) t.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" });
        else location.href = "index.html" + it.go;
        return;
      }
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
    addEventListener("DOMContentLoaded", () => addEventListener("keydown", (e) => {
      const isOpen = !back.hidden;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isOpen ? close() : openPalette(); return; }
      if (!isOpen && e.key === "/" && !typing(document.activeElement)) { e.preventDefault(); openPalette(); return; }
      if (!isOpen) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); go(); }
    }));
  })();
})();
