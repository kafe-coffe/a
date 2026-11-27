// ---------- Загрузка содержимого из папки content/ ----------
// Тексты и фото редактируются в админке (/admin) и хранятся в content/*.json.

const $ = id => document.getElementById(id);

// Путь к фото: убираем ведущий "/", чтобы работало и на корне домена, и в подпапке
const imgSrc = p => String(p || "").trim().replace(/^\/+/, "");

function setText(el, value) {
  if (el && typeof value === "string" && value.trim() !== "") el.textContent = value;
}

async function load(name) {
  try {
    const r = await fetch(`content/${name}.json`, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    return null; // файл не загрузился — остаётся запасной текст из index.html
  }
}

// --- Меню (с фильтрами по разделам) ---
let menuData = null;

function renderMenu(activeIndex = -1) {
  const list = $("menuList");
  list.replaceChildren();
  if (!menuData) return;
  const currency = menuData.currency || "";
  const cats = menuData.categories || [];
  cats.forEach((cat, ci) => {
    if (activeIndex !== -1 && activeIndex !== ci) return;
    (cat.items || []).forEach(item => {
      const li = document.createElement("li");

      const src = imgSrc(item.image);
      if (src) {
        const img = document.createElement("img");
        img.className = "thumb";
        img.src = src;
        img.alt = item.name || "";
        img.loading = "lazy";
        li.appendChild(img);
      }

      const info = document.createElement("div");
      info.className = "info";
      const strong = document.createElement("strong");
      strong.textContent = item.name || "";
      const small = document.createElement("small");
      small.textContent = item.desc || "";
      info.append(strong, small);
      li.appendChild(info);

      if (item.price !== undefined && item.price !== null && item.price !== "") {
        const price = document.createElement("span");
        price.className = "price";
        price.textContent = `${item.price} ${currency}`.trim();
        li.appendChild(price);
      }
      list.appendChild(li);
    });
  });
}

function renderFilters() {
  const box = $("filters");
  box.replaceChildren();
  const cats = menuData.categories || [];
  if (cats.length < 2) return; // один раздел — фильтры не нужны
  const make = (label, index) => {
    const b = document.createElement("button");
    b.className = "chip" + (index === -1 ? " active" : "");
    b.textContent = label;
    b.dataset.index = index;
    return b;
  };
  box.appendChild(make(menuData.allLabel || "Все", -1));
  cats.forEach((c, i) => box.appendChild(make(c.label || "", i)));
}

$("filters").addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  $("filters").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  renderMenu(Number(btn.dataset.index));
});

// --- Применение данных к странице ---
function applyGeneral(d) {
  if (!d) return;
  if (d.title) document.title = d.title;
  if (d.description) {
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute("content", d.description);
  }
  document.querySelectorAll("[data-t]").forEach(el => setText(el, d[el.dataset.t]));
  setText($("footerText"), d.footer);
}

function applyHome(d) {
  if (!d) return;
  setText($("heroTitle"), d.title); // переносы строк показывает CSS (white-space: pre-line)
  setText($("heroText"), d.text);
  setText($("heroBtn"), d.button);
  const src = imgSrc(d.image);
  const hero = $("hero");
  if (src) {
    hero.style.setProperty("--hero-img", `url("${encodeURI(src)}")`);
    hero.classList.add("has-photo");
  }
}

function applyAbout(d) {
  if (!d) return;
  setText($("aboutTitle"), d.title);
  if (!Array.isArray(d.cards)) return;
  const box = $("cards");
  box.replaceChildren();
  d.cards.forEach(c => {
    const card = document.createElement("article");
    card.className = "card";
    const src = imgSrc(c.image);
    if (src) {
      card.classList.add("has-photo");
      const img = document.createElement("img");
      img.className = "card-photo";
      img.src = src;
      img.alt = c.title || "";
      img.loading = "lazy";
      card.appendChild(img);
    } else if (c.icon) {
      const s = document.createElement("span");
      s.textContent = c.icon;
      card.appendChild(s);
    }
    const h = document.createElement("h3");
    h.textContent = c.title || "";
    const p = document.createElement("p");
    p.textContent = c.text || "";
    card.append(h, p);
    box.appendChild(card);
  });
}

