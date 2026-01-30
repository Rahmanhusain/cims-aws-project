// Elements
const loginContainer = document.getElementById("login-container");
const adminContainer = document.getElementById("admin-container");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const welcomeText = document.getElementById("welcome-text");
const tbody = document.getElementById("inquiry-body");
const statusEl = document.getElementById("status");

// Filters
const filterPriority = document.getElementById("filter-priority");
const filterStatus = document.getElementById("filter-status");
const searchId = document.getElementById("search-id");
const searchBtn = document.getElementById("search-btn");
const clearSearchBtn = document.getElementById("clear-search-btn");
const dateSortBtn = document.getElementById("date-sort-btn");
let dateSortDirection = "desc";

// Password modal
const changePasswordBtn = document.getElementById("change-password-btn");
const passwordModal = document.getElementById("password-modal");
const closeModal = document.querySelector(".close");
const changePasswordForm = document.getElementById("change-password-form");
const passwordError = document.getElementById("password-error");
const passwordSuccess = document.getElementById("password-success");

// Check session on page load
async function checkSession() {
  try {
    const res = await fetch("/api/admin/check-session", {
      credentials: "include",
    });
    const data = await res.json();

    if (data.authenticated) {
      showAdminDashboard(data.username);
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error("Session check failed:", error);
    showLoginScreen();
  }
}

// Show login screen
function showLoginScreen() {
  loginContainer.style.display = "flex";
  adminContainer.style.display = "none";
}

// Show admin dashboard
function showAdminDashboard(username) {
  loginContainer.style.display = "none";
  adminContainer.style.display = "block";
  welcomeText.textContent = `Welcome, ${username}`;
  loadDashboardStats();
  loadInquiries();
}

// Login form handler
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  const originalBtnText = submitBtn.textContent;
  submitBtn.innerHTML = '<span class="spinner"></span> Signing In...';
  submitBtn.classList.add("loading");

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showAdminDashboard(data.username);
    } else {
      loginError.textContent = data.error || "Login failed";
    }
  } catch (error) {
    loginError.textContent = "Login failed. Please try again.";
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    submitBtn.classList.remove("loading");
  }
});

// Logout handler
logoutBtn.addEventListener("click", async () => {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    showLoginScreen();
    loginForm.reset();
  } catch (error) {
    console.error("Logout failed:", error);
  }
});

// Sidebar logout handler
const logoutBtnSidebar = document.getElementById("logout-btn-sidebar");
if (logoutBtnSidebar) {
  logoutBtnSidebar.addEventListener("click", async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      showLoginScreen();
      loginForm.reset();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  });
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const res = await fetch("/api/admin/stats", {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        showLoginScreen();
        return;
      }
      throw new Error("Failed to fetch stats");
    }

    const stats = await res.json();
    document.getElementById("stat-total").textContent = stats.total || 0;
    document.getElementById("stat-open").textContent = stats.open || 0;
    document.getElementById("stat-inprogress").textContent =
      stats.inProgress || 0;
    document.getElementById("stat-closed").textContent = stats.closed || 0;
    document.getElementById("stat-high").textContent = stats.highPriority || 0;
    document.getElementById("stat-medium").textContent =
      stats.mediumPriority || 0;
    document.getElementById("stat-low").textContent = stats.lowPriority || 0;
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

function setStatus(text, color = "#111827") {
  statusEl.textContent = text;
  statusEl.style.color = color;
}

function badge(text, type) {
  const span = document.createElement("span");
  span.textContent = text;
  span.className = `badge ${type}`;
  return span;
}

// Load inquiries with filters
async function loadInquiries() {
  tbody.innerHTML = '<tr><td colspan="11">Loading...</td></tr>';

  try {
    const priority = filterPriority.value;
    const status = filterStatus.value;
    const id = searchId.value.trim();

    const params = new URLSearchParams();
    if (priority && priority !== "all") params.append("priority", priority);
    if (status && status !== "all") params.append("status", status);
    if (id) params.append("searchId", id);
    params.append("sort", dateSortDirection);

    const url = `/api/admin/inquiries${params.toString() ? "?" + params.toString() : ""}`;

    const res = await fetch(url, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        showLoginScreen();
        return;
      }
      throw new Error("Failed to fetch inquiries");
    }

    const data = await res.json();
    renderRows(data);
    setStatus(`Loaded ${data.length} inquiries.`);
    loadDashboardStats(); // Refresh stats
  } catch (error) {
    setStatus(error.message || "Unable to load inquiries", "#b13030");
    tbody.innerHTML = '<tr><td colspan="10">Error loading data.</td></tr>';
  }
}

