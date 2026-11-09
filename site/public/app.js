// DENONOMODZ: theme switch, copy buttons, install tabs, mod filters. No dependencies.
(() => {
  const themes = ["grey", "amber", "ice"];
  const names = { grey: "mono-grey", amber: "mono-amber", ice: "mono-ice" };
  const root = document.documentElement;
  const chip = document.querySelector("[data-theme-toggle]");
  const show = (t) => {
    root.dataset.theme = t;
    if (chip) chip.textContent = `theme: ${names[t]} ▾`;
  };
  let current = root.dataset.theme || "grey";
  show(current);
  chip?.addEventListener("click", () => {
    current = themes[(themes.indexOf(current) + 1) % themes.length];
    show(current);
    try { localStorage.setItem("denonomodz-theme", current); } catch {}
  });

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const label = btn.textContent;
      btn.classList.add("done");
      btn.textContent = "✓";
      setTimeout(() => { btn.classList.remove("done"); btn.textContent = label; }, 1400);
    } catch {}
  });

  document.querySelectorAll("[role=tablist]").forEach((list) => {
    const tabs = [...list.querySelectorAll("[role=tab]")];
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    }));
  });

  const filters = document.querySelector("[data-filters]");
  filters?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
    const f = btn.dataset.filter;
    document.querySelectorAll(".grid [data-category]").forEach((card) => {
      card.hidden = f !== "all" && card.dataset.category !== f;
    });
  });
})();

// Category links (/#omarchy, /#herdr, …) open the mod grid with that filter on.
(() => {
  const apply = () => {
    const cat = location.hash.slice(1);
    const btn = document.querySelector(`[data-filters] button[data-filter="${CSS.escape(cat)}"]`);
    if (!btn) return;
    btn.click();
    document.getElementById("mods")?.scrollIntoView();
  };
  window.addEventListener("hashchange", apply);
  if (document.readyState !== "loading") apply(); else document.addEventListener("DOMContentLoaded", apply);
})();
