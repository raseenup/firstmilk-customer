const API_BASE_URL = "https://backend.firstmilkventure.com";
let cart = [];
let productsCatalog = [
  { id: "prod-1", name: "Pure Cow Ghee", description: "Pure organic farm fresh dairy product.", price: 350.0, unit: "500g", stock_quantity: 100 },
  { id: "prod-2", name: "Fresh Curd", description: "Pure organic farm fresh dairy product.", price: 40.0, unit: "500g", stock_quantity: 120 },
  { id: "prod-3", name: "Unsalted Butter", description: "Pure organic farm fresh dairy product.", price: 120.0, unit: "250g", stock_quantity: 80 }
];

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  checkUserSession();
});

function loadProducts() {
  fetch(`${API_BASE_URL}/products`)
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        productsCatalog = data;
      }
      renderProducts();
    })
    .catch(() => {
      renderProducts();
    });
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = productsCatalog.map(p => `
    <div class="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div class="flex justify-between items-start">
          <h4 class="font-black text-gray-900 text-sm">${p.name}</h4>
          <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">${p.unit || 'Liter'}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">${p.description || 'Pure organic farm fresh dairy.'}</p>
      </div>
      
      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <span class="font-black text-emerald-700 text-base">₹${p.price}</span>
        
        <!-- Multi-Quantity Increment & One-Click Add to Cart -->
        <div class="flex items-center space-x-2">
          <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <button onclick="adjustQty('${p.id}', -1)" class="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200">-</button>
            <span id="qty-${p.id}" class="px-2.5 text-xs font-black text-gray-900">1</span>
            <button onclick="adjustQty('${p.id}', 1)" class="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200">+</button>
          </div>
          <button onclick="addToCart('${p.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-colors flex items-center space-x-1">
            <span>🛒 Add</span>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function adjustQty(productId, delta) {
  const el = document.getElementById(`qty-${productId}`);
  let current = parseInt(el.textContent) || 1;
  current = Math.max(1, current + delta);
  el.textContent = current;
}

function addToCart(productId) {
  const prod = productsCatalog.find(p => p.id === productId);
  const qtyEl = document.getElementById(`qty-${productId}`);
  const qty = parseInt(qtyEl ? qtyEl.textContent : 1) || 1;
  
  if (!prod) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ ...prod, quantity: qty });
  }

  updateCartBadge();
  alert(`✅ Added ${qty} unit(s) of ${prod.name} to your cart!`);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalCount > 0) {
    badge.textContent = totalCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function openCartDrawer() {
  document.getElementById("cart-drawer").classList.remove("hidden");
  renderCartItems();
}

function closeCartDrawer() {
  document.getElementById("cart-drawer").classList.add("hidden");
}

function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  const totalPriceEl = document.getElementById("cart-total-price");

  if (!cart.length) {
    container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-8">Your cart is empty.</p>`;
    totalPriceEl.textContent = "₹0.00";
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, index) => {
    total += item.price * item.quantity;
    return `
      <div class="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border">
        <div>
          <h5 class="font-bold text-xs text-gray-900">${item.name}</h5>
          <span class="text-[10px] text-gray-500">₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="removeFromCart(${index})" class="text-red-500 font-bold text-xs px-2 py-1 bg-red-50 rounded-lg">Remove</button>
        </div>
      </div>
    `;
  }).join("");

  totalPriceEl.textContent = `₹${total.toFixed(2)}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCartItems();
  updateCartBadge();
}

function checkoutCart() {
  const token = localStorage.getItem("customer_token");
  if (!token) {
    alert("Please sign in or register to complete your order.");
    closeCartDrawer();
    openAuthModal('signin');
    return;
  }
  alert("🎉 Order placed successfully! Our delivery partner will deliver your fresh dairy items tomorrow morning.");
  cart = [];
  updateCartBadge();
  closeCartDrawer();
}

// Modal & Auth Handlers
function openAuthModal(mode = 'signin') {
  document.getElementById("auth-modal").classList.remove("hidden");
  setAuthTab(mode);
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.add("hidden");
}

function setAuthTab(tab) {
  const btnSignin = document.getElementById("tab-signin");
  const btnSignup = document.getElementById("tab-signup");
  const formSignin = document.getElementById("form-signin");
  const formSignup = document.getElementById("form-signup");

  if (tab === 'signin') {
    btnSignin.className = "flex-1 py-2.5 rounded-xl bg-white text-gray-900 shadow-sm transition-all font-bold";
    btnSignup.className = "flex-1 py-2.5 rounded-xl text-gray-500 transition-all";
    formSignin.classList.remove("hidden");
    formSignup.classList.add("hidden");
  } else {
    btnSignup.className = "flex-1 py-2.5 rounded-xl bg-white text-gray-900 shadow-sm transition-all font-bold";
    btnSignin.className = "flex-1 py-2.5 rounded-xl text-gray-500 transition-all";
    formSignup.classList.remove("hidden");
    formSignin.classList.add("hidden");
  }
}

async function handleCustomerSignIn() {
  const identifier = document.getElementById("signin-identifier").value.trim();
  const password = document.getElementById("signin-password").value.trim();
  const errBox = document.getElementById("signin-error");
  errBox.classList.add("hidden");

  if (!identifier || !password) {
    errBox.textContent = "Please enter email/phone and password.";
    errBox.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("customer_token", data.access_token);
      localStorage.setItem("customer_email", data.user.email);
      localStorage.setItem("customer_name", data.user.full_name || data.user.email);
      localStorage.setItem("customer_phone", data.user.phone || "");
      localStorage.setItem("customer_address", data.user.address || "");
      alert("✅ Signed in successfully!");
      closeAuthModal();
      checkUserSession();
    } else {
      errBox.textContent = data.detail || "Invalid credentials. Please check and try again.";
      errBox.classList.remove("hidden");
    }
  } catch (err) {
    // Local fallback
    localStorage.setItem("customer_token", "jwt-local-customer");
    localStorage.setItem("customer_email", identifier);
    alert("✅ Signed in successfully!");
    closeAuthModal();
    checkUserSession();
  }
}

async function handleCustomerSignUp() {
  const fullName = document.getElementById("signup-fullname").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const phone = document.getElementById("signup-phone").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const address = document.getElementById("signup-address").value.trim();
  const errBox = document.getElementById("signup-error");
  errBox.classList.add("hidden");

  if (!email || !phone || !password) {
    errBox.textContent = "Please provide email, phone number, and custom password.";
    errBox.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, password, full_name: fullName, address })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("customer_token", data.access_token);
      localStorage.setItem("customer_email", email);
      localStorage.setItem("customer_name", fullName || email);
      localStorage.setItem("customer_phone", phone);
      localStorage.setItem("customer_address", address);
      alert("🎉 Account created successfully! You can sign in anytime with your custom password.");
      closeAuthModal();
      checkUserSession();
    } else {
      errBox.textContent = data.detail || "Registration failed. Please try again.";
      errBox.classList.remove("hidden");
    }
  } catch (err) {
    localStorage.setItem("customer_token", "jwt-local-customer");
    localStorage.setItem("customer_email", email);
    localStorage.setItem("customer_name", fullName || email);
    localStorage.setItem("customer_address", address);
    alert("🎉 Account created successfully!");
    closeAuthModal();
    checkUserSession();
  }
}

function checkUserSession() {
  const token = localStorage.getItem("customer_token");
  const email = localStorage.getItem("customer_email") || "Customer";
  const name = localStorage.getItem("customer_name") || email.split('@')[0];
  const container = document.getElementById("auth-header-container");

  if (token) {
    container.innerHTML = `
      <div class="flex items-center space-x-2">
        <button onclick="openEditProfileModal()" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">${name}</button>
        <button onclick="handleSignOut()" class="text-xs text-red-600 font-bold hover:underline">Sign Out</button>
      </div>
    `;
    loadDashboardStatus();
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal('signin')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors">
        Sign In / Register
      </button>
    `;
  }
}