function renderRows(inquiries) {
  if (!inquiries.length) {
    tbody.innerHTML = '<tr><td colspan="11">No inquiries found.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  inquiries.forEach((inq) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
          <td>${inq.id}</td>
          <td>${inq.name}</td>
          <td>${inq.email}</td>
          <td>${inq.intent || ""}</td>
          <td>${inq.sentiment || ""}</td>
          <td>${inq.urgency || ""}</td>
          <td></td>
          <td></td>
          <td>${formatDate(inq.created_at)}</td>
          <td class="message-cell">${inq.message || ""}</td>
          <td></td>
        `;

    const priorityCell = tr.children[6];
    const statusCell = tr.children[7];
    const actionsCell = tr.children[10];

    priorityCell.appendChild(
      badge(inq.priority || "LOW", (inq.priority || "low").toLowerCase()),
    );
    statusCell.appendChild(
      badge(inq.status || "OPEN", (inq.status || "open").toLowerCase()),
    );

    const statusSelect = document.createElement("select");
    statusSelect.className = "status-select";
    statusSelect.innerHTML = `
      <option value="OPEN">Open</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="CLOSED">Closed</option>
    `;
    statusSelect.value = inq.status || "OPEN";
    statusSelect.addEventListener("change", (e) => {
      updateInquiryStatus(inq.id, e.target.value, statusSelect);
    });
    actionsCell.appendChild(statusSelect);

    tbody.appendChild(tr);
  });
}

async function updateInquiryStatus(id, newStatus, element) {
  element.disabled = true;
  try {
    const res = await fetch(`/api/admin/inquiries/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        showLoginScreen();
        return;
      }
      throw new Error(`Failed to update inquiry`);
    }

    await loadInquiries();
    loadDashboardStats();
    setStatus(`Inquiry ${id} marked as ${newStatus.replace(/_/g, " ")}.`);
  } catch (error) {
    setStatus(error.message || "Unable to update inquiry", "#b13030");
    element.disabled = false;
  }
}

// Legacy function for backwards compatibility
async function closeInquiry(id, button) {
  return updateInquiryStatus(id, "CLOSED", button);
}

// Filter event listeners
filterPriority.addEventListener("change", loadInquiries);
filterStatus.addEventListener("change", loadInquiries);
searchBtn.addEventListener("click", loadInquiries);
searchId.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loadInquiries();
});
clearSearchBtn.addEventListener("click", () => {
  searchId.value = "";
  loadInquiries();
});

// Date sort toggle
dateSortBtn.addEventListener("click", () => {
  dateSortDirection = dateSortDirection === "asc" ? "desc" : "asc";
  dateSortBtn.textContent =
    dateSortDirection === "asc" ? "Oldest First" : "Newest First";
  loadInquiries();
});

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

// Password modal handlers
changePasswordBtn.addEventListener("click", () => {
  passwordModal.style.display = "block";
  changePasswordForm.reset();
  passwordError.textContent = "";
  passwordSuccess.textContent = "";
});

closeModal.addEventListener("click", () => {
  passwordModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === passwordModal) {
    passwordModal.style.display = "none";
  }
});

changePasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  passwordError.textContent = "";
  passwordSuccess.textContent = "";

  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (newPassword !== confirmPassword) {
    passwordError.textContent = "New passwords do not match";
    return;
  }

  try {
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      passwordSuccess.textContent = data.message;
      changePasswordForm.reset();
      setTimeout(() => {
        passwordModal.style.display = "none";
      }, 2000);
    } else {
      passwordError.textContent = data.error || "Failed to change password";
    }
  } catch (error) {
    passwordError.textContent = "Failed to change password. Please try again.";
  }
});

// Column resizing functionality
function initializeColumnResize() {
  const table = document.getElementById("inquiries-table");
  const headers = table.querySelectorAll("th.resizable");

  headers.forEach((header) => {
    const resizer = header.querySelector(".resizer");
    let startX, startWidth;

    resizer.addEventListener("mousedown", (e) => {
      startX = e.pageX;
      startWidth = header.offsetWidth;

      document.addEventListener("mousemove", doResize);
      document.addEventListener("mouseup", stopResize);

      e.preventDefault();
    });

    function doResize(e) {
      const width = startWidth + (e.pageX - startX);
      if (width > 50) {
        header.style.width = width + "px";
      }
    }

    function stopResize() {
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    }
  });
}

// Initialize
checkSession();
initializeColumnResize();