function applyMenu(d) {
  if (!d) {
    $("menuList").replaceChildren();
    const li = document.createElement("li");
    li.textContent = "Меню временно недоступно.";
    $("menuList").appendChild(li);
    return;
  }
  menuData = d;
  setText($("menuTitle"), d.title);
  renderFilters();
  renderMenu();
}

// --- Торты: выбор кнопки меняет фото сверху ---
function applyCakes(d) {
  if (!d || !Array.isArray(d.items) || d.items.length === 0) return;
  $("cakes").hidden = false;
  $("navCakes").hidden = false;
  setText($("cakesTitle"), d.title);

  const img = $("cakeImg"), ph = $("cakePh"), tabs = $("cakeTabs");
  tabs.replaceChildren();

  function show(i) {
    const item = d.items[i];
    tabs.querySelectorAll(".chip").forEach((b, k) => {
      b.classList.toggle("active", k === i);
      b.setAttribute("aria-selected", k === i ? "true" : "false");
    });
    const src = imgSrc(item.image);
    if (!src) { img.hidden = true; ph.hidden = false; return; }
    ph.hidden = true;
    img.classList.add("fade");
    const next = new Image();
    next.onload = next.onerror = () => {
      img.src = src;
      img.alt = item.label || "";
      img.hidden = false;
      requestAnimationFrame(() => img.classList.remove("fade"));
    };
    next.src = src;
  }

  d.items.forEach((item, i) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.textContent = item.label || "";
    b.addEventListener("click", () => show(i));
    tabs.appendChild(b);
    const src = imgSrc(item.image);
    if (src) new Image().src = src; // подгружаем заранее, чтобы переключение было мгновенным
  });
  show(0);
}

let contactData = null;
function applyContact(d) {
  if (!d) return;
  contactData = d;
  setText($("contactTitle"), d.title);
  setText($("contactText"), d.text);
  setText($("formBtn"), d.button);
}

Promise.all(["general", "home", "about", "menu", "cakes", "contact"].map(load)).then(
  ([general, home, about, menu, cakes, contact]) => {
    applyGeneral(general);
    applyHome(home);
    applyAbout(about);
    applyMenu(menu);
    applyCakes(cakes);
    applyContact(contact);
    reveal();
  }
);

// Показываем страницу, когда содержимое подставлено (но не дольше 2,5 с)
function reveal() { document.documentElement.classList.remove("pending"); }
setTimeout(reveal, 2500);

// ---------- Остальное поведение сайта ----------

// Мобильное меню
const nav = $("nav");
$("burger").addEventListener("click", () => nav.classList.toggle("open"));
nav.addEventListener("click", e => { if (e.target.tagName === "A") nav.classList.remove("open"); });

// Тёмная тема (запоминаем выбор)
const themeBtn = $("theme");
function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeBtn.textContent = dark ? "☀️" : "🌙";
}
let saved = null;
try { saved = localStorage.getItem("dark"); } catch (e) {}
applyTheme(saved === "1");
themeBtn.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  applyTheme(dark);
  try { localStorage.setItem("dark", dark ? "1" : "0"); } catch (e) {}
});

// Форма (без сервера — только проверка и сообщение)
const form = $("form");
const status = $("status");
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = $("name").value.trim();
  const email = $("email").value.trim();
  const msg = $("msg").value.trim();
  status.className = "status";
  if (!name || !msg || !/^\S+@\S+\.\S+$/.test(email)) {
    status.textContent = "Заполните все поля и проверьте email.";
    status.classList.add("err");
    return;
  }
  const tpl = (contactData && contactData.success) || "Спасибо, {name}! Сообщение «отправлено» (это учебная форма).";
  status.textContent = tpl.replace("{name}", name);
  status.classList.add("ok");
  form.reset();
});

// Год в футере
$("year").textContent = new Date().getFullYear();