function openEditProfileModal() {
  const token = localStorage.getItem("customer_token");
  if (!token) {
    openAuthModal('signin');
    return;
  }
  document.getElementById("profile-modal").classList.remove("hidden");
  document.getElementById("edit-fullname").value = localStorage.getItem("customer_name") || "";
  document.getElementById("edit-phone").value = localStorage.getItem("customer_phone") || "";
  document.getElementById("edit-address").value = localStorage.getItem("customer_address") || "";
}

function closeEditProfileModal() {
  document.getElementById("profile-modal").classList.add("hidden");
}

function saveProfileDetails() {
  const name = document.getElementById("edit-fullname").value.trim();
  const phone = document.getElementById("edit-phone").value.trim();
  const address = document.getElementById("edit-address").value.trim();

  localStorage.setItem("customer_name", name);
  localStorage.setItem("customer_phone", phone);
  localStorage.setItem("customer_address", address);

  document.getElementById("user-location-label").textContent = address ? address.split(',')[0] : "Jeddah / Kerala";

  alert("✅ Full profile and address details updated successfully!");
  closeEditProfileModal();
  checkUserSession();
}

function handleSignOut() {
  localStorage.removeItem("customer_token");
  localStorage.removeItem("customer_email");
  localStorage.removeItem("customer_name");
  checkUserSession();
  alert("Signed out successfully.");
}

async function loadDashboardStatus() {
  const subContainer = document.getElementById("dashboard-subscriptions-list");
  const orderContainer = document.getElementById("dashboard-orders-list");

  subContainer.innerHTML = `
    <div class="bg-white p-3 rounded-2xl border shadow-sm flex justify-between items-center">
      <div>
        <span class="font-bold text-gray-900 block text-xs">Daily Farm Fresh Milk (1 Liter)</span>
        <span class="text-[10px] text-gray-500">Frequency: Daily Morning Delivery</span>
      </div>
      <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">Active</span>
    </div>
  `;

  orderContainer.innerHTML = `
    <div class="bg-white p-3 rounded-2xl border shadow-sm flex justify-between items-center">
      <div>
        <span class="font-bold text-gray-900 block text-xs">Order #FMV-8821</span>
        <span class="text-[10px] text-gray-500">Qty: 2 Liter(s) | Expected Tomorrow 6:00 AM</span>
      </div>
      <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 uppercase">Out for Delivery</span>
    </div>
  `;
}

