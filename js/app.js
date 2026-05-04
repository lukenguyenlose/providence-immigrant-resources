// Providence Immigrant Resources — main app script
// Loads resources.json, renders the Leaflet map, sidebar list, and filters.

const CATEGORY_COLORS = {
  food:       "#d97706",
  housing:    "#2563eb",
  legal:      "#7c3aed",
  health:     "#dc2626",
  education:  "#059669",
  employment: "#0891b2",
};

const LANG_KEY = "providence-resources-lang";
const SUPPORTED_LANGS = ["en", "es", "pt", "ht"];

const state = {
  resources: [],
  filtered: [],
  category: "all",
  query: "",
  lang: localStorage.getItem(LANG_KEY) || (SUPPORTED_LANGS.includes(navigator.language?.slice(0, 2)) ? navigator.language.slice(0, 2) : "en"),
  markers: {},
  map: null,
};

// --- i18n ---------------------------------------------------------------
function t(key) {
  const dict = window.TRANSLATIONS[state.lang] || window.TRANSLATIONS.en;
  return dict[key] ?? window.TRANSLATIONS.en[key] ?? key;
}

function applyTranslations() {
  document.documentElement.lang = state.lang;
  document.title = t("siteTitle");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  state.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations();
  if (document.getElementById("filters")) buildFilters();
  renderList();
}

// --- Map ----------------------------------------------------------------
function buildMap() {
  state.map = L.map("map", { scrollWheelZoom: true }).setView([41.823, -71.418], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(state.map);
}

function makeMarker(resource) {
  const color = CATEGORY_COLORS[resource.category] || "#666";
  const icon = L.divIcon({
    className: "custom-pin",
    html: `<div style="background:${color};width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
  const marker = L.marker([resource.lat, resource.lng], { icon });
  marker.bindPopup(() => buildPopup(resource));
  return marker;
}

function buildPopup(r) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.address)}`;
  const langs = (r.languages || []).join(", ").toUpperCase();
  return `
    <div class="popup-content">
      <h3>${escape(r.name)}</h3>
      <p><span class="cat-pill" data-cat="${r.category}">${t(r.category)}</span></p>
      <p>${escape(r.address)}</p>
      ${r.phone ? `<p><strong>${t("phone")}:</strong> <a href="tel:${r.phone.replace(/[^+\d]/g,'')}">${escape(r.phone)}</a></p>` : ""}
      ${r.hours ? `<p><strong>${t("hours")}:</strong> ${escape(r.hours)}</p>` : ""}
      ${langs ? `<p><strong>${t("languagesSpoken")}:</strong> ${escape(langs)}</p>` : ""}
      ${r.notes ? `<p>${escape(r.notes)}</p>` : ""}
      <div class="popup-actions">
        ${r.website ? `<a href="${r.website}" target="_blank" rel="noopener">${t("visit")}</a>` : ""}
        <a class="secondary" href="${mapsUrl}" target="_blank" rel="noopener">${t("directions")}</a>
      </div>
    </div>`;
}

function escape(str) {
  return String(str ?? "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

// --- List ---------------------------------------------------------------
function renderList() {
  const list = document.getElementById("resource-list");
  const q = state.query.trim().toLowerCase();
  state.filtered = state.resources.filter(r => {
    const catOk = state.category === "all" || r.category === state.category;
    const text = `${r.name} ${r.address} ${r.notes || ""}`.toLowerCase();
    const qOk = !q || text.includes(q);
    return catOk && qOk;
  });

  // Sync map markers
  Object.values(state.markers).forEach(m => state.map.removeLayer(m));
  state.filtered.forEach(r => {
    state.markers[r.id].addTo(state.map);
  });

  if (state.filtered.length === 0) {
    list.innerHTML = `<p class="meta">${t("noResults")}</p>`;
    return;
  }

  list.innerHTML = state.filtered.map(r => `
    <article class="resource-card" data-cat="${r.category}" data-id="${r.id}" tabindex="0">
      <h3>${escape(r.name)}</h3>
      <div class="meta">
        <span class="cat-pill" data-cat="${r.category}">${t(r.category)}</span>
        ${escape(r.address)}
      </div>
    </article>
  `).join("");

  list.querySelectorAll(".resource-card").forEach(card => {
    const id = card.dataset.id;
    const focusResource = () => {
      const r = state.resources.find(x => x.id === id);
      if (!r) return;
      state.map.flyTo([r.lat, r.lng], 15, { duration: 0.6 });
      state.markers[id].openPopup();
    };
    card.addEventListener("click", focusResource);
    card.addEventListener("keypress", e => {
      if (e.key === "Enter") focusResource();
    });
  });
}

// --- Filters ------------------------------------------------------------
function buildFilters() {
  const cats = ["all", "food", "housing", "legal", "health", "education", "employment"];
  const wrap = document.getElementById("filters");
  wrap.innerHTML = cats.map(c => `
    <button class="filter-btn ${c === "all" ? "active" : ""}" data-cat="${c}" data-i18n="${c}">${t(c)}</button>
  `).join("");
  wrap.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.cat;
      wrap.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b === btn));
      renderList();
    });
  });
}

// --- Bootstrap ----------------------------------------------------------
async function init() {
  buildMap();
  buildFilters();

  // Language switcher
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  // Search box
  document.getElementById("search").addEventListener("input", e => {
    state.query = e.target.value;
    renderList();
  });

  // Load data
  try {
    const path = window.RESOURCES_PATH || "data/resources.json";
    const res = await fetch(path, { cache: "no-cache" });
    const data = await res.json();
    state.resources = data.resources || [];
    state.resources.forEach(r => {
      state.markers[r.id] = makeMarker(r);
    });
    const updatedEl = document.getElementById("last-updated");
    if (updatedEl && data.lastUpdated) updatedEl.textContent = data.lastUpdated;
  } catch (err) {
    console.error("Failed to load resources.json", err);
    document.getElementById("resource-list").innerHTML =
      "<p class='meta'>Could not load resources. Check that data/resources.json exists.</p>";
  }

  applyTranslations();
  renderList();
}

document.addEventListener("DOMContentLoaded", init);
