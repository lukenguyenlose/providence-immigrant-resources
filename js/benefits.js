// Renders the benefits guide cards from data/benefits.json
(function () {
  const LANG_KEY = "providence-resources-lang";
  const SUPPORTED = ["en", "es", "pt", "ht"];
  const ICONS = {
    food:   "🥗",
    health: "🩺",
    energy: "⚡",
    money:  "💵",
    house:  "🏠",
    phone:  "📞",
    id:     "🪪",
  };

  const state = {
    lang: localStorage.getItem(LANG_KEY) || (SUPPORTED.includes((navigator.language || "en").slice(0, 2)) ? navigator.language.slice(0, 2) : "en"),
    programs: [],
  };

  function t(key) {
    const dict = window.TRANSLATIONS[state.lang] || window.TRANSLATIONS.en;
    return dict[key] ?? window.TRANSLATIONS.en[key] ?? key;
  }
  function loc(field) {
    if (!field) return "";
    return field[state.lang] || field.en || "";
  }
  function escape(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[s]));
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    document.title = t("benefitsPageTitle") + " — " + t("siteTitle");
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll(".lang-switch button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });
  }

  function renderTOC() {
    const toc = document.getElementById("toc");
    toc.innerHTML = state.programs.map(p => `
      <a class="toc-link" href="#${p.id}">
        <span class="toc-icon">${ICONS[p.icon] || "•"}</span>
        ${escape(loc(p.name))}
      </a>
    `).join("");
  }

  function renderPrograms() {
    const wrap = document.getElementById("programs");
    wrap.innerHTML = state.programs.map(p => `
      <article class="program-card" id="${p.id}">
        <header class="program-card__head">
          <span class="program-icon" aria-hidden="true">${ICONS[p.icon] || "•"}</span>
          <h2>${escape(loc(p.name))}</h2>
        </header>

        <p class="program-summary">${escape(loc(p.summary))}</p>

        <div class="program-grid">
          <section>
            <h3 data-i18n="benefitsEligibility">Who qualifies</h3>
            <p>${escape(loc(p.eligibility))}</p>
          </section>
          <section>
            <h3 data-i18n="benefitsDocs">What to bring</h3>
            <p>${escape(loc(p.documents))}</p>
          </section>
          <section>
            <h3 data-i18n="benefitsApply">How to apply</h3>
            <p>${escape(loc(p.howToApply))}</p>
          </section>
          <section class="immigration-note">
            <h3 data-i18n="benefitsImmigration">Immigration & status</h3>
            <p>${escape(loc(p.immigrationNote))}</p>
          </section>
        </div>

        <div class="program-links">
          ${(p.links || []).map(l => `<a href="${escape(l.url)}" target="_blank" rel="noopener">${escape(l.label)} →</a>`).join("")}
        </div>
      </article>
    `).join("");
    // Re-apply translations to elements we just rendered (eligibility/docs/apply headings)
    applyTranslations();
  }

  function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    state.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations();
    renderTOC();
    renderPrograms();
  }

  async function init() {
    document.querySelectorAll(".lang-switch button").forEach(btn => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
    });

    try {
      const res = await fetch("../data/benefits.json", { cache: "no-cache" });
      const data = await res.json();
      state.programs = data.programs || [];
      const updated = document.getElementById("last-updated");
      if (updated && data.lastUpdated) updated.textContent = data.lastUpdated;
    } catch (err) {
      console.error("Could not load benefits.json", err);
      document.getElementById("programs").innerHTML =
        "<p>Could not load benefits data. Please refresh the page.</p>";
      return;
    }

    applyTranslations();
    renderTOC();
    renderPrograms();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