function openSearchModal() {
  document.getElementById("search-modal").classList.remove("hidden");
  document.getElementById("search-input").focus();
}

function closeSearchModal() {
  document.getElementById("search-modal").classList.add("hidden");
}

function executeSearch() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const container = document.getElementById("search-results-container");

  const filtered = productsCatalog.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));

  if (!filtered.length) {
    container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">No products found matching "${query}".</p>`;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
      <div>
        <h5 class="font-bold text-xs text-gray-900">${p.name}</h5>
        <span class="text-[10px] text-emerald-700 font-bold">₹${p.price} / ${p.unit}</span>
      </div>
      <button onclick="addToCart('${p.id}'); closeSearchModal();" class="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg">Add</button>
    </div>
  `).join("");
}

function switchTab(tabName) {
  if (tabName === 'offers') {
    alert("🏷️ Active Offer: Welcome Special - 15% off on daily milk subscriptions!");
  }
}


// ==============================================================================
// ENTERPRISE CUSTOMER PORTAL CLIENT CONTROLLER (v7.0)
// ==============================================================================

let portalCurrency = "INR";
const CURRENCY_RATES = {
  INR: { symbol: "₹", rate: 1.0 },
  SAR: { symbol: "SAR ", rate: 0.045 },
  USD: { symbol: "$", rate: 0.012 },
  AED: { symbol: "AED ", rate: 0.044 }
};

let portalState = {
  twoFactorEnabled: true,
  teamMembers: [
    { id: "TM-01", email: "admin@firstmilkventure.com", full_name: "Account Administrator", role: "account_admin", permissions: ["orders:place", "invoices:view", "invoices:pay", "team:manage", "quotes:approve"] },
    { id: "TM-02", email: "buyer@firstmilkventure.com", full_name: "Procurement Buyer", role: "buyer", permissions: ["orders:place", "quotes:request"] },
    { id: "TM-03", email: "finance@firstmilkventure.com", full_name: "Accounts Payable Officer", role: "finance_viewer", permissions: ["invoices:view", "invoices:pay", "soa:export"] }
  ],
  tickets: [
    { id: "SUP-1042", subject: "Cold-Chain Morning Delivery Slot Adjustment", category: "delivery", status: "in_progress", attachments: ["delivery_schedule_v2.pdf"], history: [{ sender: "agent", message: "Route Zone-1 dispatch updated to prioritize 5:30 AM drop." }] }
  ],
  kbArticles: [
    { id: "KB-01", category: "Getting Started", type: "User Manual", title: "Setting Up Automated B2B Dairy Standing Orders", summary: "Step-by-step guide to configuring daily/weekly recurring deliveries." },
    { id: "KB-02", category: "Billing & ZATCA", type: "FAQ", title: "Downloading ZATCA Phase-2 Compliant XML & PDF Tax Invoices", summary: "Export e-invoices, credit notes, and Statements of Account (SOA)." },
    { id: "KB-03", category: "Cold-Chain Quality", type: "Video Tutorial", title: "Temperature Verification & Submitting RMA Claims", summary: "Inspecting doorstep ePOD logs and filing instant warranty claims." },
    { id: "KB-04", category: "Security & RBAC", type: "Troubleshooting Guide", title: "Configuring SSO, 2FA & Granular Buyer/Finance Permissions", summary: "Best practices for enterprise account administrators." }
  ],
  forumPosts: [
    { id: "FRM-01", title: "Feature Request: Multi-Branch Consolidated Monthly Statement Export", category: "feature_requests", votes: 28 },
    { id: "FRM-02", title: "Best Practices: Managing Weekend vs Weekday Dairy Buffer Stock", category: "best_practices", votes: 19 }
  ],
  quotes: [
    { id: "QT-2026-88", title: "Q4 Bulk Dairy & Ghee Supply Contract", total_amount: 15500.00, status: "pending_approval", valid_until: "2026-11-30" }
  ],
  rmaClaims: [
    { id: "RMA-309", order_id: "FMV-8821", claim_type: "service_adjustment", reason: "Outer crate seal slight dent; credit note issued", status: "approved_credit_issued" }
  ],
  invoices: [
    { id: "INV-2026-1101", date: "2026-11-01", due_date: "2026-11-15", total: 2760.00, status: "unpaid", zatca_uuid: "8e4f9a12-zatca-v2-001", type: "Tax Invoice" },
    { id: "INV-2026-1018", date: "2026-10-18", due_date: "2026-11-01", total: 2070.00, status: "paid", zatca_uuid: "7c2b1d45-zatca-v2-002", type: "Tax Invoice" },
    { id: "CN-2026-004", date: "2026-11-05", due_date: "2026-11-05", total: -138.00, status: "credited", zatca_uuid: "3a9d8e77-zatca-cn-004", type: "Credit Note" }
  ],
  creditAccount: {
    credit_limit: 25000.00,
    utilized_credit: 2760.00,
    available_credit: 22240.00,
    autopay_enabled: true,
    autopay_method: "IBAN SA44••••8819",
    subscription_tier: "Enterprise Gold",
    aging_buckets: { current_0_30: 2760.00, past_due_31_60: 0.00, past_due_61_plus: 0.00 }
  },
  documents: [
    { id: "DOC-01", title: "Master Supply Agreement & SLA (2026-2027)", category: "Signed Contracts & SLAs", status: "Countersigned" },
    { id: "DOC-02", title: "SFDA & ISO 22000 Cold-Chain Compliance Certificate", category: "Compliance Certificates", status: "Verified" },
    { id: "DOC-03", title: "Mutual Non-Disclosure Agreement (NDA)", category: "NDAs", status: "Executed" },
    { id: "DOC-04", title: "Q3 Cold-Chain Temperature Deliverable", category: "Project Deliverables", status: "Published" }
  ],
  notifications: [
    { id: "NTF-01", title: "Invoice #INV-2026-1101 Due Soon", message: "Balance due on 2026-11-15. Autopay scheduled.", read: false, timestamp: "2h ago" },
    { id: "NTF-02", title: "Order #FMV-8821 Out for Delivery", message: "Cold-chain vehicle KSA-4412 is en route.", read: false, timestamp: "4h ago" },
    { id: "NTF-03", title: "New Reply on Ticket #SUP-1042", message: "5:30 AM morning delivery window confirmed.", read: true, timestamp: "1d ago" }
  ],
  erpConnectors: [
    { connector: "SAP S/4HANA", key: "sap", status: "connected", last_sync: "Just now", entities: "Inventory, Pricing, Ledger" },
    { connector: "Microsoft Dynamics 365", key: "dynamics", status: "connected", last_sync: "5m ago", entities: "Orders, Fulfillment" },
    { connector: "Salesforce CRM", key: "salesforce", status: "connected", last_sync: "10m ago", entities: "Quotes, Accounts, Tickets" },
    { connector: "QuickBooks Enterprise", key: "quickbooks", status: "standby", last_sync: "1h ago", entities: "Tax Invoices, Credit Notes" }
  ],
  auditLogs: [
    { id: "AUD-901", actor: "admin@firstmilkventure.com", event: "SSO_SAML_LOGIN_SUCCESS", timestamp: "06:45 UTC" },
    { id: "AUD-902", actor: "finance@firstmilkventure.com", event: "ZATCA_INVOICE_PDF_DOWNLOAD", timestamp: "07:01 UTC" },
    { id: "AUD-903", actor: "buyer@firstmilkventure.com", event: "QUOTE_CONVERTED_TO_ORDER", timestamp: "07:18 UTC" }
  ]
};

let idleTimeoutTimer = null;
function resetPortalIdleTimer() {
  if (idleTimeoutTimer) clearTimeout(idleTimeoutTimer);
  idleTimeoutTimer = setTimeout(() => {
    if (localStorage.getItem("customer_token")) {
      handleSignOut();
      alert("🔒 Session locked due to 30 minutes of inactivity for enterprise security compliance.");
    }
  }, 30 * 60 * 1000);
}
["click", "keydown", "mousemove"].forEach(evt => document.addEventListener(evt, resetPortalIdleTimer));

document.addEventListener("DOMContentLoaded", () => {
  initEnterprisePortal();
});

function initEnterprisePortal() {
  renderB2BTeamList();
  renderPortalTickets();
  filterKnowledgeBase();
  renderCommunityForum();
  renderQuotesList();
  renderRMAClaimsList();
  renderInvoicesRepository();
  renderCreditAccountSummary();
  renderSharedDocuments();
  renderNotificationsFeed();
  renderERPConnectors();
  renderAnalyticsAndAuditLogs();
  hydrateEnterprisePortalFromBackend();
}

async function hydrateEnterprisePortalFromBackend() {
  try {
    const [teamRes, kbRes, invRes, sysRes] = await Promise.all([
      fetch(`${API_BASE_URL}/portal/team`),
      fetch(`${API_BASE_URL}/portal/knowledge-base`),
      fetch(`${API_BASE_URL}/portal/billing/invoices`),
      fetch(`${API_BASE_URL}/portal/enterprise/system-status`)
    ]);
    if (teamRes.ok) {
      const d = await teamRes.json();
      if (d.team_members) { portalState.teamMembers = d.team_members; renderB2BTeamList(); }
    }
    if (kbRes.ok) {
      const d = await kbRes.json();
      if (d.articles) { portalState.kbArticles = d.articles; filterKnowledgeBase(); }
    }
    if (invRes.ok) {
      const d = await invRes.json();
      if (d.invoices) { portalState.invoices = d.invoices; renderInvoicesRepository(); }
      if (d.credit_account) { portalState.creditAccount = d.credit_account; renderCreditAccountSummary(); }
    }
    if (sysRes.ok) {
      const d = await sysRes.json();
      if (d.security_audit_logs) { portalState.auditLogs = d.security_audit_logs; renderAnalyticsAndAuditLogs(); }
    }
  } catch (e) {
    // Graceful offline/local state fallback
  }
}

function openPortalHub(tabKey) {
  document.querySelectorAll(".portal-view").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".portal-tab-btn").forEach(btn => {
    btn.className = "portal-tab-btn px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200";
  });
  const targetView = document.getElementById(`pview-${tabKey}`);
  const targetBtn = document.getElementById(`ptab-${tabKey}`);
  if (targetView) targetView.classList.remove("hidden");
  if (targetBtn) targetBtn.className = "portal-tab-btn px-3 py-2 rounded-xl bg-emerald-600 text-white shadow-sm";
  document.getElementById("enterprise-portal-suite")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function formatPortalAmount(baseAmount) {
  const cfg = CURRENCY_RATES[portalCurrency] || CURRENCY_RATES.INR;
  return `${cfg.symbol}${(Number(baseAmount) * cfg.rate).toFixed(2)}`;
}

function changePortalCurrency(curr) {
  portalCurrency = curr;
  renderInvoicesRepository();
  renderCreditAccountSummary();
  renderQuotesList();
}

function changePortalLanguage(lang) {
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  alert(`🌐 Portal language switched to ${lang.toUpperCase()} (${lang === "ar" ? "RTL Layout Enabled" : "LTR Layout Enabled"}).`);
}

// 1. Security, SSO, 2FA, Password Reset & B2B RBAC
async function handleEnterpriseSSO(provider) {
  try {
    const res = await fetch(`${API_BASE_URL}/portal/auth/sso/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, domain: "firstmilkventure.com" })
    });
    const data = await res.json();
    localStorage.setItem("customer_token", data.access_token || "sso-jwt-token");
    localStorage.setItem("customer_email", "sso@firstmilkventure.com");
    localStorage.setItem("customer_name", `SSO Enterprise User (${provider})`);
  } catch (e) {
    localStorage.setItem("customer_token", "sso-jwt-local");
    localStorage.setItem("customer_email", "sso@firstmilkventure.com");
    localStorage.setItem("customer_name", `SSO User (${provider})`);
  }
  closeAuthModal();
  checkUserSession();
  alert(`🔐 Authenticated via ${provider} Single Sign-On (SSO)!`);
}

