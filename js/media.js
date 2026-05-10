// Renders the Media Representation page from data/media.json
(function () {
  const LANG_KEY = "providence-resources-lang";
  const SUPPORTED = ["en", "es", "pt", "ht", "zh"];

  const state = {
    lang: localStorage.getItem(LANG_KEY) || (SUPPORTED.includes((navigator.language || "en").slice(0, 2)) ? navigator.language.slice(0, 2) : "en"),
    categories: [],
  };

  function t(key) {
    const dict = window.TRANSLATIONS[state.lang] || window.TRANSLATIONS.en;
    return dict[key] ?? window.TRANSLATIONS.en[key] ?? key;
  }
  function loc(field) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[state.lang] ?? field.en ?? "";
  }
  function escape(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[s]));
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    document.title = t("mediaPageTitle") + " — " + t("siteTitle");
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll(".lang-switch button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });
  }

  function renderCategories() {
    const wrap = document.getElementById("media-content");
    wrap.innerHTML = state.categories.map(cat => `
      <section class="media-category" id="${cat.id}">
        <header class="media-category__head">
          <span class="media-category__icon" aria-hidden="true">${cat.icon || "🎬"}</span>
          <h2>${escape(loc(cat.label))}</h2>
        </header>
        <div class="media-grid">
          ${cat.films.map(film => renderFilm(film, cat.id)).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderFilm(film, categoryId) {
    const themes = (loc(film.themes) || []).map(t => `<span class="film-theme">${escape(t)}</span>`).join("");
    const injusticeBlock = film.injustice ? `
      <div class="film-injustice">
        <h4 data-i18n="mediaInjusticeHeading">Systemic injustice highlighted</h4>
        <p>${escape(loc(film.injustice))}</p>
      </div>
    ` : "";
    return `
      <article class="film-card" data-category="${categoryId}">
        <header class="film-card__head">
          <h3 class="film-title">${escape(film.title)}</h3>
          <span class="film-meta">${escape(film.year || "")}${film.ageHint ? " · " + escape(film.ageHint) : ""}</span>
        </header>
        <p class="film-summary">${escape(loc(film.summary))}</p>
        ${injusticeBlock}
        ${themes ? `<div class="film-themes">${themes}</div>` : ""}
      </article>
    `;
  }

  function renderTOC() {
    const toc = document.getElementById("media-toc");
    toc.innerHTML = state.categories.map(cat => `
      <a class="toc-link" href="#${cat.id}">
        <span class="toc-icon">${cat.icon || "🎬"}</span>
        ${escape(loc(cat.label))}
      </a>
    `).join("");
  }

  function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    state.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations();
    renderTOC();
    renderCategories();
    // Re-apply translations to elements rendered above (i18n inside film cards)
    applyTranslations();
  }

  async function init() {
    document.querySelectorAll(".lang-switch button").forEach(btn => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
    });

    try {
      const res = await fetch("../data/media.json", { cache: "no-cache" });
      const data = await res.json();
      state.categories = data.categories || [];
      const updated = document.getElementById("last-updated");
      if (updated && data.lastUpdated) updated.textContent = data.lastUpdated;
    } catch (err) {
      console.error("Could not load media.json", err);
      document.getElementById("media-content").innerHTML =
        "<p>Could not load media data. Please refresh the page.</p>";
      return;
    }

    applyTranslations();
    renderTOC();
    renderCategories();
    applyTranslations();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
