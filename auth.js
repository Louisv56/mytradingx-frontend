// ── Config ────────────────────────────────────────────────────────────────────
const API = "https://trading-ai-7y8g.onrender.com";

const MODEL_INFO = {
  "gpt-4o-mini": { label: "MytAI Fast",   plans: ["free","premium","pro"] },
  "gpt-4o":      { label: "MytAI Pro",    plans: ["premium","pro"] },
  "gemini":      { label: "MytAI Vision", plans: ["premium","pro"] },
  "claude":      { label: "MytAI Expert", plans: ["pro"] }
};

const MODELS_BY_PLAN = {
  "free":    ["gpt-4o-mini"],
  "premium": ["gpt-4o-mini","gpt-4o","gemini"],
  "pro":     ["gpt-4o-mini","gpt-4o","gemini","claude"]
};

// ── Session ───────────────────────────────────────────────────────────────────
function getUser() {
  var s = localStorage.getItem("tradingUser");
  return s ? JSON.parse(s) : null;
}

function saveUser(user) {
  localStorage.setItem("tradingUser", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("tradingUser");
  window.location.href = "index.html";
}

function requireAuth() {
  if (!getUser()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function maskEmail(email) {
  if (!email) return "";
  var parts  = email.split("@");
  var name   = parts[0];
  var domain = parts[1];
  if (name.length <= 2) return name[0] + "***@" + domain;
  return name[0] + name[1] + "***" + name[name.length - 1] + "@" + domain;
}

function initNav() {
  var user    = getUser();
  var navLogin  = document.getElementById("navLogin");
  var navLogout = document.getElementById("navLogout");
  var navUser   = document.getElementById("navUser");
  var navPlan   = document.getElementById("navPlan");

  // Masquer les anciens éléments nav (rétrocompat)
  if (navUser)   navUser.classList.add("hidden");
  if (navPlan)   navPlan.classList.add("hidden");
  if (navLogout) navLogout.classList.add("hidden");

  // Active link
  var page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function(a) {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });

  if (user) {
    if (navLogin) navLogin.classList.add("hidden");
    injectProfileMenu(user, page);
  } else {
    if (navLogin) navLogin.classList.remove("hidden");
  }

  // Hamburger mobile
  injectHamburger(user, page);
}

// ── Profile dropdown ──────────────────────────────────────────────────────────
function injectProfileMenu(user, page) {
  var nav = document.querySelector("nav");
  if (!nav || document.getElementById("profileMenuBtn")) return;

  var q           = getQuota(user);
  var planLabels  = {free:"FREE", premium:"PREMIUM", pro:"PRO"};
  var planColors  = {free:"#64748b", premium:"#38bdf8", pro:"#a78bfa"};
  var planBg      = {free:"#1e2d45", premium:"#0369a122", pro:"#7c3aed22"};
  var planBorder  = {free:"#1e2d45", premium:"#0369a144", pro:"#7c3aed44"};
  var initial     = user.email ? user.email[0].toUpperCase() : "?";
  var planColor   = planColors[user.plan] || planColors.free;
  var pct         = user.plan === "pro" ? 30 : Math.min(100, (q.used / q.limit) * 100);
  var barColor    = pct >= 90 ? "#ef4444" : pct >= 60 ? "#f97316" : "#38bdf8";
  var quotaLabel  = user.plan === "pro"
    ? q.used + " analyses ce mois"
    : q.used + " / " + q.limit + " analyses utilisées";

  // Injecter les styles du dropdown
  if (!document.getElementById("profileMenuStyle")) {
    var style = document.createElement("style");
    style.id = "profileMenuStyle";
    style.textContent = `
      /* ── Bouton avatar ── */
      #profileMenuBtn {
        display: flex; align-items: center; gap: 8px;
        background: var(--card); border: 1px solid var(--border);
        border-radius: 30px; padding: 5px 12px 5px 5px;
        cursor: pointer; transition: all 0.2s;
        font-family: 'DM Sans', sans-serif;
        margin-left: 8px;
      }
      #profileMenuBtn:hover { border-color: var(--border2); background: var(--bg2); }
      #profileMenuBtn.open  { border-color: var(--accent); }

      .profile-avatar {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 0.78rem; flex-shrink: 0;
        color: #080c14;
      }
      .profile-avatar.av-free    { background: #64748b; }
      .profile-avatar.av-premium { background: #38bdf8; }
      .profile-avatar.av-pro     { background: linear-gradient(135deg,#7c3aed,#4f46e5); color: white; }

      .profile-btn-plan {
        font-size: 0.72rem; font-weight: 700;
        letter-spacing: 0.04em;
      }
      .profile-btn-chevron {
        font-size: 0.6rem; color: var(--muted);
        transition: transform 0.2s;
      }
      #profileMenuBtn.open .profile-btn-chevron { transform: rotate(180deg); }

      /* ── Dropdown ── */
      #profileDropdown {
        display: none;
        position: fixed;
        top: 72px; right: 16px;
        width: 300px;
        background: var(--card);
        border: 1px solid var(--border2);
        border-radius: var(--radius-lg);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
        z-index: 200;
        overflow: hidden;
        animation: profileDropIn 0.18s ease;
      }
      @keyframes profileDropIn {
        from { opacity: 0; transform: translateY(-8px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      #profileDropdown.open { display: block; }

      /* Header du dropdown */
      .pd-header {
        padding: 16px;
        background: linear-gradient(135deg, #0f1a2e, #0d1422);
        border-bottom: 1px solid var(--border);
      }
      .pd-email {
        font-size: 0.8rem; color: var(--muted2);
        margin-bottom: 10px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pd-plan-row {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 10px;
      }
      .pd-plan-badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 10px; border-radius: 20px;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
      }
      .pd-quota-label {
        font-size: 0.75rem; color: var(--muted); margin-bottom: 6px;
      }
      .pd-quota-bar {
        height: 4px; background: var(--border); border-radius: 3px; overflow: hidden;
      }
      .pd-quota-fill {
        height: 100%; border-radius: 3px; transition: width 0.4s;
      }
      .pd-quota-nums {
        display: flex; justify-content: space-between;
        font-size: 0.72rem; color: var(--muted); margin-top: 4px;
      }

      /* Sections du dropdown */
      .pd-section {
        padding: 6px 8px;
        border-bottom: 1px solid var(--border);
      }
      .pd-section:last-child { border-bottom: none; }
      .pd-section-label {
        font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em;
        color: var(--muted); padding: 6px 8px 2px;
      }
      .pd-item {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 8px; border-radius: 8px;
        color: var(--muted2); font-size: 0.875rem; font-weight: 500;
        cursor: pointer; transition: all 0.15s;
        text-decoration: none; width: 100%;
        background: none; border: none; font-family: 'DM Sans', sans-serif;
        text-align: left;
      }
      .pd-item:hover { background: var(--bg2); color: var(--text); }
      .pd-item:hover .pd-icon { opacity: 1; }
      .pd-icon { font-size: 1rem; opacity: 0.7; width: 20px; text-align: center; flex-shrink: 0; }
      .pd-item-sub { font-size: 0.72rem; color: var(--muted); display: block; margin-top: 1px; }
      .pd-item.danger { color: var(--danger); }
      .pd-item.danger:hover { background: #ef444410; color: var(--danger); }

      /* Upgrade banner dans dropdown */
      .pd-upgrade {
        margin: 6px 8px 8px;
        background: linear-gradient(135deg, #7c3aed18, #38bdf810);
        border: 1px solid #7c3aed33;
        border-radius: 10px;
        padding: 12px;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
      }
      .pd-upgrade-text { font-size: 0.8rem; color: var(--muted2); line-height: 1.4; }
      .pd-upgrade-text strong { color: #a78bfa; display: block; margin-bottom: 2px; font-size: 0.85rem; }
      .pd-upgrade-btn {
        background: linear-gradient(135deg,#7c3aed,#4f46e5);
        color: white; border: none; border-radius: 8px;
        padding: 7px 12px; font-size: 0.78rem; font-weight: 700;
        cursor: pointer; white-space: nowrap; flex-shrink: 0;
        font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;
      }
      .pd-upgrade-btn:hover { opacity: 0.85; }

      @media (max-width: 640px) {
        #profileMenuBtn .profile-btn-plan { display: none; }
        #profileMenuBtn .profile-btn-chevron { display: none; }
        #profileDropdown { right: 8px; left: 8px; width: auto; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Créer le bouton avatar ──
  var btn = document.createElement("button");
  btn.id        = "profileMenuBtn";
  btn.setAttribute("aria-label", "Menu profil");
  btn.innerHTML =
    '<div class="profile-avatar av-' + user.plan + '">' + initial + '</div>'
    + '<span class="profile-btn-plan" style="color:' + planColor + ';">' + (planLabels[user.plan] || "FREE") + '</span>'
    + '<span class="profile-btn-chevron">▼</span>';

  var navRight = document.querySelector(".nav-right");
  if (navRight) navRight.appendChild(btn);
  else nav.appendChild(btn);

  // ── Créer le dropdown ──
  var dropdown = document.createElement("div");
  dropdown.id = "profileDropdown";

  // Calcul de la barre de quota
  var quotaPct = user.plan === "pro"
    ? 20
    : Math.min(100, (q.used / q.limit) * 100);

  // Header
  var headerHtml =
    '<div class="pd-header">'
    + '<div class="pd-email">📧 ' + maskEmail(user.email) + '</div>'
    + '<div class="pd-plan-row">'
    +   '<span class="pd-plan-badge" style="background:' + planBg[user.plan] + ';color:' + planColor + ';border:1px solid ' + planBorder[user.plan] + ';">'
    +     (user.plan === "pro" ? "⭐ " : "") + (planLabels[user.plan] || "FREE")
    +   '</span>'
    +   '<span style="font-size:0.72rem;color:var(--muted);">Mon plan</span>'
    + '</div>'
    + '<div class="pd-quota-label">' + quotaLabel + '</div>'
    + '<div class="pd-quota-bar"><div class="pd-quota-fill" style="width:' + quotaPct + '%;background:' + barColor + ';"></div></div>'
    + '<div class="pd-quota-nums"><span>' + q.used + ' utilisées</span><span>' + (user.plan === "pro" ? "∞" : q.limit) + ' max</span></div>'
    + '</div>';

  // Navigation rapide
  var navHtml =
    '<div class="pd-section">'
    + '<div class="pd-section-label">Navigation</div>'
    + '<a href="analyse.html" class="pd-item"><span class="pd-icon">📊</span><span>Analyse graphique<span class="pd-item-sub">Analyser un screenshot</span></span></a>'
    + '<a href="historique.html" class="pd-item"><span class="pd-icon">📁</span><span>Historique<span class="pd-item-sub">Mes analyses passées</span></span></a>'
    + '<a href="fondamental.html" class="pd-item"><span class="pd-icon">📰</span><span>Analyse fondamentale<span class="pd-item-sub">Actualités du marché</span></span></a>'
    + '</div>';

  // Abonnement
  var subHtml = '<div class="pd-section"><div class="pd-section-label">Abonnement</div>';
  if (user.plan === "premium" || user.plan === "pro") {
    subHtml +=
      '<button class="pd-item danger" onclick="confirmCancelSub()">'
      + '<span class="pd-icon">🚫</span><span>Résilier l\'abonnement<span class="pd-item-sub">Actif jusqu\'à la fin de la période</span></span>'
      + '</button>';
  }
  subHtml +=
    '<a href="tarifs.html" class="pd-item"><span class="pd-icon">💰</span><span>Voir les tarifs<span class="pd-item-sub">Plans Free, Premium, Pro</span></span></a>'
    + '</div>';

  // Upgrade banner (si Free ou Premium)
  var upgradeBannerHtml = "";
  if (user.plan === "free") {
    upgradeBannerHtml =
      '<div class="pd-upgrade">'
      + '<div class="pd-upgrade-text"><strong>⚡ Passez Premium</strong>50 analyses/mois dès 9€</div>'
      + '<button class="pd-upgrade-btn" onclick="closeProfileDropdown(); if(typeof openUpgradeModal===\'function\') openUpgradeModal();">Voir →</button>'
      + '</div>';
  } else if (user.plan === "premium") {
    upgradeBannerHtml =
      '<div class="pd-upgrade">'
      + '<div class="pd-upgrade-text"><strong>✨ Passez Pro</strong>MytAI Expert + illimité</div>'
      + '<button class="pd-upgrade-btn" onclick="closeProfileDropdown(); if(typeof openUpgradeModal===\'function\') openUpgradeModal();">Voir →</button>'
      + '</div>';
  }

  // Déconnexion
  var logoutHtml =
    '<div class="pd-section">'
    + '<button class="pd-item danger" onclick="logout()"><span class="pd-icon">🚪</span>Déconnexion</button>'
    + '</div>';

  dropdown.innerHTML = headerHtml + navHtml + subHtml + upgradeBannerHtml + logoutHtml;
  document.body.appendChild(dropdown);

  // ── Toggle ──
  btn.addEventListener("click", function(e) {
    e.stopPropagation();
    var isOpen = dropdown.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
  });

  document.addEventListener("click", function(e) {
    if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      closeProfileDropdown();
    }
  });

  // Fermer si on clique un lien dans le dropdown
  dropdown.querySelectorAll("a.pd-item").forEach(function(a) {
    a.addEventListener("click", function() { closeProfileDropdown(); });
  });
}

function closeProfileDropdown() {
  var dropdown = document.getElementById("profileDropdown");
  var btn      = document.getElementById("profileMenuBtn");
  if (dropdown) dropdown.classList.remove("open");
  if (btn)      btn.classList.remove("open");
}

function confirmCancelSub() {
  closeProfileDropdown();
  var user = getUser();
  if (!user) return;
  if (!confirm(
    "Voulez-vous vraiment résilier votre abonnement " + user.plan.toUpperCase() + " ?\n\n"
    + "Votre accès reste actif jusqu'à la fin de la période."
  )) return;
  cancelSubscription();
}

function injectHamburger(user, page) {
  var nav = document.querySelector("nav");
  if (!nav || document.getElementById("hamburgerBtn")) return;

  var btn = document.createElement("button");
  btn.className = "hamburger";
  btn.id        = "hamburgerBtn";
  btn.setAttribute("aria-label", "Menu");
  btn.innerHTML = "<span></span><span></span><span></span>";
  nav.appendChild(btn);

  var navLinks = document.querySelector(".nav-links");
  var links    = navLinks ? navLinks.querySelectorAll("a") : [];

  var menu = document.createElement("div");
  menu.className = "mobile-menu";
  menu.id        = "mobileMenu";

  links.forEach(function(a) {
    var link = document.createElement("a");
    link.href        = a.getAttribute("href");
    link.textContent = a.textContent.trim();
    if (a.getAttribute("href") === page || a.classList.contains("active")) {
      link.classList.add("active");
    }
    menu.appendChild(link);
  });

  var divider = document.createElement("div");
  divider.className = "mobile-menu-divider";
  menu.appendChild(divider);

  if (user) {
    var planLabels = {free:"FREE", premium:"PREMIUM", pro:"PRO"};
    var userInfo   = document.createElement("div");
    userInfo.className = "mobile-menu-user";
    userInfo.innerHTML = "<span>" + maskEmail(user.email) + "</span>"
      + "<span style=\"color:var(--accent);font-weight:700;font-size:0.78rem;\">"
      + (planLabels[user.plan] || "FREE") + "</span>";
    menu.appendChild(userInfo);

    var logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "\uD83D\uDEAA D\u00e9connexion";
    logoutLink.onclick = function(e) { e.preventDefault(); logout(); };
    menu.appendChild(logoutLink);
  } else {
    var loginLink = document.createElement("a");
    loginLink.href        = "login.html";
    loginLink.textContent = "\uD83D\uDD10 Connexion";
    menu.appendChild(loginLink);
  }

  document.body.appendChild(menu);

  btn.addEventListener("click", function(e) {
    e.stopPropagation();
    var isOpen = menu.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
  });

  document.addEventListener("click", function(e) {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.classList.remove("open");
      btn.classList.remove("open");
    }
  });

  menu.querySelectorAll("a").forEach(function(a) {
    a.addEventListener("click", function() {
      menu.classList.remove("open");
      btn.classList.remove("open");
    });
  });
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
var _authMode = "login";

function openAuthModal(defaultTab) {
  _authMode = defaultTab || "login";
  var modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.add("open");
    updateAuthTabs();
  } else {
    window.location.href = "login.html";
  }
}

function closeAuthModal() {
  var modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("open");
}

function updateAuthTabs() {
  var tl = document.getElementById("authTabLogin");
  var tr = document.getElementById("authTabRegister");
  var btn = document.getElementById("authSubmitBtn");
  if (tl) tl.classList.toggle("active", _authMode === "login");
  if (tr) tr.classList.toggle("active", _authMode === "register");
  if (btn) btn.textContent = _authMode === "login" ? "Se connecter" : "S'inscrire";
}

function switchAuthTab(mode) {
  _authMode = mode;
  updateAuthTabs();
  var msg = document.getElementById("authMsg");
  if (msg) msg.textContent = "";
}

async function doAuth() {
  var email    = (document.getElementById("authEmail") || {}).value || "";
  var password = (document.getElementById("authPassword") || {}).value || "";
  var msg      = document.getElementById("authMsg");
  email = email.trim().toLowerCase();
  if (!email || !password) { if (msg) msg.textContent = "Remplis tous les champs."; return; }

  var endpoint = _authMode === "login" ? "/login" : "/register";
  try {
    var res  = await fetch(API + endpoint, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email, password})
    });
    var data = await res.json();
    if (data.error) { if (msg) msg.textContent = data.error; return; }
    if (_authMode === "register") {
      if (msg) msg.textContent = "Inscription réussie ! Connexion...";
      _authMode = "login";
      localStorage.setItem("newUser", "1");
      setTimeout(doAuth, 800);
      return;
    }
    var user = Object.assign({}, data.user, {password});
    saveUser(user);
    // Message de bienvenue uniquement pour les nouveaux utilisateurs FREE
    if (localStorage.getItem("newUser") && data.user.plan === "free") {
      localStorage.removeItem("newUser");
      window.location.href = "analyse.html?welcome=1";
    } else {
      localStorage.removeItem("newUser");
      window.location.href = "dashboard.html";
    }
  } catch(e) {
    if (msg) msg.textContent = "Erreur réseau.";
  }
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
function openUpgradeModal() {
  var m = document.getElementById("upgradeModal");
  if (m) m.classList.add("open");
}
function closeUpgradeModal() {
  var m = document.getElementById("upgradeModal");
  if (m) m.classList.remove("open");
}

async function subscribe(plan) {
  var user = getUser();
  if (!user) { openAuthModal(); return; }
  var newTab = window.open("", "_blank");
  if (newTab) newTab.document.write("<p style='font-family:sans-serif;padding:40px;color:#64748b;'>Chargement du paiement...</p>");
  try {
    var res  = await fetch(API + "/create-checkout", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email: user.email, plan})
    });
    var data = await res.json();
    if (data.url) {
      if (newTab) newTab.location.href = data.url;
      else window.location.href = data.url;
    } else {
      if (newTab) newTab.close();
      alert("Erreur : " + data.error);
    }
  } catch(e) {
    if (newTab) newTab.close();
    alert("Erreur réseau");
  }
}

async function cancelSubscription() {
  var user = getUser();
  if (!user) return;
  if (!confirm("Voulez-vous vraiment résilier votre abonnement " + user.plan.toUpperCase() + " ?\n\nVotre accès reste actif jusqu'à la fin de la période.")) return;
  try {
    var res  = await fetch(API + "/cancel-subscription", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email: user.email, password: user.password})
    });
    var data = await res.json();
    if (data.error) alert("Erreur : " + data.error);
    else alert(data.message);
  } catch(e) { alert("Erreur réseau"); }
}

// ── Check payment return ──────────────────────────────────────────────────────
function checkPaymentReturn() {
  var params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "success") {
    var plan = params.get("plan");
    var user = getUser();
    if (user && plan) {
      user.plan = plan;
      user.analyses_utilisees = 0;
      saveUser(user);
    }
    window.history.replaceState({}, "", window.location.pathname);
    if (document.getElementById("upgradeModal")) closeUpgradeModal();
    setTimeout(function() {
      alert("🎉 Abonnement " + (plan||"").toUpperCase() + " activé ! Bienvenue.");
    }, 300);
  }
}

// ── Quota helpers ─────────────────────────────────────────────────────────────
function getQuota(user) {
  var plan  = user.plan;
  var used  = user.analyses_utilisees || 0;
  var limit = plan === "free" ? 5 : plan === "premium" ? 50 : Infinity;
  var left  = plan === "pro" ? 999 : Math.max(0, limit - used);
  return {plan, used, limit, left};
}

// ── Google Analytics — chargé uniquement si accepté ───────────────────────────
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

function loadGA() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=G-RSYYGQZ0MD";
  document.head.appendChild(s);
  s.onload = function() {
    gtag('js', new Date());
    gtag('config', 'G-RSYYGQZ0MD');
  };
}

// Si l'utilisateur a déjà donné son consentement analytics → charger GA
(function() {
  var consent = localStorage.getItem("cookieConsent");
  if (consent) {
    try {
      var prefs = JSON.parse(consent);
      if (prefs.analytics) loadGA();
    } catch(e) {}
  }
})();

// ── Cookie Consent ────────────────────────────────────────────────────────────
(function() {
  if (localStorage.getItem("cookieConsent")) return;

  var style = document.createElement("style");
  style.textContent = `
    #cookieOverlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: cookieFadeIn 0.3s ease;
    }
    @keyframes cookieFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    #cookieBox {
      background: #0f1a2e;
      border: 1px solid #1e2d45;
      border-radius: 16px;
      padding: 32px;
      max-width: 480px; width: 100%;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      animation: cookieSlideUp 0.3s ease;
    }
    @keyframes cookieSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    #cookieBox h3 {
      font-family: 'Syne', sans-serif;
      font-size: 1.1rem; font-weight: 700;
      color: white; margin: 0 0 10px;
    }
    #cookieBox p {
      font-size: 0.85rem; color: #94a3b8;
      line-height: 1.6; margin: 0 0 20px;
    }
    #cookieBox a {
      color: #38bdf8; text-decoration: none;
    }
    #cookieBox a:hover { text-decoration: underline; }
    .cookie-btns {
      display: flex; flex-direction: column; gap: 8px;
    }
    .cookie-btns button {
      width: 100%; padding: 11px;
      border-radius: 10px; border: none;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600; font-size: 0.92rem;
      cursor: pointer; transition: all 0.2s;
    }
    #cookieBtnAccept {
      background: #38bdf8; color: #080c14;
    }
    #cookieBtnAccept:hover { background: #7dd3fc; }
    #cookieBtnCustom {
      background: #1e2d45; color: #e2e8f0;
    }
    #cookieBtnCustom:hover { background: #243552; }
    #cookieBtnRefuse {
      background: transparent; color: #64748b;
      border: 1px solid #1e2d45 !important;
    }
    #cookieBtnRefuse:hover { color: #94a3b8; border-color: #243552 !important; }

    /* Panel personnalisation */
    #cookieCustomPanel {
      display: none; margin-top: 16px;
      border-top: 1px solid #1e2d45; padding-top: 16px;
    }
    #cookieCustomPanel.open { display: block; }
    .cookie-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #1e2d4555;
    }
    .cookie-toggle-row:last-of-type { border-bottom: none; }
    .cookie-toggle-label { font-size: 0.83rem; color: #94a3b8; }
    .cookie-toggle-label strong { color: #e2e8f0; display: block; margin-bottom: 2px; }
    .cookie-switch {
      position: relative; width: 40px; height: 22px; flex-shrink: 0;
    }
    .cookie-switch input { opacity: 0; width: 0; height: 0; }
    .cookie-slider {
      position: absolute; inset: 0; background: #1e2d45;
      border-radius: 22px; cursor: pointer; transition: 0.3s;
    }
    .cookie-slider::before {
      content: ''; position: absolute;
      width: 16px; height: 16px; border-radius: 50%;
      background: #64748b; left: 3px; top: 3px; transition: 0.3s;
    }
    .cookie-switch input:checked + .cookie-slider { background: #38bdf822; }
    .cookie-switch input:checked + .cookie-slider::before {
      background: #38bdf8; transform: translateX(18px);
    }
    .cookie-switch input:disabled + .cookie-slider { opacity: 0.5; cursor: not-allowed; }
    #cookieBtnSave {
      margin-top: 14px; width: 100%; padding: 10px;
      background: #38bdf8; color: #080c14;
      border-radius: 10px; border: none;
      font-family: 'DM Sans', sans-serif;
      font-weight: 700; font-size: 0.88rem;
      cursor: pointer; transition: all 0.2s;
    }
    #cookieBtnSave:hover { background: #7dd3fc; }
  `;
  document.head.appendChild(style);

  var html = `
    <div id="cookieOverlay">
      <div id="cookieBox">
        <h3>🍪 Ce site utilise des cookies</h3>
        <p>
          Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.
          Vous pouvez accepter tous les cookies, personnaliser vos préférences ou les refuser.
          <a href="#" onclick="return false;">En savoir plus</a>
        </p>

        <div class="cookie-btns">
          <button id="cookieBtnAccept">✅ Tout accepter</button>
          <button id="cookieBtnCustom">⚙️ Personnaliser</button>
          <button id="cookieBtnRefuse">✖ Tout refuser</button>
        </div>

        <div id="cookieCustomPanel">
          <div class="cookie-toggle-row">
            <div class="cookie-toggle-label">
              <strong>Cookies essentiels</strong>
              Nécessaires au fonctionnement du site
            </div>
            <label class="cookie-switch">
              <input type="checkbox" checked disabled>
              <span class="cookie-slider"></span>
            </label>
          </div>
          <div class="cookie-toggle-row">
            <div class="cookie-toggle-label">
              <strong>Cookies analytiques</strong>
              Google Analytics — statistiques de visite
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="toggleAnalytics" checked>
              <span class="cookie-slider"></span>
            </label>
          </div>
          <div class="cookie-toggle-row">
            <div class="cookie-toggle-label">
              <strong>Cookies marketing</strong>
              Publicité personnalisée
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="toggleMarketing">
              <span class="cookie-slider"></span>
            </label>
          </div>
          <button id="cookieBtnSave">Enregistrer mes préférences</button>
        </div>
      </div>
    </div>
  `;

  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div);

  function closeConsent(prefs) {
    localStorage.setItem("cookieConsent", JSON.stringify(prefs));
    if (prefs.analytics) loadGA();
    var overlay = document.getElementById("cookieOverlay");
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.25s";
      setTimeout(function() { overlay.remove(); }, 250);
    }
  }

  document.getElementById("cookieBtnAccept").onclick = function() {
    closeConsent({ essential: true, analytics: true, marketing: true });
  };

  document.getElementById("cookieBtnRefuse").onclick = function() {
    closeConsent({ essential: true, analytics: false, marketing: false });
  };

  document.getElementById("cookieBtnCustom").onclick = function() {
    var panel = document.getElementById("cookieCustomPanel");
    panel.classList.toggle("open");
    this.textContent = panel.classList.contains("open") ? "⚙️ Masquer" : "⚙️ Personnaliser";
  };

  document.getElementById("cookieBtnSave").onclick = function() {
    closeConsent({
      essential: true,
      analytics: document.getElementById("toggleAnalytics").checked,
      marketing: document.getElementById("toggleMarketing").checked
    });
  };
})();