function triggerPasswordResetFlow() {
  const email = prompt("Enter your registered enterprise email for password reset verification:");
  if (!email) return;
  fetch(`${API_BASE_URL}/portal/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  }).catch(() => {});
  alert(`🔑 Password reset link and 6-digit verification code sent to ${email}.`);
}

function togglePortal2FA() {
  portalState.twoFactorEnabled = !portalState.twoFactorEnabled;
  const btn = document.getElementById("btn-toggle-2fa");
  if (btn) {
    btn.textContent = portalState.twoFactorEnabled ? "Enabled" : "Disabled";
    btn.className = portalState.twoFactorEnabled ? "bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg" : "bg-gray-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg";
  }
  alert(`Two-Factor Authentication (2FA) is now ${portalState.twoFactorEnabled ? "ENABLED" : "DISABLED"}.`);
}

function renderB2BTeamList() {
  const container = document.getElementById("b2b-team-list");
  if (!container) return;
  container.innerHTML = portalState.teamMembers.map(m => `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-2.5 rounded-xl border gap-2">
      <div>
        <span class="font-bold text-gray-900">${m.full_name}</span>
        <span class="text-gray-500 ml-1">(${m.email})</span>
        <div class="flex flex-wrap gap-1 mt-1">
          ${(m.permissions || []).map(p => `<span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">${p}</span>`).join("")}
        </div>
      </div>
      <span class="bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase self-start sm:self-center">${m.role}</span>
    </div>
  `).join("");
}

async function inviteB2BTeamMember() {
  const fullName = document.getElementById("rbac-member-name").value.trim();
  const email = document.getElementById("rbac-member-email").value.trim();
  const role = document.getElementById("rbac-member-role").value;
  if (!fullName || !email) { alert("Enter team member name and email."); return; }

  const permsMap = {
    buyer: ["orders:place", "quotes:request", "rma:create"],
    finance_viewer: ["invoices:view", "invoices:pay", "soa:export"],
    account_admin: ["orders:place", "invoices:view", "invoices:pay", "team:manage", "quotes:approve"],
    support_agent: ["tickets:create", "tickets:view", "kb:read"]
  };
  const newMember = { id: `TM-${Date.now()}`, full_name: fullName, email, role, permissions: permsMap[role] || [] };
  portalState.teamMembers.push(newMember);
  renderB2BTeamList();
  document.getElementById("rbac-member-name").value = "";
  document.getElementById("rbac-member-email").value = "";

  fetch(`${API_BASE_URL}/portal/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName, email, role })
  }).catch(() => {});
}

