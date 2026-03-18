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
function initNav() {
  var user = getUser();
  var navUser    = document.getElementById("navUser");
  var navPlan    = document.getElementById("navPlan");
  var navLogin   = document.getElementById("navLogin");
  var navLogout  = document.getElementById("navLogout");

  if (user) {
    if (navUser)   { navUser.textContent = user.email; navUser.classList.remove("hidden"); }
    if (navPlan)   {
      var labels = {free:"FREE", premium:"PREMIUM", pro:"PRO"};
      var classes = {free:"plan-free", premium:"plan-premium", pro:"plan-pro"};
      navPlan.textContent  = labels[user.plan] || "FREE";
      navPlan.className    = "nav-plan " + (classes[user.plan] || "plan-free");
      navPlan.classList.remove("hidden");
    }
    if (navLogin)  navLogin.classList.add("hidden");
    if (navLogout) navLogout.classList.remove("hidden");
  } else {
    if (navUser)   navUser.classList.add("hidden");
    if (navPlan)   navPlan.classList.add("hidden");
    if (navLogin)  navLogin.classList.remove("hidden");
    if (navLogout) navLogout.classList.add("hidden");
  }

  // Active link
  var page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function(a) {
    if (a.getAttribute("href") === page) a.classList.add("active");
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
      setTimeout(doAuth, 800);
      return;
    }
    var user = Object.assign({}, data.user, {password});
    saveUser(user);
    // Redirect to dashboard
    window.location.href = "dashboard.html";
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
  var limit = plan === "free" ? 2 : plan === "premium" ? 50 : Infinity;
  var left  = plan === "pro" ? 999 : Math.max(0, limit - used);
  return {plan, used, limit, left};
}

// ── Google Analytics ──────────────────────────────────────────────────────────
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-RSYYGQZ0MD');

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
