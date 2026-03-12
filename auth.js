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