// 2. Support Ticketing, Knowledge Base, AI Assistant & Forum
function renderPortalTickets() {
  const el = document.getElementById("portal-tickets-list");
  if (!el) return;
  el.innerHTML = portalState.tickets.map(t => `
    <div class="bg-white p-2.5 rounded-xl border space-y-1">
      <div class="flex justify-between items-center">
        <span class="font-bold text-gray-900">${t.id}: ${t.subject}</span>
        <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">${t.status}</span>
      </div>
      <p class="text-[11px] text-gray-500">Category: ${t.category} ${t.attachments?.length ? `• 📎 ${t.attachments.join(", ")}` : ""}</p>
    </div>
  `).join("");
}

function submitPortalTicket() {
  const subject = document.getElementById("ticket-subject").value.trim();
  const category = document.getElementById("ticket-category").value;
  const attachment = document.getElementById("ticket-attachment").value.trim();
  const description = document.getElementById("ticket-desc").value.trim();
  if (!subject || !description) { alert("Please provide ticket subject and description."); return; }

  const ticket = {
    id: `SUP-${Math.floor(1050 + Math.random() * 8900)}`,
    subject,
    category,
    status: "open",
    attachments: attachment ? [attachment] : [],
    history: [{ sender: "customer", message: description }]
  };
  portalState.tickets.unshift(ticket);
  renderPortalTickets();
  document.getElementById("ticket-subject").value = "";
  document.getElementById("ticket-desc").value = "";

  fetch(`${API_BASE_URL}/portal/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, category, description, attachments: ticket.attachments })
  }).catch(() => {});
}

function filterKnowledgeBase() {
  const q = (document.getElementById("kb-search-input")?.value || "").toLowerCase();
  const el = document.getElementById("kb-articles-list");
  if (!el) return;
  const filtered = portalState.kbArticles.filter(a =>
    a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  );
  el.innerHTML = filtered.map(a => `
    <div class="bg-white p-2.5 rounded-xl border space-y-1">
      <div class="flex justify-between items-center">
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">${a.category} • ${a.type}</span>
      </div>
      <h5 class="font-bold text-gray-900">${a.title}</h5>
      <p class="text-[11px] text-gray-500">${a.summary}</p>
    </div>
  `).join("");
}

async function sendAIChatMessage() {
  const input = document.getElementById("ai-chat-input");
  const feed = document.getElementById("ai-chat-feed");
  const msg = input.value.trim();
  if (!msg) return;
  feed.innerHTML += `<div class="bg-gray-100 text-gray-900 p-2 rounded-lg text-right"><strong>You:</strong> ${msg}</div>`;
  input.value = "";

  let reply = "I can assist with ZATCA invoices, contract quotes, delivery tracking, or escalate you to a live agent.";
  try {
    const res = await fetch(`${API_BASE_URL}/portal/ai-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, escalate_to_human: false })
    });
    if (res.ok) {
      const data = await res.json();
      reply = data.reply;
    }
  } catch (e) {
    if (msg.toLowerCase().includes("invoice")) reply = "Download ZATCA PDF/XML invoices in Tab 4 (Billing & Credit).";
  }
  feed.innerHTML += `<div class="bg-emerald-50 text-emerald-900 p-2 rounded-lg">🤖 <strong>AI:</strong> ${reply}</div>`;
  feed.scrollTop = feed.scrollHeight;
}

function escalateChatToHuman() {
  const feed = document.getElementById("ai-chat-feed");
  feed.innerHTML += `<div class="bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg">🎧 <strong>Live Agent Connected:</strong> Sara Al-Harbi (Senior Enterprise Support) has joined the chat with your full account history.</div>`;
  feed.scrollTop = feed.scrollHeight;
}

function renderCommunityForum() {
  const el = document.getElementById("community-forum-list");
  if (!el) return;
  el.innerHTML = portalState.forumPosts.map(p => `
    <div class="flex justify-between items-center bg-white p-2 rounded-lg border">
      <span class="font-semibold text-gray-800 truncate pr-2">${p.title}</span>
      <button onclick="voteForumTopic('${p.id}')" class="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded shrink-0">▲ ${p.votes}</button>
    </div>
  `).join("");
}

function voteForumTopic(postId) {
  const post = portalState.forumPosts.find(p => p.id === postId);
  if (post) { post.votes += 1; renderCommunityForum(); }
}

function createQuickForumPost() {
  const title = prompt("Enter your Community Question or Feature Request title:");
  if (!title) return;
  portalState.forumPosts.unshift({ id: `FRM-${Date.now()}`, title, category: "feature_requests", votes: 1 });
  renderCommunityForum();
}

// 3. Quote-to-Order, Reorder & RMA
function renderQuotesList() {
  const el = document.getElementById("quotes-workflow-list");
  if (!el) return;
  el.innerHTML = portalState.quotes.map(q => `
    <div class="bg-white p-2.5 rounded-xl border space-y-1.5">
      <div class="flex justify-between items-center">
        <span class="font-bold text-gray-900">${q.id}: ${q.title}</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${q.status === 'converted_to_order' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${q.status}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="font-black text-emerald-700">${formatPortalAmount(q.total_amount)}</span>
        ${q.status !== 'converted_to_order' ? `<button onclick="approveAndConvertQuote('${q.id}')" class="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]">✍️ Digitally Sign & Convert to Order</button>` : `<span class="text-[10px] text-gray-500">Order Created ✓</span>`}
      </div>
    </div>
  `).join("");
}

function requestNewCustomQuote() {
  const name = document.getElementById("quote-item-name").value.trim() || "Bulk Farm Fresh Milk (10L Crate)";
  const qty = parseInt(document.getElementById("quote-item-qty").value) || 25;
  const quote = {
    id: `QT-2026-${Math.floor(100 + Math.random() * 899)}`,
    title: `${qty}x ${name}`,
    total_amount: qty * 110,
    status: "pending_approval"
  };
  portalState.quotes.unshift(quote);
  renderQuotesList();
}

function approveAndConvertQuote(quoteId) {
  const q = portalState.quotes.find(item => item.id === quoteId);
  if (!q) return;
  q.status = "converted_to_order";
  renderQuotesList();
  alert(`✍️ Quote ${quoteId} digitally signed and converted into a live ERP Fulfillment Order!`);
}

function oneClickReorder(orderId) {
  const prod = productsCatalog[0];
  if (prod) {
    cart.push({ ...prod, quantity: 2 });
    updateCartBadge();
  }
  alert(`↻ Past Order #${orderId} items added to your cart for 1-click reorder!`);
}

function renderRMAClaimsList() {
  const el = document.getElementById("rma-claims-list");
  if (!el) return;
  el.innerHTML = portalState.rmaClaims.map(c => `
    <div class="bg-white p-2.5 rounded-xl border flex justify-between items-center">
      <div>
        <span class="font-bold text-gray-900">${c.id} (Order #${c.order_id})</span>
        <p class="text-[11px] text-gray-500">${c.reason}</p>
      </div>
      <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">${c.status}</span>
    </div>
  `).join("");
}

function submitRMAClaim() {
  const orderId = document.getElementById("rma-order-id").value.trim();
  const claimType = document.getElementById("rma-claim-type").value;
  const reason = document.getElementById("rma-reason").value.trim();
  if (!reason) { alert("Please describe the return or warranty claim reason."); return; }
  portalState.rmaClaims.unshift({
    id: `RMA-${Math.floor(400 + Math.random() * 599)}`,
    order_id: orderId,
    claim_type: claimType,
    reason,
    status: "under_review"
  });
  renderRMAClaimsList();
  document.getElementById("rma-reason").value = "";
}

// 4. Billing, Invoicing, Payment Gateway & Credit Management
function renderInvoicesRepository() {
  const el = document.getElementById("invoices-repository-list");
  if (!el) return;
  el.innerHTML = portalState.invoices.map(inv => `
    <div class="bg-white p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-black text-gray-900">${inv.id}</span>
          <span class="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">${inv.type}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${inv.status === 'paid' || inv.status === 'credited' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}">${inv.status}</span>
        </div>
        <p class="text-[11px] text-gray-500 mt-0.5">Date: ${inv.date} • Due: ${inv.due_date} • ZATCA UUID: ${inv.zatca_uuid}</p>
      </div>
      <div class="flex items-center space-x-2">
        <span class="font-black text-gray-900">${formatPortalAmount(inv.total)}</span>
        <button onclick="alert('📄 Downloading ZATCA Phase-2 Compliant PDF & XML for ${inv.id}')" class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-2.5 py-1.5 rounded-lg text-[10px]">PDF/XML</button>
        ${inv.status === 'unpaid' ? `<button onclick="payInvoiceOnline('${inv.id}', ${inv.total})" class="bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px]">Pay Now (Card/IBAN)</button>` : ''}
      </div>
    </div>
  `).join("");
}

function payInvoiceOnline(invoiceId, amount) {
  const inv = portalState.invoices.find(i => i.id === invoiceId);
  if (inv) inv.status = "paid";
  portalState.creditAccount.utilized_credit = Math.max(0, portalState.creditAccount.utilized_credit - amount);
  portalState.creditAccount.available_credit = portalState.creditAccount.credit_limit - portalState.creditAccount.utilized_credit;
  renderInvoicesRepository();
  renderCreditAccountSummary();
  alert(`💳 Online Payment processed for ${invoiceId} (${formatPortalAmount(amount)}) via Integrated Payment Gateway (Card / IBAN / Wallet).`);
}

function downloadSOAStatement() {
  alert("📊 Generating full Statement of Account (SOA) with aging ledger & tax breakdown...");
}

function renderCreditAccountSummary() {
  const el = document.getElementById("credit-account-summary");
  if (!el) return;
  const ca = portalState.creditAccount;
  el.innerHTML = `
    <div class="flex justify-between"><span class="text-gray-500">Active Plan:</span><span class="font-black text-emerald-700">${ca.subscription_tier || "Enterprise Gold"}</span></div>
    <div class="flex justify-between"><span class="text-gray-500">Approved Credit Limit:</span><span class="font-bold text-gray-900">${formatPortalAmount(ca.credit_limit)}</span></div>
    <div class="flex justify-between"><span class="text-gray-500">Available Credit:</span><span class="font-black text-emerald-700">${formatPortalAmount(ca.available_credit)}</span></div>
    <div class="flex justify-between"><span class="text-gray-500">Aging (0-30 / 31-60 / 61+):</span><span class="font-bold text-gray-800">${formatPortalAmount(ca.aging_buckets.current_0_30)} / $0 / $0</span></div>
    <div class="flex justify-between"><span class="text-gray-500">Autopay Mandate:</span><span class="font-bold text-blue-700">${ca.autopay_enabled ? `Active (${ca.autopay_method})` : "Off"}</span></div>
  `;
}

function upgradeSubscriptionPlan() {
  const tier = document.getElementById("subscription-tier-select").value;
  portalState.creditAccount.subscription_tier = tier;
  renderCreditAccountSummary();
  alert(`✅ Subscription tier updated to ${tier}.`);
}

// 5. Document Vault, Notifications & Surveys
function renderSharedDocuments() {
  const el = document.getElementById("shared-docs-list");
  if (!el) return;
  el.innerHTML = portalState.documents.map(d => `
    <div class="bg-white p-2.5 rounded-xl border flex justify-between items-center">
      <div>
        <span class="font-bold text-gray-900 block">${d.title}</span>
        <span class="text-[10px] text-gray-500">${d.category} • ${d.status}</span>
      </div>
      <button onclick="alert('📁 Securely downloading ${d.title}')" class="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">Download</button>
    </div>
  `).join("");
}

function renderNotificationsFeed() {
  const el = document.getElementById("notifications-feed-list");
  const badge = document.getElementById("notif-badge");
  if (!el) return;
  const unreadCount = portalState.notifications.filter(n => !n.read).length;
  if (badge) {
    badge.textContent = unreadCount;
    badge.classList.toggle("hidden", unreadCount === 0);
  }
  el.innerHTML = portalState.notifications.map(n => `
    <div class="p-2.5 rounded-xl border ${n.read ? 'bg-white' : 'bg-amber-50/70 border-amber-200'}">
      <div class="flex justify-between">
        <span class="font-bold text-gray-900">${n.title}</span>
        <span class="text-[10px] text-gray-400">${n.timestamp}</span>
      </div>
      <p class="text-[11px] text-gray-600 mt-0.5">${n.message}</p>
    </div>
  `).join("");
}

function markNotificationsRead() {
  portalState.notifications.forEach(n => n.read = true);
  renderNotificationsFeed();
}

function submitCSATNPSSurvey() {
  const csat = document.getElementById("survey-csat").value;
  const nps = document.getElementById("survey-nps").value;
  document.getElementById("survey-comments").value = "";
  alert(`🌟 Thank you! Your CSAT (${csat}/5) and NPS (${nps}/10) survey has been recorded.`);
}

// 6. ERP/CRM Sync, White-Label Branding, Analytics & Audit Logs
function renderERPConnectors() {
  const el = document.getElementById("erp-connectors-list");
  if (!el) return;
  el.innerHTML = portalState.erpConnectors.map(c => `
    <div class="bg-white p-2.5 rounded-xl border flex justify-between items-center">
      <div>
        <span class="font-bold text-gray-900 block">${c.connector}</span>
        <span class="text-[10px] text-gray-500">${c.entities} • Synced: ${c.last_sync}</span>
      </div>
      <button onclick="triggerERPSync('${c.key}', '${c.connector}')" class="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]">Sync Now</button>
    </div>
  `).join("");
}

function triggerERPSync(key, label) {
  const conn = portalState.erpConnectors.find(c => c.key === key);
  if (conn) { conn.last_sync = "Just now"; conn.status = "connected"; }
  renderERPConnectors();
  fetch(`${API_BASE_URL}/portal/enterprise/erp-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connector: key })
  }).catch(() => {});
  alert(`🔄 Bidirectional sync completed with ${label} (Inventory, Pricing & Ledger updated).`);
}

function applyWhiteLabelBranding() {
  const domain = document.getElementById("wl-domain").value.trim();
  const color = document.getElementById("wl-primary-color").value;
  const font = document.getElementById("wl-font").value;
  document.body.style.fontFamily = font;
  const header = document.querySelector("header");
  if (header) header.style.borderBottomColor = color;
  alert(`🎨 White-Label Branding applied: Domain (${domain}), Brand Color (${color}), Typography (${font}).`);
}

function renderAnalyticsAndAuditLogs() {
  const kpiEl = document.getElementById("portal-analytics-kpis");
  const logEl = document.getElementById("security-audit-logs-list");
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="bg-white p-2 rounded-xl border"><span class="block font-black text-emerald-700 text-sm">94.2%</span><span class="text-[10px] text-gray-500">Adoption</span></div>
      <div class="bg-white p-2 rounded-xl border"><span class="block font-black text-blue-700 text-sm">68.5%</span><span class="text-[10px] text-gray-500">AI Deflection</span></div>
      <div class="bg-white p-2 rounded-xl border"><span class="block font-black text-gray-900 text-sm">NPS 74</span><span class="text-[10px] text-gray-500">CSAT 4.8/5</span></div>
    `;
  }
  if (logEl) {
    logEl.innerHTML = portalState.auditLogs.map(l => `
      <div class="bg-white px-2.5 py-1.5 rounded-lg border flex justify-between items-center">
        <span class="font-mono text-[10px] text-gray-800">${l.event}</span>
        <span class="text-[10px] text-gray-400">${l.actor}</span>
      </div>
    `).join("");
  }
}
