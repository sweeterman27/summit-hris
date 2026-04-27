<script>
  /* ================================================================
     SUMMIT HRIS | Enterprise Client Console
     Summit Design System — Scripts.html
  ================================================================ */

  const App = {
    user: null,
    currentView: "dashboard",
    cache: {}, // Dynamic Caching Layer
    cacheExpiry: 1000 * 60 * 5, // 5 minute default cache
    calendarState: {
      selectedDate: null,
      tags: [],
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
    },
    directoryState: {
      filters: {},
      sort: "name_asc",
      meta: null,
    },
  };

  let notificationSentryInterval = null;

  /**
   * Sets/Gets from cache with timestamp validation.
   */
  function tryCache(key, data = null) {
    if (data) {
      App.cache[key] = { data, ts: Date.now() };
      return data;
    }
    const cached = App.cache[key];
    if (cached && Date.now() - cached.ts < App.cacheExpiry) return cached.data;
    return null;
  }

  /* ── Bootstrap ──────────────────────────────────────────────── */
  window.addEventListener("DOMContentLoaded", () => {
    // 1. Immediate Safety: Hide loader after timeout regardless of script execution
    setTimeout(() => {
      const loader = document.getElementById("loader");
      const app = document.getElementById("app");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => (loader.style.display = "none"), 400);
      }
      if (app) app.style.opacity = "1";
    }, 1200);

    // 2. Load and Navigate
    try {
      App.user = JSON.parse(localStorage.getItem("summit_user") || "null");
    } catch (e) {
      console.warn("Storage error", e);
    }

    navigate();
    if (App.user) {
      fetchNotifications();
      startNotificationSentry();
    }
  });

  // Global error bridge
  window.onerror = function (msg, url, line) {
    console.error(`JS Error: ${msg} @ ${line}`);
    return false;
  };

  /* ── Main Navigation ────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "none";
    document.body.style.overflow = "";
  }

  /**
   * Toggles loading state on a modal's primary action button
   */
  function setModalLoading(modalId, isLoading) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const btn = modal.querySelector(".btn-solid");
    if (!btn) return;

    if (isLoading) {
      btn.dataset.originalText = btn.innerText;
      btn.innerHTML = '<span class="c-loader !w-4 !h-4"></span> Posting...';
      btn.disabled = true;
      btn.style.opacity = "0.7";
    } else {
      btn.innerHTML = btn.dataset.originalText || "Submit";
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  }

  function navigate() {
    const slot = document.getElementById("main-content");
    if (!slot) return;

    // Initial loading state on blue canvas
    slot.innerHTML = `<div class="flex flex-col items-center gap-4"><span class="c-loader !border-t-white"></span><p class="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Summit Cloud Integration</p></div>`;

    google.script.run
      .withSuccessHandler((html) => {
        slot.innerHTML = html;
        // After shell renders, load the dashboard section
        if (App.user && App.user.role) {
          setTimeout(() => loadSection("dashboard"), 50);
          setTimeout(applySidebarSavedState, 100);
          // Standardized Notification Bootstrap
          setTimeout(fetchNotifications, 2000);
        }
      })
      .withFailureHandler((err) => {
        slot.innerHTML = renderError("Connection Failed", err.message);
      })
      .getRoleView(App.user);
  }

  function handleLogout() {
    showToast("Signing out of Summit Hub...", "info");
    
    // 1. Backend cleanup
    google.script.run.logoutUser();
    
    // 2. State & Cache cleanup
    App.user = null;
    App.currentView = "login";
    App.cache = {};
    localStorage.removeItem("summit_user");
    
    // 3. Clear URL hash to prevent ghost-routing
    if (window.location.hash) {
      history.replaceState(null, null, ' ');
    }
    
    // 4. Forces fresh shell navigation to the landing page
    navigate();
  }
  /* ── Section Router (SPA) ───────────────────────────────────── */
  function loadSection(sectionId, navBtn) {
    if (!sectionId) return;

    // 1. Instant Shell Rendering (Eliminating the Flash)
    renderSectionShell(sectionId);
    showProgress(30);
    App.currentView = sectionId;

    // 2. Navigation Highlighting Strategy (Absolute Exclusivity)
    document.querySelectorAll(".nav-item-tailwind").forEach((b) => {
      b.classList.remove(
        "bg-[#c9a236]/15",
        "text-[#c9a236]",
        "font-bold",
        "border-[#c9a236]/30",
        "shadow-xl",
        "shadow-[#c9a236]/10",
      );
      b.classList.add("text-white/50", "font-medium", "border-transparent");
    });

    const targetBtn =
      navBtn ||
      document.querySelector(`.nav-item-tailwind[onclick*="'${sectionId}'"]`);
    if (targetBtn) {
      targetBtn.classList.remove(
        "text-white/50",
        "font-medium",
        "border-transparent",
      );
      targetBtn.classList.add(
        "bg-[#c9a236]/15",
        "text-[#c9a236]",
        "font-bold",
        "border-[#c9a236]/30",
        "shadow-xl",
        "shadow-[#c9a236]/10",
      );
    }

    if (typeof toggleMobileMenu === "function") toggleMobileMenu(false);

    const crumb = document.getElementById("breadcrumb-label");
    const crumbMap = {
      dashboard: "Dashboard Overview",
      directory: "Summit Directory",
      leave: "Leave Pipeline",
      attendance: "Timekeeping Hub",
      talent: "Growth engine",
      access: "System Access",
      reports: "Strategic Intelligence",
      calendar: "Schedule & Rostering",
    };
    if (crumb) crumb.textContent = crumbMap[sectionId] || sectionId;

    // 5. Execution (SWR Pattern)
    const routes = {
      dashboard: loadDashboard,
      directory: loadDirectory,
      leave: loadLeave,
      attendance: loadAttendance,
      talent: loadTalent,
      access: loadAccessControl,
      calendar: loadCalendar,
      reports: () =>
        setPageBody(
          '<div class="p-20 text-center glass-panel">Reporting module coming soon.</div>',
        ),
    };

    const fn = routes[sectionId];
    if (fn) fn();
    showProgress(100);
  }

  /**
   * Renders a placeholder shell INSTANTLY to give immediate visual feedback.
   */
  function renderSectionShell(sectionId) {
    const shells = {
      dashboard: `
        <div class="view-header"><div><h1 class="t-h1">Dashboard</h1></div></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 anim-up">
          <div class="card h-40 shell-pulse bg-[#f2f2f3]/50"></div>
          <div class="card h-40 shell-pulse bg-[#f2f2f3]/50"></div>
          <div class="card h-40 shell-pulse bg-[#f2f2f3]/50"></div>
        </div>
      `,
      calendar: renderCalendarShell(), // We already have a fast shell for calendar
      directory: `
        <div class="view-header"><div><h1 class="t-h1">Directory</h1></div></div>
        <div class="card p-6 shell-pulse bg-[#f2f2f3]/50 h-96"></div>
      `,
    };
    setPageBody(
      shells[sectionId] ||
        '<div class="p-20 flex justify-center"><span class="c-loader"></span></div>',
    );
  }

  function toggleMobileMenu(show) {
    const sidebar = document.getElementById("main-sidebar");
    const overlay = document.getElementById("mobile-overlay");
    if (!sidebar || !overlay) return;

    if (show) {
      overlay.classList.remove("hidden");
      setTimeout(() => {
        sidebar.classList.add("sidebar-active");
        overlay.classList.add("overlay-active");
      }, 10);
    } else {
      sidebar.classList.remove("sidebar-active");
      overlay.classList.remove("overlay-active");
      setTimeout(() => overlay.classList.add("hidden"), 500);
    }
  }

  /* ── Render Helpers ─────────────────────────────────────────── */
  function setPageBody(html) {
    const body = document.getElementById("page-body");
    if (!body) return;
    body.innerHTML = html;
  }

  function setLoading(type = "skeleton") {
    if (type === "spinner") {
      setPageBody(
        `<div style="display:flex;align-items:center;justify-content:center;padding:80px;"><span class="c-loader"></span></div>`,
      );
      return;
    }

    // Default: Skeleton Cards / Table
    const skeletonHtml = `
      <div class="anim-up" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;margin-bottom:32px;">
        <div class="c-skeleton" style="height:180px;"></div>
        <div class="c-skeleton" style="height:180px;"></div>
        <div class="c-skeleton" style="height:180px;"></div>
      </div>
      <div class="c-skeleton" style="height:400px;width:100%;"></div>
    `;
    setPageBody(skeletonHtml);
  }

  function showProgress(percent) {
    const barContainer = document.getElementById("top-progress");
    const barFill = document.getElementById("top-progress-fill");
    if (!barContainer || !barFill) return;

    barContainer.classList.remove("hidden");
    barFill.style.width = percent + "%";

    if (percent >= 100) {
      setTimeout(() => {
        barContainer.classList.add("hidden");
        barFill.style.width = "0%";
      }, 500);
    }
  }

  function renderError(title, msg) {
    return `
      <div style="padding:48px;font-family:'Inter',sans-serif;">
        <p class="t-micro" style="margin-bottom:8px;">System Error</p>
        <p style="font-family:'DM Serif Display',serif;font-size:1.75rem;color:#000;margin-bottom:12px;">${title}</p>
        <p style="font-size:0.875rem;color:#93939f;">${msg}</p>
      </div>`;
  }

  /* ── PAGE: Dashboard ─────────────────────────────────────────── */
  function filterDistribution(inputId, listId) {
    const query = document.getElementById(inputId).value.toLowerCase();
    const list = document.getElementById(listId);
    const items = list.getElementsByClassName("dist-item");

    Array.from(items).forEach((item) => {
      const text = item
        .querySelector(".dist-item-label")
        .textContent.toLowerCase();
      item.style.display = text.includes(query) ? "flex" : "none";
    });
  }

  function loadDashboard() {
    setLoading("skeleton");
    showProgress(30);
    google.script.run
      .withSuccessHandler((resp) => {
        if (!resp) {
          showToast("Failed to connect to the cloud. Retrying...", "error");
          setTimeout(loadDashboard, 3000); // Auto-retry
          return;
        }
        if (App.currentView !== "dashboard") return;
        showProgress(100);
        if (!resp.success) {
          setPageBody(renderError("Data Error", resp.message));
          return;
        }

        const s = resp;
        App.directoryState.dashboardData = s; // Persist for local CRUD operations
        const { role, isEmp, isMgr, isAdmin, isSuperAdmin } = getRoleState();
        const isAdm = isAdmin; // Preserve local alias if needed

        const renderDistHtml = (title, data, id) => `
          <div class="summit-card-glow anim-up" onmousemove="handleCardGlow(event, this)">
            <div class="notiglow"></div>
            <div class="notiborderglow"></div>
            
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;position:relative;z-index:6;">
              <h3 class="summit-card-title !padding-0" style="padding-left:1.25rem;">${title}</h3>
              <span class="status-pill" style="font-size:0.65rem;background:#f2f2f7;color:#93939f;margin-right:10px;">${data.length} Total</span>
            </div>
            
            <div class="dist-search-container" style="position:relative;z-index:6; margin-left:1.25rem; margin-right:1.25rem;">
              <svg class="dist-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" id="${id}-search" class="dist-search-input" placeholder="Search ${title.toLowerCase()}..." oninput="filterDistribution('${id}-search', '${id}-list')">
            </div>

            <div id="${id}-list" class="dist-list custom-scrollbar summit-card-body" style="position:relative;z-index:6;">
              ${data
                .map(
                  (d) => `
                <div class="dist-item">
                  <span class="dist-item-label">${d.name}</span>
                  <span class="dist-item-count">${d.count}</span>
                </div>
              `,
                )
                .join("")}
              ${data.length === 0 ? '<p style="font-size:0.8rem;color:#93939f;text-align:center;padding:40px 0;">No data found.</p>' : ""}
            </div>
          </div>
        `;

        // Emergency Popup Check
        checkEmergencyPopups(s.announcements);

        setPageBody(`
          <!-- Company Pulse: Announcements -->
          ${renderAnnouncementsTicker(s.announcements, isAdm)}

          <!-- Top Interaction Row (Identity + Leave) -->
          <div class="grid grid-cols-1 ${!isSuperAdmin ? 'lg:grid-cols-2' : ''} gap-8 mb-8 anim-stagger">
            
            <!-- Summit Identity Tablet (Half-Width) - Hidden for SuperAdmin -->
            ${!isSuperAdmin ? renderProfileIdentityBar(App.user, s.personalLeaveBalance) : ''}

            <!-- Leave & Credits Hub / Org Overview -->
            ${isEmp ? `
              <div class="c-card-em p-8 group hover:scale-[1.01] transition-all cursor-pointer h-full" onclick="navigate('leave')">
                <div class="flex justify-between items-start mb-10">
                  <div class="w-12 h-12 rounded-2xl bg-[#faf6eb] flex items-center justify-center text-[#c9a236]">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9a236]">Credits Available</span>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Pool: SIL / Birthday</p>
                  </div>
                </div>
                <div class="flex items-baseline gap-2 mb-4">
                  <p class="stat-number accent">${s.personalLeaveBalance || 0}</p>
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Days</p>
                </div>
                <div class="flex gap-2">
                  <button class="btn-solid !py-2 !px-6 text-[10px]" onclick="event.stopPropagation(); navigate('leave')">File Leave</button>
                  <button class="btn-outline !py-2 !px-6 text-[10px]" onclick="event.stopPropagation(); loadAttendance()">Attendance Log</button>
                </div>
              </div>
            ` : `
              <div class="summit-card-glow anim-up p-10 h-full flex flex-col justify-center" onmousemove="handleCardGlow(event, this)" style="border: 1px solid rgba(201, 162, 54, 0.1);">
                <div class="notiglow"></div>
                <div class="notiborderglow"></div>
                
                <div class="flex items-center gap-3 mb-6 relative z-[6] translate-x-3">
                   <div class="w-1.5 h-6 bg-[#c9a236] rounded-full"></div>
                   <p class="text-[11px] font-black uppercase tracking-[0.2em] text-[#1c1707]">Enterprise Organization Overview</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-[6] px-3">
                   <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm summit-card-body !px-6 !translate-x-0 group-hover:translate-x-1 transition-all">
                      <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Workspace Headcount</p>
                      <p class="text-3xl font-black text-[#1c1707]">${s.totalEmployees || 0}</p>
                   </div>
                   <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm summit-card-body !px-6 !translate-x-0 group-hover:translate-x-1 transition-all">
                      <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Sessions</p>
                      <p class="text-3xl font-black text-[#c9a236]">${s.activeEmployees || 0}</p>
                   </div>
                   <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm summit-card-body !px-6 !translate-x-0 group-hover:translate-x-1 transition-all">
                      <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Requests</p>
                      <p class="text-3xl font-black text-red-500">${s.pendingLeave || 0}</p>
                   </div>
                   <div class="p-6 bg-[#1c1707] rounded-3xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-[#c9a236] transition-all group/btn" onclick="navigate('directory')">
                      <p class="text-[10px] font-black text-white uppercase tracking-widest group-hover/btn:scale-105 transition-all">Manage Registry</p>
                   </div>
                </div>
              </div>
            `}
          </div>

          <!-- Legacy Stats (Non-Employee) -->
          ${!isEmp ? `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:20px;" class="anim-stagger">
              <div class="c-card anim-up" style="padding:28px;">
                <p class="t-label" style="margin-bottom:16px;">Pending Leave</p>
                <p class="stat-number">${s.pendingLeave || 0}</p>
                <p style="font-size:0.8125rem;color:#93939f;margin-top:10px;font-family:'Inter',sans-serif;">${s.approvedLeave || 0} approved</p>
              </div>
              <div class="c-card anim-up" style="padding:28px;">
                <p class="t-label" style="margin-bottom:16px;">Approved Leave</p>
                <p class="stat-number accent">${s.approvedLeave || 0}</p>
                <p style="font-size:0.8125rem;color:#93939f;margin-top:10px;font-family:'Inter',sans-serif;">This period</p>
              </div>
              <div class="c-card anim-up" style="padding:28px; background: #fafafa; border: 1px dashed #c9a236;">
                <p class="t-label" style="margin-bottom:12px;">Admin Actions</p>
                <button class="btn-solid w-full !py-2 text-[10px]" onclick="navigate('employees')">Directory</button>
              </div>
          </div>
          ` : ""}

          <!-- Distribution grid (Non-Employee Only) -->
          ${
            !isEmp
              ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;" class="anim-stagger">
            ${renderDistHtml("Departments", s.departments || [], "dept")}
            ${renderDistHtml("Positions", s.positions || [], "pos")}
          </div>`
              : ""
          }

          <!-- Bottom information section -->
          <div style="display:grid;grid-template-columns:${isEmp ? "1fr" : "1.4fr 1fr"};gap:18px;">
            <div style="display:flex;flex-direction:column;gap:18px;">
              ${
                !isEmp
                  ? `
                <div class="hero-band anim-up" style="margin:0;">
                  <div style="position:relative;z-index:1;">
                    <p class="t-micro" style="color:rgba(255,255,255,0.55);margin-bottom:14px;">HRIS INTELLIGENCE</p>
                    <h2 style="font-family:'DM Serif Display',serif;font-size:2rem;line-height:1.1;letter-spacing:-0.04em;color:#fff;margin-bottom:18px;max-width:520px;">
                      People operations, streamlined for your entire organization.
                    </h2>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                      <span class="status-pill" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);">5-Tier RBAC</span>
                      <span class="status-pill" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);">SHA-256 Secured</span>
                      <span class="status-pill" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);">Google Sheets DB</span>
                    </div>
                  </div>
                </div>`
                  : ""
              }
            </div>

            <!-- Employee Clock-in + Session -->
            <div style="display:flex;flex-direction:column;gap:18px;">
              ${
                isEmp
                  ? `
              <div class="c-card anim-up" style="padding:28px;">
                <p class="t-label" style="margin-bottom:16px;">Time Tracking</p>
                <div style="display:flex;gap:10px;">
                  <button class="btn-solid btn-sm" onclick="doClock('in')" style="flex:1;text-align:center;font-size:0.875rem;">Clock In</button>
                  <button class="btn-outline btn-sm" onclick="doClock('out')" style="flex:1;text-align:center;font-size:0.875rem;">Clock Out</button>
                </div>
                <div id="attendance-clock-result" style="margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:#93939f;"></div>
              </div>`
                  : ""
              }

              ${isEmp ? `
              <div class="c-card-em anim-up p-8 group hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden" onclick="navigate('talent')">
                <div class="absolute top-0 right-0 p-2 opacity-10">
                   <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <div class="relative z-10">
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-1.5 h-6 bg-[#c9a236] rounded-full"></div>
                    <span class="text-[11px] font-black uppercase tracking-[0.2em] text-[#1c1707]">Growth Intelligence</span>
                  </div>
                  <div class="flex items-center justify-between mb-6">
                    <div>
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Corporate Status</p>
                      <h4 class="text-xl font-serif text-[#c9a236]">${s.talent?.summitLevel || 'Developing'}</h4>
                    </div>
                    <div class="text-right">
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">OKR Progress</p>
                      <p class="text-xl font-serif text-[#1c1707]">${s.talent?.okrSummary?.avgProgress || 0}%</p>
                    </div>
                  </div>
                  <div class="w-full h-1.5 bg-[#faf6eb] rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-[#c9a236] to-[#eec045] transition-all duration-1000" style="width: ${s.talent?.okrSummary?.avgProgress || 0}%"></div>
                  </div>
                  <p class="text-[9px] text-gray-400 mt-4 uppercase tracking-[0.1em]">Targeting ${s.talent?.summitLevel === 'Elite' ? 'Zenith' : 'Next Level'} status / ${s.talent?.okrSummary?.activeCount || 0} active tracks</p>
                </div>
              </div>` : `
              <div class="c-card anim-up" style="padding:28px;">
                <p class="t-label" style="margin-bottom:16px;">Session Info</p>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="display:flex;justify-content:space-between;">
                    <span style="font-size:0.8125rem;color:#93939f;font-family:'Inter',sans-serif;">Employee ID</span>
                    <span style="font-family:'IBM Plex Mono',monospace;font-size:0.8125rem;color:#000;">${App.user.employeeNo}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.8125rem;color:#93939f;font-family:'Inter',sans-serif;">Access Level</span>
                    <span class="status-pill active" style="background:#fef3c7;color:#c9a236;border-color:#fef3c7;">${App.user.role}</span>
                  </div>
                </div>
              </div>`}
            </div>
          </div>
        `);
      })
      .getDashboardStats(App.user);
  }

  /**
   * Renders the announcement ticker at the top of the dashboard (Diamond Carousel)
   */
  let currentAnnIndex = 0;
  function renderAnnouncementsTicker(announcements, isAdmin) {
    if (!announcements || announcements.length === 0) {
      return isAdmin
        ? `
        <div class="mb-10 p-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center anim-up">
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </div>
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">No active broadcasts</p>
          <button class="btn-solid !py-3 !px-8 text-xs font-bold" onclick="openPostAnnouncementModal()">+ New Announcement</button>
        </div>
      `
        : "";
    }

    currentAnnIndex = 0; // Reset
    const total = announcements.length;

    return `
      <div id="ann-carousel" class="mb-10 relative group anim-up" data-total="${total}">
        <!-- Navigation Controls (High Fidelity) -->
        ${
          total > 1
            ? `
          <div class="absolute -left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="changeAnnouncement(-1)" class="w-10 h-10 rounded-xl bg-white shadow-xl flex items-center justify-center text-[#c9a236] hover:bg-[#c9a236] hover:text-white transition-all border border-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
          </div>
          <div class="absolute -right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="changeAnnouncement(1)" class="w-10 h-10 rounded-xl bg-white shadow-xl flex items-center justify-center text-[#c9a236] hover:bg-[#c9a236] hover:text-white transition-all border border-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        `
            : ""
        }

        <div class="relative overflow-hidden rounded-[2rem] shadow-premium">
          ${announcements
            .map((ann, idx) => {
              const isEmerg = ann.category === "Emergency";
              const isHigh = ann.priority === "High";
              return `
              <div id="ann-slide-${idx}" class="ann-slide transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${idx === 0 ? "opacity-100 relative translate-x-0" : "opacity-0 absolute inset-0 translate-x-full pointer-events-none"}">
                <div class="absolute -inset-1 bg-gradient-to-r ${isEmerg ? "from-red-500/10 to-orange-500/10" : "from-[#c9a236]/10 to-[#fef3c7]/10"} blur-xl opacity-25"></div>
                <div class="relative flex flex-col md:flex-row items-center gap-8 p-10 lg:p-12 ${isEmerg ? "bg-gradient-to-br from-[#450a0a] to-[#7f1d1d]" : "bg-gradient-to-br from-[#1c1707] to-[#3a3116]"} backdrop-blur-xl border ${isEmerg ? "border-red-900/40" : "border-[#c9a236]/30"} rounded-[2rem] shimmer-sweep shadow-2xl">
                  
                  <!-- Impact Icon (Diamond Gold) -->
                  <div class="w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-[#c9a236] shadow-[0_0_20px_rgba(201,162,54,0.3)] transform ${idx === 0 ? "rotate-6" : ""} group-hover:rotate-6 transition-transform duration-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="${isEmerg ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"}"/>
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0 text-center md:text-left">
                    <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                      <span class="px-3 py-1 rounded-full ${isHigh ? "bg-red-600 text-white animate-pulse" : isEmerg ? "bg-white/10 text-red-100 border border-white/20" : "bg-[#c9a236]/20 text-[#c9a236] border border-[#c9a236]/30"} text-[10px] font-black uppercase tracking-widest">
                        ${ann.category.toUpperCase()}
                      </span>
                      <span class="text-[10px] text-white/40 font-mono italic">
                        Broadcast ${idx + 1}/${total} &bull; ${ann.timestamp ? new Date(ann.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Recent"}
                      </span>
                    </div>
                    <h2 class="text-2xl font-black text-white mb-3 leading-tight tracking-tight">${ann.title || "Untitled Announcement"}</h2>
                    <div class="text-[13px] text-white/70 leading-relaxed line-clamp-2 font-medium" style="white-space: pre-wrap;">${ann.message || "No content provided."}</div>
                  </div>

                  <div class="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                    <div class="flex items-center gap-2 mb-2 justify-center md:justify-end">
                      ${
                        isAdmin
                          ? `
                        <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 text-gray-500 hover:bg-white hover:text-[#c9a236] transition-all shadow-sm" onclick="openEditAnnouncementModal('${ann.id}')" title="Edit Announcement">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm" onclick="handleRemoveAnnouncement('${ann.id}')" title="Remove Announcement">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      `
                          : ""
                      }
                    </div>
                    ${
                      isAdmin
                        ? `
                      <button class="btn-solid !py-3 !px-8 text-xs font-bold whitespace-nowrap shadow-xl" onclick="openPostAnnouncementModal()">
                        + New Announcement
                      </button>
                    `
                        : `
                      <button class="btn-glass !py-3 !px-8 text-xs font-bold whitespace-nowrap" onclick="viewAnnouncementDetail('${ann.id}')">
                        Read More
                      </button>
                    `
                    }
                  </div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <!-- Progress Indicators -->
        ${
          total > 1
            ? `
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            ${announcements
              .map(
                (_, i) => `
              <div id="ann-dot-${i}" class="w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === 0 ? "bg-[#c9a236] w-4" : "bg-gray-200"}"></div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  function viewAnnouncementDetail(id) {
    const data = App.directoryState.dashboardData;
    if (!data || !data.announcements) return;

    const ann = data.announcements.find(a => a.id === id);
    if (!ann) return;

    document.getElementById("view-ann-title").innerText = ann.title;
    document.getElementById("view-ann-message").innerText = ann.message;
    document.getElementById("view-ann-category-pill").innerText = (ann.category || "UPDATE").toUpperCase();

    openModal("view-announcement-modal");
  }

  /**
   * Checks for high-priority emergency popups
   */
  function checkEmergencyPopups(announcements) {
    if (!announcements || announcements.length === 0) return;

    // Check if most recent is a high-priority emergency
    const latest = announcements[0];
    if (latest.category === "Emergency" && latest.priority === "High") {
      const storageKey = "last_emerg_ack_" + latest.id;
      if (!localStorage.getItem(storageKey)) {
        setTimeout(() => {
          document.getElementById("emergency-title").innerText =
            latest.title.toUpperCase();
          document.getElementById("emergency-message").innerText =
            latest.message;
          document.getElementById("emergency-popup-modal").style.display =
            "flex";

          // Auto-mark as read for this session/device
          localStorage.setItem(storageKey, "true");
        }, 800);
      }
    }
  }

  /**
   * Admin: Announcement Creation
   */
  function openPostAnnouncementModal() {
    document.getElementById("ann-id").value = "";
    document.getElementById("ann-title").value = "";
    document.getElementById("ann-message").value = "";
    document.getElementById("ann-category").value = "Update";
    document.getElementById("ann-priority").value = "Normal";

    const modalTitle = document.querySelector("#post-announcement-modal .t-h2");
    if (modalTitle) modalTitle.innerText = "New Announcement";

    openModal("post-announcement-modal");
  }

  function openEditAnnouncementModal(annId) {
    // We need to find the data in our current state
    // For simplicity, we'll fetch details from the dashboard data already stored in global space or scoped
    // Accessing through the ticker logic's parent data s.announcements
    if (
      !App.directoryState.dashboardData ||
      !App.directoryState.dashboardData.announcements
    )
      return;

    const item = App.directoryState.dashboardData.announcements.find(
      (a) => a.id === annId,
    );
    if (!item) return;

    document.getElementById("ann-id").value = item.id;
    document.getElementById("ann-id").value = item.id;
    document.getElementById("ann-title").value = item.title;
    document.getElementById("ann-message").value = item.message;
    document.getElementById("ann-category").value = item.category;
    document.getElementById("ann-priority").value = item.priority;

    const modalTitle = document.querySelector("#post-announcement-modal .t-h2");
    if (modalTitle) modalTitle.innerText = "Edit Announcement";

    openModal("post-announcement-modal");
  }

  function handleRemoveAnnouncement(annId) {
    if (
      !confirm("Are you sure you want to remove this announcement permanently?")
    )
      return;

    setLoading("spinner");
    google.script.run
      .withSuccessHandler((resp) => {
        setLoading(false);
        if (resp.success) {
          showToast("Announcement removed", "success");
          loadDashboard();
        } else {
          showToast(resp.message, "error");
        }
      })
      .deleteAnnouncement(annId, App.user.employeeNo);
  }

  function changeAnnouncement(delta) {
    const total = parseInt(
      document.getElementById("ann-carousel").dataset.total,
    );
    const newIndex = (currentAnnIndex + delta + total) % total;

    // Hide current
    const currentSlide = document.getElementById(
      `ann-slide-${currentAnnIndex}`,
    );
    const currentDot = document.getElementById(`ann-dot-${currentAnnIndex}`);
    if (currentSlide) {
      currentSlide.classList.remove("opacity-100", "relative", "translate-x-0");
      currentSlide.classList.add(
        "opacity-0",
        "absolute",
        "inset-0",
        "translate-x-full",
        "pointer-events-none",
      );
    }
    if (currentDot) {
      currentDot.classList.remove("bg-[#c9a236]", "w-4");
      currentDot.classList.add("bg-gray-200");
    }

    // Show new
    currentAnnIndex = newIndex;
    const nextSlide = document.getElementById(`ann-slide-${currentAnnIndex}`);
    const nextDot = document.getElementById(`ann-dot-${currentAnnIndex}`);
    if (nextSlide) {
      nextSlide.classList.remove(
        "opacity-0",
        "absolute",
        "inset-0",
        "translate-x-full",
        "pointer-events-none",
      );
      nextSlide.classList.add("opacity-100", "relative", "translate-x-0");
    }
    if (nextDot) {
      nextDot.classList.remove("bg-gray-200");
      nextDot.classList.add("bg-[#c9a236]", "w-4");
    }
  }

  function submitAnnouncement() {
    const id = document.getElementById("ann-id").value;
    const title = document.getElementById("ann-title").value.trim();
    const msg = document.getElementById("ann-message").value.trim();
    const cat = document.getElementById("ann-category").value;
    const prio = document.getElementById("ann-priority").value;

    if (!title || !msg) {
      showToast("Title and Message are required", "error");
      return;
    }

    setModalLoading("post-announcement-modal", true);
    google.script.run
      .withSuccessHandler((resp) => {
        setModalLoading("post-announcement-modal", false);
        if (resp.success) {
          showToast(id ? "Update modified" : "Update published", "success");
          closeModal("post-announcement-modal");
          // Allow Spreadsheet buffer to settle
          setTimeout(() => {
            loadDashboard();
          }, 400);
        } else {
          showToast(resp.message || "Failed to publish", "error");
        }
      })
      .withFailureHandler((err) => {
        setModalLoading("post-announcement-modal", false);
        showToast("System error: " + err.message, "error");
      })
      .saveAnnouncement({
        id,
        title,
        message: msg,
        category: cat,
        priority: prio,
        userNo: App.user.employeeNo, // Transmit current identity for verification
      });
  }

  /* ── PAGE: Directory ─────────────────────────────────────────── */
  async function loadDirectory(searchQuery, page) {
    setLoading("skeleton");
    showProgress(30);

    // 1. Fetch Fresh Metadata (for Filters)
    const freshMeta = await new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(() => resolve({ success: false }))
        .getOnboardingData();
    });
    if (freshMeta.success) App.directoryState.meta = freshMeta;

    const { filters, sort, meta } = App.directoryState;
    const depts = meta ? meta.departments : [];

    google.script.run
      .withSuccessHandler((resp) => {
        if (App.currentView !== "directory") return;
        showProgress(100);

        const isAdm = ["SUPERADMIN", "ADMIN", "HR"].includes(
          (App.user.role || "").toUpperCase(),
        );

        if (!resp.success) {
          setPageBody(renderError("Directory Sync Failed", resp.message));
          return;
        }

        const employees = resp.employees || [];
        const total = resp.total || 0;
        const curPage = resp.page || 1;
        const perPage = resp.perPage || 20;
        const pages = Math.ceil(total / perPage);

        const shell = `
          <div class="mb-12 anim-up">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
              <div>
                <h1 class="text-4xl font-serif text-[#1c1707] mb-2">Talent Directory</h1>
                <p class="text-[11px] text-[#c9a236] font-bold uppercase tracking-[0.3em]">Central Registry & Intelligence</p>
              </div>
              <div class="flex items-center gap-3">
                 ${["SUPERADMIN", "ADMIN", "HR"].includes((App.user.role || "").toUpperCase()) ? `<button class="btn-solid btn-sm" onclick="openAddEmployeeModal()">+ Add Employee</button>` : ""}
              </div>
            </div>

            <!-- FILTER & SORT BAR -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 p-6 bg-white rounded-3xl border border-[#f2f2f7] shadow-sm">
              <div class="lg:col-span-4 relative">
                <input type="text" id="dir-search" class="c-input w-full pl-10" placeholder="Search by name or ID..." value="${searchQuery || ""}" 
                       onkeydown="if(event.key==='Enter') applyDirControls()">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <div class="lg:col-span-3">
                <select id="dir-filter-dept" class="c-input w-full text-xs font-bold" onchange="applyDirControls()">
                  <option value="">All Departments</option>
                  ${depts.map((d) => `<option value="${d}" ${filters.department === d ? "selected" : ""}>${d}</option>`).join("")}
                </select>
              </div>
              <div class="lg:col-span-3">
                <select id="dir-sort" class="c-input w-full text-xs font-bold" onchange="applyDirControls()">
                  <option value="name_asc" ${sort === "name_asc" ? "selected" : ""}>Name (A-Z)</option>
                  <option value="name_desc" ${sort === "name_desc" ? "selected" : ""}>Name (Z-A)</option>
                  <option value="dept_asc" ${sort === "dept_asc" ? "selected" : ""}>By Department</option>
                  <option value="date_desc" ${sort === "date_desc" ? "selected" : ""}>Newest First</option>
                  <option value="date_asc" ${sort === "date_asc" ? "selected" : ""}>Oldest First</option>
                </select>
              </div>
              <div class="lg:col-span-2 flex items-center gap-2">
                <button class="btn-solid w-full !py-3.5 !rounded-xl" onclick="applyDirControls()">Apply</button>
                <button class="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all" onclick="resetDirControls()">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
              </div>
            </div>

            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-6 px-2">${total} Professionals identified</p>

            <div class="bg-white rounded-3xl border border-[#f2f2f7] overflow-hidden shadow-sm">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-[#fbfbfb] border-b border-[#f2f2f7]">
                      <th class="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Professional</th>
                      <th class="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</th>
                      <th class="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Position</th>
                      <th class="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                      <th class="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Seniority</th>
                      ${isAdm ? '<th class="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>' : ""}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#f2f2f7]">
                    ${
                      employees.length
                        ? employees
                            .map(
                              (e) => `
                      <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="openEditProfile('${e.employeeNo}')">
                        <td class="px-8 py-5">
                          <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-[#c9a236]/10 text-[#c9a236] flex items-center justify-center font-bold text-xs uppercase">
                              ${e.firstName[0]}${e.lastName[0]}
                            </div>
                            <div>
                              <div class="flex items-center gap-1.5">
                                <p class="text-sm font-bold text-[#1c1707]">${e.fullName || "—"}</p>
                                ${
                                  e.isIncomplete
                                    ? `<span class="flex shrink-0 w-3.5 h-3.5 items-center justify-center rounded-full bg-[#c9a236]/10 text-[#c9a236]" title="Incomplete Profile Details">
                                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                </span>`
                                    : ""
                                }
                              </div>
                              <p class="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">${e.employeeNo}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-8 py-5 text-sm text-gray-600 font-medium">${e.department || "—"}</td>
                        <td class="px-8 py-5 text-sm text-gray-500">${e.position || "—"}</td>
                        <td class="px-8 py-5">
                          <span class="status-pill ${(e.status || "").toLowerCase().replace(/\s+/g, "-")}">${e.status || "—"}</span>
                        </td>
                        <td class="px-8 py-5 text-[11px] font-black text-gray-400 font-mono uppercase">${e.startDate || "—"}</td>
                        ${
                          isAdm
                            ? `
                          <td class="px-8 py-5 text-right">
                            <div class="flex items-center justify-end gap-2">
                              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-[#c9a236]/10 hover:text-[#c9a236] transition-all" onclick="event.stopPropagation(); openEditProfile('${e.employeeNo}')" title="Edit Profile">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                            </div>
                          </td>
                        `
                            : ""
                        }
                      </tr>
                    `,
                            )
                            .join("")
                        : '<tr><td colspan="5" class="py-20 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">No personnel matches found</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Pagination -->
            ${
              pages > 1
                ? `
            <div class="flex items-center justify-between mt-10">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 px-2">Page ${curPage} of ${pages}</p>
              <div class="flex items-center justify-center gap-4">
                ${curPage > 1 ? `<button class="p-3 rounded-xl bg-white border border-[#f2f2f7] hover:bg-gray-50 transition-all" onclick="loadDirectory('${searchQuery || ""}',${curPage - 1})"><svg class="w-5 h-5 text-[#c9a236]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>` : ""}
                ${curPage < pages ? `<button class="p-3 rounded-xl bg-white border border-[#f2f2f7] hover:bg-gray-50 transition-all" onclick="loadDirectory('${searchQuery || ""}',${curPage + 1})"><svg class="w-5 h-5 text-[#c9a236]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>` : ""}
              </div>
            </div>`
                : ""
            }
          </div>
        `;
        setPageBody(shell);
      })
      .getDirectory(App.user, searchQuery || "", page || 1, filters, sort);
  }

  function applyDirControls() {
    const search = document.getElementById("dir-search").value;
    App.directoryState.filters = {
      department: document.getElementById("dir-filter-dept").value,
    };
    App.directoryState.sort = document.getElementById("dir-sort").value;
    loadDirectory(search, 1);
  }

  function resetDirControls() {
    App.directoryState.filters = {};
    App.directoryState.sort = "name_asc";
    loadDirectory("", 1);
  }

  /**
   * Enhanced Server Caller with Promise & Failure Handling
   */
  async function callServer(fnName, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((err) => {
          console.error(`Server Error [${fnName}]:`, err);
          showToast(`Server Error: ${err.message}`, "error");
          reject(err);
        })
        [fnName](...args);
    });
  }

  async function openAddEmployeeModal() {
    showToast("Opening onboarding form...", "info");

    // Safety Race: 8 second timeout or server response
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 8000),
    );

    try {
      const resp = await Promise.race([
        callServer("getOnboardingData"),
        timeout,
      ]).catch((err) => ({
        success: true,
        nextId: "ZK-NEW",
        departments: [],
        positions: [],
      }));

      renderProfileModal(false, { "Employee No.": resp.nextId }, "", resp);
    } catch (e) {
      // Emergency Fallback
      renderProfileModal(false, { "Employee No.": "ZK-NEW" }, "", {
        departments: [],
        positions: [],
      });
    }
  }

  async function openEditProfile(empNo) {
    showToast("Opening profile...", "info");
    try {
      const [resp, meta] = await Promise.all([
        callServer("getEmployeeProfile", empNo),
        callServer("getOnboardingData").catch(() => ({
          success: true,
          departments: [],
          positions: [],
        })),
      ]);

      if (resp && resp.success) {
        renderProfileModal(true, resp.data, empNo, meta);
        // Deep link to security if requested
        if (App.directoryState.deepLinkTab) {
          switchTab(App.directoryState.deepLinkTab);
          App.directoryState.deepLinkTab = null; 
        }
      } else {
        const msg = resp
          ? resp.message
          : "The server returned an empty profile response. Please try again.";
        showToast(msg, "error");
      }
    } catch (e) {
      console.error("OpenEditProfile System Crash:", e);
      showToast(`Interface Crash: ${e.message}`, "error");
    }
  }

  /* ── Profile Editor Modal ────────────────────────────────────── */

  function switchTab(tabId) {
    document
      .querySelectorAll(".profile-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".profile-tab-content")
      .forEach((c) => c.classList.remove("active"));

    document
      .querySelector(`.profile-tab[onclick="switchTab('${tabId}')"]`)
      .classList.add("active");
    document.getElementById(tabId).classList.add("active");
  }

  function renderProfileModal(isEdit, p, empNo = "", metaArg = {}) {
    // 1. Cleanup existing modals if any
    document.getElementById("add-employee-modal")?.remove();
    document.getElementById("edit-profile-modal")?.remove();

    const meta = { departments: [], positions: [], ...metaArg };

    // Safety Date Formatter
    const fmtDate = (d) => {
      try {
        if (!d) return "";
        const date = new Date(d);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0];
      } catch (e) {
        return "";
      }
    };
    const statusMsgHTML = isEdit 
      ? '<p class="text-[9px] text-[#c9a236] mt-2 font-bold">* Access to system credentials is restricted to Administrative personnel. All audits are logged.</p>' 
      : '<p class="text-[9px] text-slate-400 mt-2">* User will be prompted to change their password on first login.</p>';

    const submitBtnText = isEdit ? "Save Changes" : "Add to Directory";
    const submitBtnID = isEdit ? "save-profile-btn" : "add-emp-btn";
    const formID = isEdit ? "edit-profile-form" : "add-employee-form";
    const modalID = isEdit ? "edit-profile-modal" : "add-employee-modal";
    const formSubmitAction = isEdit ? `submitEditProfile('${empNo}')` : "submitAddEmployee()";
    
    const archiveBtnHTML = (isEdit && (App.user.role || "").toUpperCase() === "SUPERADMIN") 
      ? `<button type="button" class="btn-outline" style="color:#dc2626; border-color:#fca5a5; background:#fff;" onclick="archiveEmployeeClient('${empNo}')">Archive</button>`
      : "";

    modal.id = modalID;
    modal.className = "modal-overlay";

    // Create Datalists for Org Data
    const deptOptions = (meta.departments || [])
      .map((d) => `<option value="${d}">`)
      .join("");
    const posOptions = (meta.positions || [])
      .map((p) => `<option value="${p}">`)
      .join("");

    // Pre-computed Sub-elements for Parsing Safety
    const credentialHTML = isEdit ? `
      <div class="relative">
        <input type="password" id="admin-pw-view" name="password" class="c-input !pr-10" value="${p.password || ""}" style="background:white;" placeholder="Enter new password to override...">
        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100" onclick="togglePasswordVisibility('admin-pw-view', this)">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </div>` : `<input type="text" name="initialPassword" class="c-input" placeholder="e.g. Welcome2024!" style="background:white;">`;

    const roleHTML = `
      <select name="role" class="c-input" style="background:white;">
        <option value="EMPLOYEE" ${p.role === "EMPLOYEE" ? "selected" : ""}>Employee</option>
        <option value="MANAGER" ${p.role === "MANAGER" ? "selected" : ""}>Manager</option>
        <option value="HR" ${p.role === "HR" ? "selected" : ""}>HR Business Partner</option>
        <option value="ADMIN" ${p.role === "ADMIN" ? "selected" : ""}>Administrator</option>
        <option value="SUPERADMIN" ${p.role === "SUPERADMIN" ? "selected" : ""}>Super Admin</option>
      </select>`;

    // Total Logic Decoupling for Pre-processor Safety
    const optStatus = ["Probationary", "Active", "On Leave", "Resigned", "Inactive"]
      .map(s => `<option ${p.Status === s ? "selected" : ""}>${s}</option>`).join("");
    
    const optGender = `<option ${p.Gender === "Male" ? "selected" : ""}>Male</option><option ${p.Gender === "Female" ? "selected" : ""}>Female</option>`;
    
    const empNoVal = p["Employee No."] || "";
    const empNoLabelHTML = !isEdit ? '<span class="text-[9px] bg-blue-50 text-blue-600 px-1.5 rounded">Auto-generated</span>' : "";
    const empNoStyle = isEdit ? 'disabled style="background:#f9f9f9"' : "";
    const firstName = p["First Name"] || "";
    const lastName = p["Last Name"] || "";
    const middleName = p["Middle Name"] || "";
    const companyName = p.Company || "";
    const remarksVal = p.Remarks || "";
    const deptName = p.Department || "";
    const posName = p.Position || "";
    const newPosName = p["New Position"] || "";
    const startDate = fmtDate(p["Start Date"]);
    const promoDate = fmtDate(p["Promotion Start Date"]);
    const workAssign = p["Work Assignment"] || "";
    const clearanceVal = p.Clearance || "";
    const sepDate1 = fmtDate(p["1st Separation Date (Rehired)"]);
    const sepDate2 = fmtDate(p["Separation Date"]);
    const offerLetter = p["Offer Letter"] || "";
    const perfEval = p["Performance Evaluation"] || "";
    const probCont = p["Probationary Contract"] || "";
    const regCont = p["Regular Contract"] || "";
    const birthDate = fmtDate(p.Birthdate);
    const civilStatus = p["Civil Status"] || "";
    const mobileNo = p["Mobile No."] || "";
    const emailAddr = p["Email Address"] || "";
    const updatedEmail = p["Updated Email Address"] || "";
    const addrVal = p["Complete Address"] || "";
    const sssNo = p["SSS No."] || "";
    const tinNo = p["TIN No."] || "";
    const phNo = p["Philhealth No."] || "";
    const pagNo = p["Pag-ibig No."] || "";
    const contactPerson = p["Emergency Contact Person"] || "";
    const contactNo = p["Emergency Contact No."] || "";
    const sysDate = fmtDate(p["Current Date"]);
    const ageVal = p.Age || "";
    const monthsVal = p["No. of Months"] || "";
    const yearsVal = p["No. of Years"] || "";
    const photoSrc = p["Profile Photo"] || 'https://raw.githubusercontent.com/guillaumebarbier/lucide-static/master/icons/user.svg';

    modal.innerHTML = `
      <datalist id="dept-suggestions">${deptOptions}</datalist>
      <datalist id="pos-suggestions">${posOptions}</datalist>
      <div class="modal-content" style="max-width:850px; height:90vh; display:flex; flex-direction:column; padding:0; overflow:hidden;">
        <!-- Header -->
        <div style="padding:32px 40px; border-bottom:1px solid #f2f2f7; display:flex; justify-content:between; align-items:center;">
          <div>
            <h2 class="t-h2">${submitBtnText} Profile</h2>
            <p class="t-micro" style="color:#93939f;">${empNoVal || "New Entry"}</p>
          </div>
          <button id="modal-close-btn" class="btn-ghost btn-sm" style="margin-left:auto;">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="padding:0 40px; background:#fafafa;">
          <div class="profile-tabs" style="margin-bottom:0; border-bottom:0;">
            <div class="profile-tab active" data-tab="tab-general">General</div>
            <div class="profile-tab" data-tab="tab-employment">Employment</div>
            <div class="profile-tab" data-tab="tab-contracts">Contracts</div>
            <div class="profile-tab" data-tab="tab-personal">Personal</div>
            <div class="profile-tab" data-tab="tab-government">Gov & Emergency</div>
            <div class="profile-tab" data-tab="tab-stats">Stats</div>
          </div>
        </div>

        <!-- Scrollable Form -->
        <form id="${formID}" style="flex:1; overflow-y:auto; padding:32px 40px;">
          
          <!-- Tab: General -->
          <div id="tab-general" class="profile-tab-content active">
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
               <div>
                  <label class="t-label-alt flex items-center gap-2">Employee No. ${empNoLabelHTML}</label>
                  <input type="text" name="Employee No." class="c-input" value="${empNoVal}" ${empNoStyle} placeholder="e.g. ZK-0001">
               </div>
               <div><label class="t-label-alt">First Name</label><input type="text" name="First Name" class="c-input" value="${firstName}" required></div>
               <div><label class="t-label-alt">Last Name</label><input type="text" name="Last Name" class="c-input" value="${lastName}" required></div>
               <div style="grid-column: span 2; display: flex; align-items: center; gap: 24px; padding: 24px; background: #fafafc; border-radius: 16px; margin-bottom: 12px; border: 1px solid #f2f2f7;">
                 <div id="modal-photo-trigger" class="relative group cursor-pointer">
                    <img id="modal-photo-preview" src="${photoSrc}" class="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md bg-white">
                    <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    </div>
                 </div>
                 <div class="flex-1">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Identity Asset</p>
                    <p class="text-[11px] text-slate-600 mb-3">Upload high-fidelity photo for ID card and directory.</p>
                    <input type="file" id="modal-photo-input" accept="image/*" class="hidden">
                    <button type="button" id="modal-photo-btn" class="btn-outline !py-1.5 !px-4 text-[10px]">Choose File</button>
                    <input type="hidden" name="profilePhotoBase64" id="modal-photo-base64">
                 </div>
               </div>

               <div><label class="t-label-alt">Middle Name</label><input type="text" name="Middle Name" class="c-input" value="${middleName}"></div>
               
               <div style="grid-column: span 2; padding: 16px; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 12px; margin-top: 8px;">
                 <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System Access & Security</p>
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                      <label class="t-label-alt">${isEdit ? "System Credentials" : "Initial Password"}</label>
                      ${credentialHTML}
                    </div>
                    <div>
                      <label class="t-label-alt">${isEdit ? "Change Role" : "Assign Role"}</label>
                      ${roleHTML}
                    </div>
                 </div>
                 ${statusMsgHTML}
               </div>

               <div><label class="t-label-alt">Status</label>
                  <select name="Status" class="c-input">
                    ${optStatus}
                  </select>
               </div>
               <div><label class="t-label-alt">Company</label><input type="text" name="Company" class="c-input" value="${companyName}"></div>
               <div style="grid-column: span 2;"><label class="t-label-alt">Remarks</label><textarea name="Remarks" class="c-input" rows="2">${remarksVal}</textarea></div>
             </div>
          </div>

          <!-- Tab: Employment -->
          <div id="tab-employment" class="profile-tab-content">
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
               <div>
                  <label class="t-label-alt flex items-center gap-2">Department <span class="text-[9px] text-[#c9a236]/60">Suggestions Enabled</span></label>
                  <input type="text" name="Department" class="c-input" value="${deptName}" list="dept-suggestions" placeholder="Select or type new...">
               </div>
               <div>
                  <label class="t-label-alt flex items-center gap-2">Position <span class="text-[9px] text-[#c9a236]/60">Suggestions Enabled</span></label>
                  <input type="text" name="Position" class="c-input" value="${posName}" list="pos-suggestions" placeholder="Select or type new...">
               </div>
               <div><label class="t-label-alt">New Position</label><input type="text" name="New Position" class="c-input" value="${newPosName}" list="pos-suggestions"></div>
               <div><label class="t-label-alt">Start Date</label><input type="date" name="Start Date" class="c-input" value="${startDate}"></div>
               <div><label class="t-label-alt">Promotion Start Date</label><input type="date" name="Promotion Start Date" class="c-input" value="${promoDate}"></div>
               <div><label class="t-label-alt">Work Assignment</label><input type="text" name="Work Assignment" class="c-input" value="${workAssign}"></div>
               <div><label class="t-label-alt">Clearance</label><input type="text" name="Clearance" class="c-input" value="${clearanceVal}"></div>
               <div><label class="t-label-alt">1st Separation Date</label><input type="date" name="1st Separation Date (Rehired)" class="c-input" value="${sepDate1}"></div>
               <div><label class="t-label-alt">Separation Date</label><input type="date" name="Separation Date" class="c-input" value="${sepDate2}"></div>
             </div>
          </div>

          <!-- Tab: Contracts -->
          <div id="tab-contracts" class="profile-tab-content">
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
               <div><label class="t-label-alt">Offer Letter</label><input type="text" name="Offer Letter" class="c-input" value="${offerLetter}" placeholder="e.g. Signed"></div>
               <div><label class="t-label-alt">Performance Evaluation</label><input type="text" name="Performance Evaluation" class="c-input" value="${perfEval}"></div>
               <div><label class="t-label-alt">Probationary Contract</label><input type="text" name="Probationary Contract" class="c-input" value="${probCont}"></div>
               <div><label class="t-label-alt">Regular Contract</label><input type="text" name="Regular Contract" class="c-input" value="${regCont}"></div>
             </div>
          </div>

          <!-- Tab: Personal -->
          <div id="tab-personal" class="profile-tab-content">
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
               <div><label class="t-label-alt">Birthdate</label><input type="date" name="Birthdate" class="c-input" value="${birthDate}"></div>
               <div><label class="t-label-alt">Gender</label>
                  <select name="Gender" class="c-input">
                    ${optGender}
                  </select>
               </div>
               <div><label class="t-label-alt">Civil Status</label><input type="text" name="Civil Status" class="c-input" value="${civilStatus}"></div>
               <div><label class="t-label-alt">Mobile No.</label><input type="text" name="Mobile No." class="c-input" value="${mobileNo}"></div>
               <div><label class="t-label-alt">Email Address</label><input type="email" name="Email Address" class="c-input" value="${emailAddr}"></div>
               <div><label class="t-label-alt">Updated Email</label><input type="email" name="Updated Email Address" class="c-input" value="${updatedEmail}"></div>
               <div style="grid-column: span 2;"><label class="t-label-alt">Complete Address</label><textarea name="Complete Address" class="c-input" rows="2">${addrVal}</textarea></div>
             </div>
          </div>

          <!-- Tab: Gov -->
          <div id="tab-government" class="profile-tab-content">
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
               <div><label class="t-label-alt">SSS No.</label><input type="text" name="SSS No." class="c-input" value="${sssNo}"></div>
               <div><label class="t-label-alt">TIN No.</label><input type="text" name="TIN No." class="c-input" value="${tinNo}"></div>
               <div><label class="t-label-alt">Philhealth No.</label><input type="text" name="Philhealth No." class="c-input" value="${phNo}"></div>
               <div><label class="t-label-alt">Pag-ibig No.</label><input type="text" name="Pag-ibig No." class="c-input" value="${pagNo}"></div>
               <div style="grid-column: span 2; border-top: 1px solid #f2f2f7; margin-top: 12px; padding-top: 20px;"><label class="t-label" style="color:#1863dc">Emergency Contact</label></div>
               <div><label class="t-label-alt">Contact Person</label><input type="text" name="Emergency Contact Person" class="c-input" value="${contactPerson}"></div>
               <div><label class="t-label-alt">Contact No.</label><input type="text" name="Emergency Contact No." class="c-input" value="${contactNo}"></div>
             </div>
          </div>

          <!-- Tab: Stats -->
          <div id="tab-stats" class="profile-tab-content">
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
               <div><label class="t-label-alt">Current Date (System)</label><input type="text" class="c-input" value="${sysDate}" disabled style="background:#f9f9f9"></div>
               <div><label class="t-label-alt">Age</label><input type="text" class="c-input" value="${ageVal}" disabled style="background:#f9f9f9"></div>
               <div><label class="t-label-alt">No. of Months</label><input type="text" class="c-input" value="${monthsVal}" disabled style="background:#f9f9f9"></div>
               <div><label class="t-label-alt">No. of Years</label><input type="text" class="c-input" value="${yearsVal}" disabled style="background:#f9f9f9"></div>
             </div>
             <p class="t-micro" style="margin-top:20px; color:#93939f;">* These fields are auto-calculated in the spreadsheet based on Start Date and Birthdate.</p>
          </div>
        </form>

        <div id="modal-footer-actions" style="padding:24px 40px; background:#fafafa; border-top:1px solid #f2f2f7; display:flex; gap:16px;">
          <button id="modal-cancel-btn" type="button" class="btn-outline" style="flex:1;">Cancel</button>
          ${isEdit ? `<button id="modal-archive-btn" type="button" class="btn-solid !bg-red-500 hover:!bg-red-600" style="flex:1;">Archive</button>` : ""}
          <button id="modal-submit-btn" type="button" class="btn-solid" style="flex:2;">${submitBtnText} Entry</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Dynamic Hydration of Event Handlers
    const closeFn = () => {
       closeEditModal();
       document.getElementById('add-employee-modal')?.remove();
    };

    document.getElementById('modal-close-btn').onclick = closeFn;
    document.getElementById('modal-cancel-btn').onclick = closeFn;
    
    document.getElementById('modal-submit-btn').onclick = () => {
       if (isEdit) submitEditProfile(empNo);
       else submitAddEmployee();
    };

    // Tab switching hydration
    modal.querySelectorAll('.profile-tab').forEach(tab => {
       tab.onclick = () => switchTab(tab.getAttribute('data-tab'));
    });

    // Photo upload hydration
    const fileInput = document.getElementById('modal-photo-input');
    document.getElementById('modal-photo-trigger').onclick = () => fileInput.click();
    document.getElementById('modal-photo-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleModalPhotoPreview(e.target);

    if (isEdit) {
       document.getElementById('modal-archive-btn').onclick = () => archiveEmployeeClient(empNo);
    }

    modal.style.display = "flex";
  }
  function archiveEmployeeClient(empNo) {
    if (
      !confirm(
        `Are you SURE you want to archive ${empNo}?\n\nThis will move them from active records and IMMEDIATELY revoke their system access.`,
      )
    )
      return;

    setLoading("pulse");
    google.script.run
      .withSuccessHandler((resp) => {
        setLoading(false);
        if (resp.success) {
          showToast(resp.message);
          closeEditModal();
          loadDirectory();
        } else showToast(resp.message, "error");
      })
      .archiveEmployee(empNo);
  }

  function closeEditModal() {
    const m =
      document.getElementById("edit-profile-modal") ||
      document.getElementById("add-employee-modal");
    if (m) m.remove();
  }

  function handleModalPhotoPreview(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('modal-photo-preview').src = e.target.result;
        document.getElementById('modal-photo-base64').value = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  function submitAddEmployee() {
    const btn = document.getElementById("add-emp-btn");
    const form = document.getElementById("add-employee-form");
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => (payload[key] = value));

    setBtn(btn, true, "Adding...");
    google.script.run
      .withSuccessHandler((resp) => {
        setBtn(btn, false, "Add to Directory");
        if (resp.success) {
          closeEditModal();
          // High-Fidelity Provisioning Success Modal
          const successContent = `
            <div class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm anim-fade">
              <div class="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl anim-up border-whisper">
                <div class="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 class="text-2xl font-serif text-[#1c1707] text-center mb-2">Account Provisioned</h2>
                <p class="text-gray-400 text-center text-sm mb-8">${resp.message}</p>
                
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Temporary Password</p>
                  <div class="flex items-center justify-between">
                     <span class="text-lg font-mono font-bold text-slate-700 tracking-wider">${resp.tempPw || "Manual Entry"}</span>
                     <button onclick="copyToClipboard('${resp.tempPw}'); showToast('Copied to clipboard')" class="text-[#c9a236] hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"></path></svg>
                     </button>
                  </div>
                </div>

                <button class="btn-solid w-full !py-4 shadow-lg shadow-green-100" onclick="this.closest('.fixed').remove()">Done</button>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML("beforeend", successContent);

          if (App.currentView === "access") loadAccessControl();
          else loadDirectory();
        } else showToast(resp.message, "error");
      })
      .addEmployee(payload, App.user.employeeNo);
  }

  function submitEditProfile(empNo) {
    const btn = document.getElementById("save-profile-btn");
    const form = document.getElementById("edit-profile-form");
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    setBtn(btn, true, "Saving...");
    google.script.run
      .withSuccessHandler((resp) => {
        setBtn(btn, false, "Save Changes");
        if (resp.success) {
          showToast("Profile Updated Successfully");
          closeEditModal();
          loadDirectory(); // Refresh table
        } else {
          showToast(resp.message, "error");
        }
      })
      .updateEmployeeProfile(empNo, payload, App.user.employeeNo);
  }

  /* ── PAGE: Calendar ────────────────────────────────────────── */

  /**
   * Centralized Role Guard: Ensures isEmp/isMgr strings are always available across all views.
   */
  function getRoleState() {
    const role = App.user && App.user.role ? App.user.role.toUpperCase() : "";
    return {
      role,
      isEmp: role === "EMPLOYEE",
      isMgr: role === "MANAGER",
      isAdmin: ["ADMIN", "SUPERADMIN", "HR"].includes(role),
      isSuperAdmin: role === "SUPERADMIN",
    };
  }

  function renderCalendarShell() {
    return `
      <div class="view-header flex items-start justify-between">
        <div>
          <h1 class="t-h1 mb-1">Corporate Calendar</h1>
          <p class="text-[11px] font-mono text-white/40 uppercase tracking-widest">Events & Strategic Timeline</p>
        </div>
      </div>

      <div class="calendar-container mb-8">
        <div class="flex items-center justify-between p-6 bg-white border-b border-[#c9a236]/10">
          <div class="flex items-center gap-6">
            <button class="w-10 h-10 rounded-xl hover:bg-[#c9a236]/10 flex items-center justify-center transition-all border border-[#c9a236]/30 group" onclick="changeMonth(-1)">
              <svg class="w-5 h-5 text-[#c9a236]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 id="current-month" class="text-xl font-bold tracking-tight text-[#1c1917]" style="min-width: 160px; text-align: center;">Month Year</h2>
            <button class="w-10 h-10 rounded-xl hover:bg-[#c9a236]/10 flex items-center justify-center transition-all border border-[#c9a236]/30 group" onclick="changeMonth(1)">
              <svg class="w-5 h-5 text-[#c9a236]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <div id="calendar-admin-actions" class="flex items-center gap-2"></div>
        </div>

        <div id="calendar-grid-container">
           <div class="grid grid-cols-7 bg-[#fafafa] border-b border-[#c9a236]/10">
             ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="py-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#796120] opacity-60">${d}</div>`).join("")}
           </div>
           <div id="calendar-grid" class="grid grid-cols-7 bg-white"></div>
        </div>
      </div>

      <!-- Enhanced Tri-Phase Schedule -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="space-y-4">
          <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a236] flex items-center gap-3">
             <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Ongoing Now
          </h3>
          <div id="ongoing-list" class="space-y-2"></div>
        </div>
        <div class="space-y-4">
          <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#44403c] flex items-center gap-3">
             <span class="w-2 h-2 rounded-full bg-[#c9a236]"></span> Upcoming Strategy
          </h3>
          <div id="upcoming-list" class="space-y-2"></div>
        </div>
        <div class="space-y-4 opacity-70">
          <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#44403c] flex items-center gap-3 grayscale">
             <span class="w-2 h-2 rounded-full bg-slate-400"></span> Event Backlog
          </h3>
          <div id="backlog-list" class="space-y-2"></div>
        </div>
      </div>
    `;
  }

  function loadCalendar() {
    App.currentView = "calendar"; // Synchronize state
    const shellHtml = renderCalendarShell();
    setPageBody(shellHtml);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const titleEl = document.getElementById("current-month");
    if (titleEl)
      titleEl.innerText = `${monthNames[App.calendarState.currentMonth]} ${App.calendarState.currentYear}`;

    const adminActions = document.getElementById("calendar-admin-actions");
    const _calAdminRole =
      App.user && App.user.role ? App.user.role.toUpperCase() : "";
    if (adminActions && ["ADMIN", "SUPERADMIN", "HR"].includes(_calAdminRole)) {
      adminActions.innerHTML = `<button class="btn-solid btn-sm" onclick="openAddCalModal()">+ Add Entry</button>`;
    }

    const cacheKey = `calendar-${App.calendarState.currentMonth}-${App.calendarState.currentYear}`;
    const cached = tryCache(cacheKey);
    if (cached) {
      renderCalendarGrid(cached);
    }

    google.script.run
      .withSuccessHandler((resp) => {
        if (App.currentView !== "calendar") return;
        if (resp && resp.success) {
          tryCache(cacheKey, resp.entries);
          renderCalendarGrid(resp.entries || []);
        } else if (resp) {
          showToast(resp.message, "error");
        }
      })
      .withFailureHandler((err) => {
        showToast("Fetch Error: " + err.message, "error");
      })
      .getCalendarEntries(
        App.calendarState.currentMonth,
        App.calendarState.currentYear,
        App.user,
      );
  }

  function renderCalendarGrid(entries) {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const daysInMonth = new Date(
      App.calendarState.currentYear,
      App.calendarState.currentMonth + 1,
      0,
    ).getDate();
    const firstOfMonth = new Date(
      App.calendarState.currentYear,
      App.calendarState.currentMonth,
      1,
    );
    const lastOfMonth = new Date(
      App.calendarState.currentYear,
      App.calendarState.currentMonth + 1,
      0,
    );

    // 1. Prepare Events for Lane Assignment
    const parse = (val) => {
      if (!val) return null;
      const parts = val.toString().split(/[-/T ]/);
      let y, m, d2;
      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          [y, m, d2] = parts;
        } else if (parts[2].split(/[ ]/)[0].length === 4) {
          [m, d2, y] = parts;
          y = y.split(/[ ]/)[0];
        } else {
          [y, m, d2] = parts;
        }
      } else return null;
      const res = new Date(parseInt(y), parseInt(m) - 1, parseInt(d2));
      res.setHours(0, 0, 0, 0);
      return res;
    };


    const sortedEvents = (entries || [])
      .map((e) => ({
        ...e,
        startObj: parse(e.startDate),
        endObj: parse(e.endDate || e.startDate),
      }))
      .filter(
        (e) =>
          e.startObj && e.startObj <= lastOfMonth && e.endObj >= firstOfMonth,
      )
      .sort((a, b) => b.endObj - b.startObj - (a.endObj - a.startObj)); // Longest first

    // Safe Lanes Assignment
    const lanes = [];
    try {
      sortedEvents.forEach((evt) => {
        let laneIdx = lanes.findIndex((lane) =>
          lane.every((other) => {
            try {
              return evt.startObj > other.endObj || evt.endObj < other.startObj;
            } catch (e) {
              return true;
            }
          }),
        );
        if (laneIdx === -1) {
          lanes.push([evt]);
          evt.lane = lanes.length - 1;
        } else {
          lanes[laneIdx].push(evt);
          evt.lane = laneIdx;
        }
      });
    } catch (e) {
      console.error("Lane Error:", e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { role, isEmp, isMgr, isAdmin } = getRoleState();

    const palette = [
      {
        bg: "bg-[#10b981]/20",
        text: "text-[#065f46]",
        border: "border-[#10b981]/40",
      }, // Emerald
      {
        bg: "bg-[#0ea5e9]/20",
        text: "text-[#075985]",
        border: "border-[#0ea5e9]/40",
      }, // Sky
      {
        bg: "bg-[#06b6d4]/20",
        text: "text-[#164e63]",
        border: "border-[#06b6d4]/40",
      }, // Cyan
      {
        bg: "bg-[#f43f5e]/20",
        text: "text-[#9f1239]",
        border: "border-[#f43f5e]/40",
      }, // Rose
      {
        bg: "bg-[#f59e0b]/20",
        text: "text-[#92400e]",
        border: "border-[#f59e0b]/40",
      }, // Amber
      {
        bg: "bg-[#6366f1]/20",
        text: "text-[#3730a3]",
        border: "border-[#6366f1]/40",
      }, // Indigo (Deep Blue)
      {
        bg: "bg-[#f97316]/20",
        text: "text-[#9a3412]",
        border: "border-[#f97316]/40",
      }, // Orange
      {
        bg: "bg-[#475569]/20",
        text: "text-[#1e293b]",
        border: "border-[#475569]/40",
      }, // Slate
    ];

    // Padding (Prev Month)
    let firstDayObj = new Date(
      App.calendarState.currentYear,
      App.calendarState.currentMonth,
      1,
    );
    let dayNum = firstDayObj.getDay();
    if (isNaN(dayNum)) dayNum = 0; // Absolute fallback
    let adjFirstDay = (dayNum + 6) % 7;
    for (let i = 0; i < adjFirstDay; i++) {
      grid.innerHTML += `<div class="calendar-cell other-month border-b border-r border-[#c9a236]/5 bg-[#fbfbfb]/30"></div>`;
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      try {
        const currentCellDate = new Date(
          App.calendarState.currentYear,
          App.calendarState.currentMonth,
          d,
        );
        currentCellDate.setHours(0, 0, 0, 0);
        const isToday = currentCellDate.getTime() === today.getTime();

        const dateStr = `${App.calendarState.currentYear}-${(App.calendarState.currentMonth + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
        const isActive = App.calendarState.selectedDate === dateStr;

        let cellHtml = `
        <div class="calendar-cell ${isToday ? "today" : ""} ${isActive ? "active" : ""}">
          <span class="day-num">${d}</span>
          <div class="events-lane-container">`;

        // Filter events spanning this day
        const dayEntries = sortedEvents.filter(
          (e) => currentCellDate >= e.startObj && currentCellDate <= e.endObj,
        );

        const maxLane = Math.max(-1, ...dayEntries.map((e) => e.lane));
        for (let l = 0; l <= maxLane; l++) {
          const e = dayEntries.find((ent) => ent.lane === l);
          if (e) {
            const isStart =
              currentCellDate.getTime() === e.startObj.getTime() || d === 1;
            const isEnd =
              currentCellDate.getTime() === e.endObj.getTime() ||
              d === daysInMonth;

            const evtId = String(e.id || "");
            const hash = evtId
              .split("")
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const color = palette[Math.abs(hash) % palette.length];
            const colorClass = `${color.bg} ${color.text} ${color.border}`;

            cellHtml += `
            <div class="calendar-event-bar ${colorClass} font-bold group relative ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""} truncate" 
                 onclick="event.stopPropagation(); viewCalEntry('${e.id}')">
              ${isStart ? `<span>${e.title}</span>` : "&nbsp;"}
              
              <!-- Hover Reveal Details (Premium Popover) -->
              <div class="absolute left-full top-0 ml-4 w-64 p-5 bg-white shadow-2xl rounded-[1.5rem] border border-[#c9a236]/20 z-[100] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform scale-95 group-hover:scale-100 backdrop-blur-sm">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[9px] uppercase font-bold tracking-widest text-[#c9a236] px-2 py-0.5 bg-[#c9a236]/5 rounded-md">${e.category || "Strategic Event"}</span>
                  ${
                    isAdmin
                      ? `
                  <button class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#c9a236]/10 text-gray-400 hover:text-[#c9a236] transition-all" onclick="event.stopPropagation(); openEditCalModal('${e.id}')">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>`
                      : ""
                  }
                </div>
                <h5 class="text-[13px] font-extrabold text-[#1c1917] mb-2 leading-tight">${e.title}</h5>
                <p class="text-[10px] text-[#44403c]/70 mb-4 leading-relaxed line-clamp-3 font-medium">${e.remarks || "No additional strategy notes provided."}</p>
                <div class="pt-3 border-t border-[#f2f2f2] flex flex-wrap gap-3">
                  <div class="flex items-center gap-1.5 text-[9px] font-bold text-[#796120] uppercase tracking-tighter">
                    <svg class="w-2.5 h-2.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    ${e.startTime || "All Day"}
                  </div>
                  ${
                    e.location
                      ? `
                  <div class="flex items-center gap-1.5 text-[9px] font-bold text-[#796120] uppercase tracking-tighter">
                    <svg class="w-2.5 h-2.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${e.location}
                  </div>`
                      : ""
                  }
                </div>
              </div>
            </div>`;
          } else {
            cellHtml += `<div class="calendar-event-spacer"></div>`;
          }
        }

        cellHtml += `</div></div>`;
        grid.innerHTML += cellHtml;
      } catch (e) {
        console.error(`Day ${d} Error:`, e);
      }
    }

    renderUpcomingList(entries);
  }

  /**
   * Selection Tracker: Highlights the selected cell and opens the modal for authorized roles.
   */
  function selectCalendarDate(dateStr) {
    App.calendarState.selectedDate = dateStr;

    // Refresh grid to show highlight
    const cacheKey = `calendar-${App.calendarState.currentMonth}-${App.calendarState.currentYear}`;
    const entries = tryCache(cacheKey) || [];
    renderCalendarGrid(entries);

    // If Admin/HR, trigger modal automatically
    const userRole =
      App.user && App.user.role ? App.user.role.toUpperCase() : "";
    if (["ADMIN", "SUPERADMIN", "HR"].includes(userRole)) {
      openAddCalModal(dateStr);
    }
  }

  function renderUpcomingList(entries) {
    const ongoingList = document.getElementById("ongoing-list");
    const upcomingList = document.getElementById("upcoming-list");
    const backlogList = document.getElementById("backlog-list");
    if (!ongoingList || !upcomingList || !backlogList) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parse = (val) => {
      if (!val) return null;
      const parts = val.toString().split(/[-/T ]/);
      if (parts.length < 3) return new Date(val);
      let y, m, d2;
      if (parts[0].length === 4) {
        [y, m, d2] = parts;
      } else if (parts[2].split(/[ ]/)[0].length === 4) {
        [m, d2, y] = parts;
        y = y.split(/[ ]/)[0];
      } else {
        [y, m, d2] = parts;
      }
      const res = new Date(parseInt(y), parseInt(m) - 1, parseInt(d2));
      res.setHours(0, 0, 0, 0);
      return res;
    };

    const ongoing = [],
      upcoming = [],
      backlog = [];
    const monthNamesShort = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    (entries || []).forEach((e) => {
      const start = parse(e.startDate);
      const end = parse(e.endDate || e.startDate);
      if (!start) return;

      if (today >= start && today <= end) ongoing.push(e);
      else if (start > today) upcoming.push(e);
      else backlog.push(e);
    });

    const renderCard = (e) => {
      const d = parse(e.startDate);
      return `
        <div class="bg-white p-3 rounded-xl border border-[#c9a236]/10 hover:border-[#c9a236]/30 transition-all cursor-pointer group shadow-sm hover:shadow-md" onclick="viewCalEntry('${e.id}')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#fbfbfb] rounded-lg border border-[#f2f2f2] flex flex-col items-center justify-center">
              <span class="text-[12px] font-extrabold text-[#1c1917] leading-none">${d.getDate()}</span>
              <span class="text-[8px] font-bold text-[#c9a236] uppercase">${monthNamesShort[d.getMonth()]}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-bold text-[#1c1917] truncate group-hover:text-[#c9a236] transition-colors">${e.title}</h4>
              <p class="text-[9px] text-[#44403c] opacity-60 uppercase tracking-tighter">${e.category || "General"}</p>
            </div>
          </div>
        </div>
      `;
    };

    ongoingList.innerHTML = ongoing.length
      ? ongoing.map(renderCard).join("")
      : `<div class="p-4 rounded-xl border border-dashed border-[#f2f2f2] text-center"><p class="text-[9px] text-[#44403c]/30 font-bold uppercase tracking-widest">No Active Events</p></div>`;
    upcomingList.innerHTML = upcoming.length
      ? upcoming.map(renderCard).join("")
      : `<div class="p-4 rounded-xl border border-dashed border-[#f2f2f2] text-center"><p class="text-[9px] text-[#44403c]/30 font-bold uppercase tracking-widest">No Upcoming Strategy</p></div>`;
    backlogList.innerHTML = backlog.length
      ? backlog.map(renderCard).join("")
      : `<div class="p-4 rounded-xl border border-dashed border-[#f2f2f2] text-center"><p class="text-[9px] text-[#44403c]/30 font-bold uppercase tracking-widest">Backlog Clear</p></div>`;
  }

  function changeMonth(delta) {
    App.calendarState.currentMonth += delta;
    if (App.calendarState.currentMonth < 0) {
      App.calendarState.currentMonth = 11;
      App.calendarState.currentYear--;
    }
    if (App.calendarState.currentMonth > 11) {
      App.calendarState.currentMonth = 0;
      App.calendarState.currentYear++;
    }
    loadCalendar();
  }

  function goToToday() {
    App.calendarState.currentMonth = new Date().getMonth();
    App.calendarState.currentYear = new Date().getFullYear();
    loadCalendar();
  }

  /* ── Calendar Modals ───────────────────────────────────────── */
  function openAddCalModal(dateStr) {
    const userRole =
      App.user && App.user.role ? App.user.role.toUpperCase() : "";
    if (!["ADMIN", "SUPERADMIN", "HR"].includes(userRole)) return;
    const modal = document.getElementById("add-calendar-modal");
    modal.style.display = "flex";

    // 1. Fetch Departments for Tagging
    const deptSelect = document.getElementById("coll-dept-select");
    if (deptSelect) {
      deptSelect.innerHTML =
        '<option value="" disabled selected>— Department</option>';
      google.script.run
        .withSuccessHandler((resp) => {
          if (resp && resp.departments) {
            resp.departments.forEach((d) => {
              const opt = document.createElement("option");
              opt.value = d;
              opt.textContent = d;
              deptSelect.appendChild(opt);
            });
          }
        })
        .getOnboardingData();
    }
    const form = document.getElementById("calendar-form");
    if (form) form.reset();
    App.calendarState.tags = [];
    renderCollaboratorTags();
    setCalMode("Single");

    if (dateStr) {
      const dateInput = document.querySelector(
        "#calendar-form input[name='startDate']",
      );
      if (dateInput) dateInput.value = dateStr;

      const startMulti = document.querySelector(
        "#calendar-form input[name='startDateMulti']",
      );
      if (startMulti) startMulti.value = dateStr;
    }
  }

  function setCalMode(mode) {
    document.getElementById("cal-input-type").value = mode;
    const isMulti = mode === "Multi";

    // UI Buttons
    document.getElementById("toggle-single").className =
      `segmented-btn flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${!isMulti ? "active bg-white shadow-sm border border-[#c9a236]/20 text-[#c9a236]" : "opacity-40 text-gray-400"}`;
    document.getElementById("toggle-multi").className =
      `segmented-btn flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isMulti ? "active bg-white shadow-sm border border-[#c9a236]/20 text-[#c9a236]" : "opacity-40 text-gray-400"}`;

    // Field visibility
    document
      .getElementById("cal-date-single")
      .classList.toggle("hidden", isMulti);
    document
      .getElementById("cal-date-multi-start")
      .classList.toggle("hidden", !isMulti);
    document
      .getElementById("cal-date-multi-end")
      .classList.toggle("hidden", !isMulti);
  }

  function handleCollSearch(q) {
    const resultsDiv = document.getElementById("coll-results");
    if (!q || q.length < 2) {
      resultsDiv.classList.add("hidden");
      return;
    }

    google.script.run
      .withSuccessHandler((resp) => {
        if (resp.success && resp.results.length > 0) {
          resultsDiv.innerHTML = resp.results
            .map(
              (r) => `
            <div class="px-4 py-3 hover:bg-[#c9a236]/5 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0" onclick="addTag('${r.type}','${r.id}','${r.name}')">
              <div>
                <p class="text-xs font-bold text-[#1c1707]">${r.name}</p>
                <p class="text-[9px] text-gray-400 uppercase tracking-widest">${r.type}${r.dept ? " · " + r.dept : ""}</p>
              </div>
              <svg class="w-4 h-4 text-[#c9a236]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
            </div>
          `,
            )
            .join("");
          resultsDiv.classList.remove("hidden");
        } else {
          resultsDiv.classList.add("hidden");
        }
      })
      .searchCollaborators(q);
  }

  function addTag(type, id, name) {
    if (App.calendarState.tags.some((t) => t.id === id)) return;
    App.calendarState.tags.push({ type, id, name });
    renderCollaboratorTags();
    document.getElementById("coll-search").value = "";
    const ds = document.getElementById("coll-dept-select");
    if (ds) ds.value = "";
    document.getElementById("coll-results").classList.add("hidden");
  }

  function removeTag(id) {
    App.calendarState.tags = App.calendarState.tags.filter((t) => t.id !== id);
    renderCollaboratorTags();
  }

  function addAllCollaborators() {
    App.calendarState.tags = [{ type: "special", id: "ALL", name: "EVERYONE" }];
    renderCollaboratorTags();
  }

  function renderCollaboratorTags() {
    const container = document.getElementById("collaborator-tags");
    container.innerHTML = App.calendarState.tags
      .map((t) => {
        const isDept = t.type === "department";
        const style = isDept
          ? "bg-[#3f3112] border-[#c9a236]/40 text-[#fef3c7]"
          : "bg-[#c9a236]/10 border-[#c9a236]/20 text-[#c9a236]";

        return `
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${style}">
              ${isDept ? "🏢" : t.type === "special" ? "🚀" : "👤"} ${t.name}
              <button type="button" class="hover:text-white" onclick="removeTag('${t.id}')">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          `;
      })
      .join("");
  }

  function submitCalendarEntry() {
    const btn = document.getElementById("cal-save-btn");
    const form = document.getElementById("calendar-form");
    const formData = new FormData(form);

    const isMulti = document.getElementById("cal-input-type").value === "Multi";
    const payload = {
      type: document.getElementById("cal-input-type").value,
      startDate: isMulti
        ? formData.get("startDateMulti")
        : formData.get("startDate"),
      endDate: isMulti ? formData.get("endDate") : formData.get("startDate"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      title: formData.get("title"),
      category: formData.get("category"),
      location: formData.get("location"),
      notification: formData.get("notification"),
      isMandatory: formData.get("isMandatory") === "on",
      remarks: formData.get("remarks"),
      collaborators: App.calendarState.tags.map((t) => t.id).join(","),
      adminNo: App.user ? App.user.employeeNo : null,
    };

    if (!payload.title || !payload.startDate) {
      showToast("Please provide event title and date", "warning");
      return;
    }

    setBtn(btn, true, "Saving...");
    google.script.run
      .withSuccessHandler((resp) => {
        setBtn(btn, false, "Save to Summit");
        if (resp.success) {
          showToast("Calendar updated");
          closeCalModal();
          loadCalendar();
        } else {
          showToast(resp.message, "error");
        }
      })
      .withFailureHandler((err) => {
        setBtn(btn, false, "Save to Summit");
        showToast("System Error: " + err.message, "error");
        console.error("Calendar Save Error:", err);
      })
      .saveCalendarEntry(payload);
  }

  function viewCalEntry(id) {
    const cacheKey = `calendar-${App.calendarState.currentMonth}-${App.calendarState.currentYear}`;
    const entries = tryCache(cacheKey) || [];
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    const { isAdmin } = getRoleState();

    // Enhanced Detail View (Modal-lite)
    const content = `
      <div class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm anim-fade">
        <div class="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl anim-up">
          <div class="flex justify-between items-start mb-8">
            <span class="px-3 py-1 rounded-full bg-[#c9a236]/10 text-[#c9a236] text-[10px] font-bold uppercase tracking-widest">${entry.category || "General"}</span>
            <button class="text-gray-300 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <h2 class="text-2xl font-serif text-[#1c1707] mb-4">${entry.title}</h2>
          
          <div class="space-y-4 mb-10 text-sm">
             <div class="flex items-center gap-3 text-gray-500">
                <svg class="w-4 h-4 text-[#c9a236]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span>${new Date(entry.startDate).toLocaleDateString()} ${entry.type === "Multi" ? " – " + new Date(entry.endDate).toLocaleDateString() : ""}</span>
             </div>
             <div class="flex items-center gap-3 text-gray-500">
                <svg class="w-4 h-4 text-[#c9a236]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${entry.startTime} – ${entry.endTime}</span>
             </div>
             ${
               entry.location
                 ? `
             <div class="flex items-center gap-3 text-gray-500">
                <svg class="w-4 h-4 text-[#c9a236]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span class="break-all">${entry.location}</span>
             </div>`
                 : ""
             }
             ${entry.remarks ? `<p class="mt-6 pt-6 border-t border-gray-50 text-gray-400 italic">"${entry.remarks}"</p>` : ""}
          </div>

          <div class="flex gap-4">
            ${
              isAdmin
                ? `
              <button class="btn-outline flex-1 !text-red-500 !border-red-100 !bg-red-50" onclick="deleteEntryAndClose('${id}', this)">Delete</button>
            `
                : ""
            }
            <button class="btn-solid flex-1" onclick="this.closest('.fixed').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", content);
  }

  function deleteEntryAndClose(id, btn) {
    if (
      !confirm(
        "Are you sure you want to remove this event from company schedule?",
      )
    )
      return;
    setBtn(btn, true, "...");
    google.script.run
      .withSuccessHandler((resp) => {
        if (resp && resp.success) {
          showToast("Event removed");
          btn.closest(".fixed").remove();
          loadCalendar();
        } else {
          showToast(resp.message, "error");
          setBtn(btn, false, "Delete");
        }
      })
      .deleteCalendarEntry(id);
  }

  function closeCalModal() {
    const modal = document.getElementById("add-calendar-modal");
    if (modal) modal.style.display = "none";
  }

  function loadLeave() {
    setLoading("skeleton");
    showProgress(30);
    google.script.run
      .withSuccessHandler((resp) => {
        showProgress(100);
        if (!resp || !resp.success) {
          setPageBody(
            renderError(
              "Leave Error",
              resp ? resp.message : "Connection failed",
            ),
          );
          return;
        }

        const role =
          App.user && App.user.role ? App.user.role.toUpperCase() : "";
        const isEmp = role === "EMPLOYEE";
        const isMgr = role === "MANAGER";
        const canReview = ["HR", "ADMIN"].includes(role);
        const canFile = role !== "SUPERADMIN";

        const rows = (resp.requests || [])
          .map((r) => {
            const status = (r["Status"] || "Pending").toLowerCase();
            return `
          <div class="list-row" style="flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:200px;">
              <div class="avatar" style="font-size:0.625rem;flex-shrink:0;">${(r["Employee Name"] || "?").substring(0, 2).toUpperCase()}</div>
              <div>
                <p style="font-size:0.9375rem;font-weight:500;color:#000;font-family:'Inter',sans-serif;">${r["Employee Name"] || r["Employee No."]}</p>
                <p class="t-micro" style="font-size:0.6rem;margin-top:3px;">${r["Leave Type"] || "—"} · ${r["Start Date"] ? new Date(r["Start Date"]).toLocaleDateString() : "—"} – ${r["End Date"] ? new Date(r["End Date"]).toLocaleDateString() : "—"}</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="status-pill ${status === "approved" ? "active" : status === "pending" ? "pending" : ""}">${r["Status"] || "Pending"}</span>
              ${
                canReview && status === "pending"
                  ? `
                <button class="btn-solid btn-sm" onclick="reviewLeave('${r["ID"]}','approve')" style="font-size:0.75rem;padding:5px 14px;">Approve</button>
                <button class="btn-outline btn-sm" onclick="reviewLeave('${r["ID"]}','reject')" style="font-size:0.75rem;padding:5px 14px;">Reject</button>
              `
                  : ""
              }
            </div>
          </div>`;
          })
          .join("");

        const s = resp.balanceSummary || {};
        if (isEmp) App.user.balanceSummary = s;
        const balanceCards = isEmp ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-bottom:32px;" class="anim-up">
            <div class="c-card-em" style="padding:20px;border-left:4px solid #c9a236;">
              <p class="t-micro" style="margin-bottom:4px;">SIL (Shared Pool)</p>
              <h3 style="font-size:1.5rem;font-weight:800;color:#1c1707;">${s.SIL?.remaining || 0} <span style="font-size:0.75rem;font-weight:500;color:#93939f;">/ ${s.SIL?.total || 5}</span></h3>
              <p style="font-size:0.65rem;color:#93939f;margin-top:2px;">Annual, Sick, Vacation, Emergency</p>
            </div>
            <div class="c-card-em" style="padding:20px;border-left:4px solid #3b82f6;">
              <p class="t-micro" style="margin-bottom:4px;">Additional (Tenure)</p>
              <h3 style="font-size:1.5rem;font-weight:800;color:#1c1707;">${s.Additional?.remaining || 0} <span style="font-size:0.75rem;font-weight:500;color:#93939f;">/ ${s.Additional?.total || 0}</span></h3>
              <p style="font-size:0.65rem;color:#93939f;margin-top:2px;">Bonus days based on tenure</p>
            </div>
            <div class="c-card-em" style="padding:20px;border-left:4px solid #ec4899;">
              <p class="t-micro" style="margin-bottom:4px;">Birthday Leave</p>
              <h3 style="font-size:1.5rem;font-weight:800;color:#1c1707;">${s.Birthday?.remaining || 0} <span style="font-size:0.75rem;font-weight:500;color:#93939f;">/ 1</span></h3>
              <p style="font-size:0.65rem;color:${s.Birthday?.isEligible ? '#ec4899' : '#93939f'};margin-top:2px;font-weight:${s.Birthday?.isEligible ? '700' : '400'};">
                ${s.Birthday?.isEligible ? "🎉 Available this month!" : "Not available this month"}
              </p>
            </div>
          </div>
        ` : "";

        setPageBody(`
          <div style="margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end;" class="anim-up">
            <div>
              <p class="t-label" style="margin-bottom:10px;">Operations</p>
              <h1 class="t-display2" style="font-size:2.75rem;margin-bottom:10px;">${isEmp ? "My Leave" : "Leave Pipeline"}</h1>
              <p class="t-lead" style="font-size:0.9375rem;">${resp.requests.length} request${resp.requests.length !== 1 ? "s" : ""} found.</p>
            </div>
            ${canFile ? '<button class="btn-solid" onclick="openLeaveModal()">+ File Leave Request</button>' : ""}
          </div>

          ${balanceCards}

          <div class="c-card-em anim-up" style="padding:28px;">
            ${rows || "<p style=\"font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:#93939f;text-align:center;padding:48px 0;\">NO LEAVE RECORDS FOUND</p>"}
          </div>
        `);
      })
      .getLeaveRequests(App.user);
  }

  /* ── PAGE: Attendance ───────────────────────────────────────── */
  function loadAttendance() {
    setLoading("skeleton");
    showProgress(30);
    google.script.run
      .withSuccessHandler((resp) => {
        showProgress(100);
        if (!resp.success) {
          setPageBody(renderError("Attendance Error", resp.message));
          return;
        }

        const latest = (resp.records || [])[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const isClockedIn = latest && !latest["Time Out"] && latest["Date"].startsWith(todayStr);

        const rows = (resp.records || [])
          .map(
            (r) => `
          <tr style="border-bottom:1px solid #f2f2f2;">
            <td style="padding:12px 16px;font-family:'IBM Plex Mono',monospace;font-size:0.8125rem;color:#000;">${r["Date"] ? new Date(r["Date"]).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
            <td style="padding:12px 16px;font-size:0.875rem;font-family:'Inter',sans-serif;color:#212121;">${r["Time In"] ? new Date(r["Time In"]).toTimeString().slice(0, 5) : "—"}</td>
            <td style="padding:12px 16px;font-size:0.875rem;font-family:'Inter',sans-serif;color:#212121;">${r["Time Out"] ? new Date(r["Time Out"]).toTimeString().slice(0, 5) : "—"}</td>
            <td style="padding:12px 16px;font-family:'IBM Plex Mono',monospace;font-size:0.8125rem;color:#666;max-width:150px;overflow:hidden;text-overflow:ellipsis;" title="${r["Location"] || ""}">
              ${(r["Location"] || "—").replace("LAT: ", "").replace("LNG: ", "")}
            </td>
            <td style="padding:12px 16px;font-family:'IBM Plex Mono',monospace;font-size:0.875rem;color:#000;">${r["Hours"] ? r["Hours"] + "h" : "—"}</td>
            <td style="padding:12px 16px;"><span class="status-pill ${r["Status"] === "Present" || r["Status"] === "On Time" ? "active" : ""}">${r["Status"] || "Unknown"}</span></td>
          </tr>`,
          )
          .join("");

        setPageBody(`
          <div style="margin-bottom:32px;" class="anim-up">
            <p class="t-label" style="margin-bottom:10px;">Time & Attendance</p>
            <h1 class="t-display2" style="font-size:2.75rem;margin-bottom:10px;">${App.user.role === "EMPLOYEE" ? "My Attendance" : "Attendance Log"}</h1>
            <p class="t-lead" style="font-size:0.9375rem;">Showing complete attendance history.</p>
          </div>

          <div class="c-card-em anim-up" style="padding:0;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid #d9d9dd;background:#fafafa;">
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Date</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Time In</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Time Out</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Location</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Hours</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="6" style="padding:48px;text-align:center;color:#93939f;font-family:\'IBM Plex Mono\',monospace;font-size:0.75rem;">NO RECORDS</td></tr>'}
              </tbody>
            </table>
          </div>
        `);
      })
      .getMyAttendance(App.user);
  }

  /* ── PAGE: Access Control ───────────────────────────────────── */
  function loadAccessControl() {
    setLoading("skeleton");
    showProgress(30);
    google.script.run
      .withSuccessHandler((resp) => {
        if (App.currentView !== "access") return;
        showProgress(100);
        if (!resp.success) {
          setPageBody(renderError("Access Control Error", resp.message));
          return;
        }

        const rows = (resp.accounts || [])
          .map(
            (a) => `
          <tr style="border-bottom:1px solid #f2f2f2;">
            <td style="padding:14px 16px;font-family:'IBM Plex Mono',monospace;font-size:0.8125rem;color:#000;">${a["Employee No."]}</td>
            <td style="padding:14px 16px;font-size:0.875rem;color:#212121;font-family:'Inter',sans-serif;">${a["Email"]}</td>
            <td style="padding:14px 16px;">
              <select onchange="changeRole('${a["Employee No."]}',this.value)" style="font-family:'Inter',sans-serif;font-size:0.875rem;border:1px solid #d9d9dd;border-radius:6px;padding:4px 8px;background:#fff;color:#000;cursor:pointer;">
                ${["Employee", "Manager", "HR", "Admin", "Superadmin"].map((r) => `<option value="${r}" ${a["Role"] === r ? "selected" : ""}>${r}</option>`).join("")}
              </select>
            </td>
            <td style="padding:14px 16px;">
              <span class="status-pill ${a["Status"] === "Active" ? "active" : ""}">${a["Status"]}</span>
            </td>
            <td style="padding:14px 16px;font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:#93939f;">${a["Last Login"] ? new Date(a["Last Login"]).toLocaleDateString() : "Never"}</td>
            <td style="padding:14px 16px;">
              <button class="btn-ghost btn-sm" onclick="toggleStatus('${a["Employee No."]}')" style="font-size:0.75rem;color:#93939f;">Toggle</button>
            </td>
          </tr>`,
          )
          .join("");

        setPageBody(`
          <div style="margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end;" class="anim-up">
            <div>
              <p class="t-label" style="margin-bottom:10px;">Administration</p>
              <h1 class="t-display2" style="font-size:2.75rem;margin-bottom:10px;">Access Control</h1>
              <p class="t-lead" style="font-size:0.9375rem;">${resp.accounts.length} accounts provisioned in system.</p>
            </div>
          </div>

          <div class="c-card-em anim-up" style="padding:0;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid #d9d9dd;background:#fafafa;">
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Emp No.</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Email</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Role</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Status</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Last Login</th>
                  <th style="padding:14px 16px;text-align:left;" class="t-label">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="6" style="padding:48px;text-align:center;color:#93939f;font-family:\'IBM Plex Mono\',monospace;font-size:0.75rem;">NO ACCOUNTS PROVISIONED</td></tr>'}
              </tbody>
            </table>
          </div>
        `);
      })
      .getAccessControlList();
  }

  /* ── PAGE: Reports ─────────────────────────────────────────── */
  function loadReports() {
    setLoading("skeleton");
    showProgress(30);
    google.script.run
      .withSuccessHandler((resp) => {
        showProgress(100);
        if (!resp.success) {
          setPageBody(renderError("Reporting Error", resp.message));
          return;
        }
        renderReportingUI(resp.data);
      })
      .getReportingData(App.user);
  }

  function renderReportingUI(data) {
    setPageBody(`
      <div style="margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end;" class="anim-up">
        <div>
          <p class="t-label" style="margin-bottom:10px;">Analytical Intelligence</p>
          <h1 class="t-display2" style="font-size:2.75rem;margin-bottom:10px;">Organizational Reports</h1>
          <p class="t-lead" style="font-size:0.9375rem;">Real-time data visualization across all departments.</p>
        </div>
        <button class="btn-solid btn-sm" onclick="downloadAllReports()">Export All (CSV)</button>
      </div>

      <!-- Charts Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(400px, 1fr));gap:20px;" class="anim-stagger">
        
        <!-- Headcount by Department -->
        <div class="c-card-em anim-up" style="padding:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 class="t-label" style="color:#000;">Headcount by Department</h3>
            <button class="btn-ghost btn-sm" style="font-size:0.7rem;" onclick="downloadCSV('Headcount', App._reportData.departments)">CSV</button>
          </div>
          <div style="height:300px;"><canvas id="chart-headcount"></canvas></div>
        </div>

        <!-- Leave Type Distribution -->
        <div class="c-card-em anim-up" style="padding:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 class="t-label" style="color:#000;">Leave Type Distribution</h3>
            <button class="btn-ghost btn-sm" style="font-size:0.7rem;" onclick="downloadCSV('LeaveTypes', App._reportData.leaveTypes)">CSV</button>
          </div>
          <div style="height:300px;"><canvas id="chart-leave-types"></canvas></div>
        </div>

        <!-- Attendance Summary -->
        <div class="c-card-em anim-up" style="padding:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 class="t-label" style="color:#000;">Attendance Status</h3>
            <button class="btn-ghost btn-sm" style="font-size:0.7rem;" onclick="downloadCSV('Attendance', App._reportData.attendance)">CSV</button>
          </div>
          <div style="height:300px;"><canvas id="chart-attendance"></canvas></div>
        </div>

        <!-- Status Distribution -->
        <div class="c-card-em anim-up" style="padding:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 class="t-label" style="color:#000;">Employee Status</h3>
            <button class="btn-ghost btn-sm" style="font-size:0.7rem;" onclick="downloadCSV('Status', App._reportData.employeeStatus)">CSV</button>
          </div>
          <div style="height:300px;"><canvas id="chart-status"></canvas></div>
        </div>

      </div>
    `);

    App._reportData = data;
    setTimeout(() => initCharts(data), 100);
  }

  function loadInternalTalent() {
    loadSection("talent");
  }

  /* ── PAGE: Talent & Growth ──────────────────────────────────── */
  function loadTalent(sub = "okr") {
    setLoading("skeleton");
    showProgress(30);

    // Toggle active tab in UI later if needed
    if (sub === "okr") {
      google.script.run
        .withSuccessHandler((resp) => {
          showProgress(100);
          if (!resp.success) {
            setPageBody(renderError("OKR Error", resp.message));
            return;
          }
          renderOKRHub(resp.objectives);
        })
        .getOKRData(App.user);
    } else {
      google.script.run
        .withSuccessHandler((resp) => {
          showProgress(100);
          if (!resp.success) {
            setPageBody(renderError("Review Error", resp.message));
            return;
          }
          renderReviewHub(resp.reviews);
        })
        .getPerformanceReviews(App.user);
    }
  }

  function renderOKRHub(objectives) {
    const okrHtml = (objectives || [])
      .map((obj) => {
        const krs = (obj.keyresults || [])
          .map((kr) => {
            const pct = Math.min(
              100,
              Math.max(0, (kr.current / kr.target) * 100),
            );
            return `
          <div class="kr-item flex items-center gap-6 py-4 border-b border-white/5 last:border-0 pl-1">
            <div class="flex-1">
              <p class="text-[11px] font-bold uppercase tracking-wider text-white/80 mb-3">${kr.title}</p>
              <div class="summit-progress">
                <div class="summit-progress-fill" style="width:${pct}%"></div>
              </div>
            </div>
            <div class="text-right min-w-[100px]">
              <p class="text-[12px] font-bold text-[#c9a236] font-mono">${kr.current}${kr.unit} / ${kr.target}${kr.unit}</p>
            </div>
          </div>
        `;
          })
          .join("");

        return `
        <div class="glass-panel p-8 anim-up border-white/5">
          <div class="flex justify-between items-start mb-8">
            <div class="space-y-1">
              <p class="text-[9px] font-bold uppercase tracking-[0.25em] text-[#c9a236]">Impact Objective</p>
              <h3 class="text-2xl font-bold text-white tracking-tight">${obj.title}</h3>
              <p class="text-xs text-white/30 font-medium">${obj.description || "Strategic growth target."}</p>
            </div>
            <div class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/50">${obj.status || "Active"}</div>
          </div>
          <div class="space-y-2">
            ${krs || '<p class="text-xs text-white/20 italic">Awaiting key result definitions.</p>'}
          </div>
        </div>
      `;
      })
      .join("");

    setPageBody(`
      <div class="flex justify-between items-end mb-16 anim-up pt-4">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-[1px] bg-[#c9a236]"></div>
            <p class="text-[#c9a236] text-[10px] font-bold uppercase tracking-[0.4em]">Diamond Lifecycle</p>
          </div>
          <h1 class="text-display-hero !text-6xl !text-white !font-light">Growth Hub</h1>
          <div class="flex gap-10 pt-4">
            <button class="pb-4 text-[13px] font-bold border-b-2 border-[#c9a236] text-white tracking-wide">Strategic OKRs</button>
            <button class="pb-4 text-[13px] font-bold text-white/30 hover:text-white transition-all tracking-wide" onclick="loadTalent('reviews')">Assessment Reports</button>
          </div>
        </div>
        <button class="glass-panel !py-4 !px-8 !rounded-xl !text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a236] hover:bg-[#c9a236]/10 active:scale-95 shadow-2xl" onclick="showToast('OKR Management coming soon','info')">+ New Objective</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 anim-stagger pb-20">
        ${okrHtml || '<div class="p-20 text-center glass-panel italic text-white/20">The summit is empty. Start by defining your first strategic objective.</div>'}
      </div>
    `);
  }

  function renderReviewHub(reviews) {
    const reviewHtml = (reviews || [])
      .map((r) => {
        const isFinal = r.status === "Finalized";
        const score = r.rating === "Summit Level" ? 100 : 0;
        return `
        <div class="glass-panel p-10 anim-up flex gap-10 items-stretch border-white/5">
          <div class="flex flex-col items-center">
             <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isFinal ? "bg-[#c9a236] text-white" : "bg-white/5 text-white/20"} border border-white/10 shadow-lg shadow-[#c9a236]/20">
               ${isFinal ? "✓" : "!"}
             </div>
             <div class="w-[1px] h-full bg-gradient-to-b from-white/10 to-transparent my-4"></div>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start mb-4">
               <div>
                  <h3 class="text-2xl font-bold text-white tracking-tight">${r.period} Performance Assessment</h3>
                  <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c9a236] mt-1">${r.status || "Active"}</p>
               </div>
               <div class="text-right">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Assigned Tier</p>
                  <span class="px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${r.rating === "Summit Level" ? "bg-[#c9a236] text-white shadow-lg shadow-[#c9a236]/20" : "bg-white/5 text-white/40 border border-white/10"}">${r.rating || "In Progress"}</span>
               </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-2xl mb-8 border border-white/5 mt-6">
               <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-white/20"></div>
                    <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Self reflection</p>
                  </div>
                  <p class="text-[13px] text-white/70 italic leading-relaxed font-medium">"${r.selffeedback ? r.selffeedback : "Employee assessment pending..."}"</p>
               </div>
               <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-[#c9a236]"></div>
                    <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c9a236]">Manager insight</p>
                  </div>
                  <p class="text-[13px] text-white italic leading-relaxed font-bold">"${r.managerfeedback ? r.managerfeedback : "Executive review in progress..."}"</p>
               </div>
            </div>
            <button class="glass-panel !py-3 !px-6 !rounded-xl !text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/5 transition-all" onclick="showToast('Full review report coming soon','info')">Download Assessment Digest</button>
          </div>
        </div>
      `;
      })
      .join("");

    setPageBody(`
      <div class="flex justify-between items-end mb-16 anim-up pt-4">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-[1px] bg-[#c9a236]"></div>
            <p class="text-[#c9a236] text-[10px] font-bold uppercase tracking-[0.4em]">Diamond Lifecycle</p>
          </div>
          <h1 class="text-display-hero !text-6xl !text-white !font-light">Growth Hub</h1>
          <div class="flex gap-10 pt-4">
            <button class="pb-4 text-[13px] font-bold text-white/30 hover:text-white transition-all tracking-wide" onclick="loadTalent('okr')">Strategic OKRs</button>
            <button class="pb-4 text-[13px] font-bold border-b-2 border-[#c9a236] text-white tracking-wide">Assessment Reports</button>
          </div>
        </div>
      </div>
      <div class="space-y-10 max-w-6xl anim-stagger pb-20">
        ${reviewHtml || '<div class="p-20 text-center glass-panel italic text-white/20">No assessment cycles recorded in this lifecycle.</div>'}
      </div>
    `);
  }

  function initCharts(data) {
    const ctxHeadcount = document
      .getElementById("chart-headcount")
      .getContext("2d");
    const ctxLeave = document
      .getElementById("chart-leave-types")
      .getContext("2d");
    const ctxAttendance = document
      .getElementById("chart-attendance")
      .getContext("2d");
    const ctxStatus = document.getElementById("chart-status").getContext("2d");

    const goldColors = [
      "#c9a236",
      "#dfc786",
      "#a1822b",
      "#796120",
      "#514115",
      "#eadaae",
    ];
    const chartFont = {
      family: "'Inter', sans-serif",
      size: 11,
      weight: "600",
    };

    // Headcount Bar Chart
    new Chart(ctxHeadcount, {
      type: "bar",
      data: {
        labels: Object.keys(data.departments),
        datasets: [
          {
            label: "Employees",
            data: Object.values(data.departments),
            backgroundColor: "#c9a236",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { display: false },
            ticks: { font: chartFont, color: "#796120" },
          },
          x: {
            grid: { display: false },
            ticks: { font: chartFont, color: "#796120" },
          },
        },
      },
    });

    // Leave Types Doughnut
    new Chart(ctxLeave, {
      type: "doughnut",
      data: {
        labels: Object.keys(data.leaveTypes),
        datasets: [
          {
            data: Object.values(data.leaveTypes),
            backgroundColor: goldColors,
            borderWidth: 0,
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: chartFont,
              color: "#796120",
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        cutout: "75%",
        animation: { animateScale: true },
      },
    });

    // Attendance Doughnut
    new Chart(ctxAttendance, {
      type: "doughnut",
      data: {
        labels: Object.keys(data.attendance),
        datasets: [
          {
            data: Object.values(data.attendance),
            backgroundColor: ["#c9a236", "#ef4444", "#dfc786"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: chartFont,
              color: "#796120",
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        cutout: "75%",
        animation: { animateScale: true },
      },
    });

    // Status Doughnut
    new Chart(ctxStatus, {
      type: "doughnut",
      data: {
        labels: Object.keys(data.employeeStatus),
        datasets: [
          {
            data: Object.values(data.employeeStatus),
            backgroundColor: ["#c9a236", "rgba(28, 23, 7, 0.1)"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: chartFont,
              color: "#796120",
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        cutout: "75%",
        animation: { animateScale: true },
      },
    });
  }

  function downloadCSV(name, data) {
    let csv = "Metric,Value\n";
    Object.entries(data).forEach(([k, v]) => {
      csv += `"${k}",${v}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `Summit_Report_${name}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    a.click();
  }

  function downloadAllReports() {
    const data = App._reportData;
    if (!data) return;

    let csv = "Category,Metric,Value\n";
    const sections = {
      Departments: data.departments,
      Status: data.employeeStatus,
      "Leave Types": data.leaveTypes,
      Attendance: data.attendance,
    };

    Object.entries(sections).forEach(([cat, set]) => {
      Object.entries(set).forEach(([k, v]) => {
        csv += `"${cat}","${k}",${v}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `Summit_Full_Analytics_${new Date().toISOString().split("T")[0]}.csv`,
    );
    a.click();
  }

  /* ── Auth Handlers ──────────────────────────────────────────── */
  function handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const pw = document.getElementById("login-password").value;
    const btn = document.getElementById("login-btn");

    setBtn(btn, true, "Signing in…");

    google.script.run
      .withSuccessHandler((resp) => {
        if (!resp) {
          setBtn(btn, false, "Sign In");
          showToast("Authentication server did not respond. Please try again.", "error");
          return;
        }
        if (resp.success) {
          App.user = resp.user;
          localStorage.setItem("summit_user", JSON.stringify(resp.user));
          navigate();
          fetchNotifications();
          startNotificationSentry();
        } else {
          setBtn(btn, false, "Sign In");
          showFormError("login-form", resp.message);
        }
      })
      .withFailureHandler((err) => {
        setBtn(btn, false, "Sign In");
        showFormError("login-form", err.message);
      })
      .loginUser(email, pw);
  }


  function handlePasswordChange(e) {
    if (e) e.preventDefault();
    const currentPw = document.getElementById("current-password").value;
    const newPw = document.getElementById("new-password").value;
    const btn = document.getElementById("reset-btn");

    if (newPw.length < 8) {
      showFormError("reset-form", "Password must be at least 8 characters.");
      return;
    }

    setBtn(btn, true, "Updating…");

    google.script.run
      .withSuccessHandler((resp) => {
        if (resp.success) {
          App.user.needsPasswordChange = false;
          localStorage.setItem("summit_user", JSON.stringify(App.user));
          navigate();
        } else {
          setBtn(btn, false, "Update Password");
          showFormError("reset-form", resp.message);
        }
      })
      .withFailureHandler((err) => {
        setBtn(btn, false, "Update Password");
        showFormError("reset-form", err.message);
      })
      .changeUserPassword(App.user.employeeNo, currentPw, newPw);
  }

  /* ── Action Handlers ────────────────────────────────────────── */
  async function doClock(type) {
    const fn = type === "in" ? "clockIn" : "clockOut";
    const resId = "attendance-clock-result";
    const slot = document.getElementById(resId);

    if (slot) slot.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-[#c9a236]" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Initializing session...</span>`;

    let photoData = null;
    let locationData = "Location Unknown";

    try {
      if (slot) slot.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-[#c9a236]" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Authenticating identity...</span>`;
      photoData = await captureAttendancePhoto();
    } catch (e) {
      console.warn("Photo failed", e);
      photoData = null;
    }

    if (slot) slot.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-[#c9a236]" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Verifying location...</span>`;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationData = `LAT: ${pos.coords.latitude.toFixed(4)}, LNG: ${pos.coords.longitude.toFixed(4)}`;
          executeClock(fn, type, slot, locationData, photoData);
        },
        (err) => {
          locationData = "Location Denied";
          executeClock(fn, type, slot, locationData, photoData);
        },
        { timeout: 5000 }
      );
    } else {
      executeClock(fn, type, slot, "Geo Not Supported", photoData);
    }
  }

  async function captureAttendancePhoto() {
    return new Promise(async (resolve, reject) => {
      const video = document.getElementById('att-video');
      const canvas = document.getElementById('att-canvas');
      if (!video || !canvas) return reject("Missing elements");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise(res => video.onloadedmetadata = res);
        
        // Capture after slight delay to ensure focus
        setTimeout(() => {
          const context = canvas.getContext('2d');
          context.drawImage(video, 0, 0, 640, 480);
          const data = canvas.toDataURL('image/jpeg', 0.7);
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          resolve(data);
        }, 800);
      } catch (e) {
        reject(e);
      }
    });
  }

  function executeClock(fn, type, slot, locationData, photoData) {
    google.script.run
      .withSuccessHandler((resp) => {
        if (slot) {
          slot.innerHTML = `<span style="color:${resp.success ? "#059669" : "#b30000"}">${
            resp.success
              ? type === "in"
                ? "✓ Clocked In successfully"
                : "✓ Clocked Out successfully (" + resp.hours + "h)"
              : "✗ " + resp.message
          }</span>`;
        }
        if (resp.success) {
          if (typeof loadAttendance === "function") loadAttendance();
          showToast(type === "in" ? "Shift Started Successfully" : "Shift Ended Successfully", "success");
        }
      })
      [fn](App.user, locationData, photoData);
  }

  function reviewLeave(leaveId, action) {
    const remarks =
      action === "reject" ? prompt("Rejection reason (optional):") : "";
    google.script.run
      .withSuccessHandler((resp) => {
        if (resp.success) loadLeave();
        else alert(resp.message);
      })
      .reviewLeaveRequest(leaveId, action, App.user.employeeNo, remarks || "");
  }

  function changeRole(empNo, newRole) {
    google.script.run
      .withSuccessHandler((resp) => {
        if (!resp.success) alert(resp.message);
      })
      .updateAccountRole(empNo, newRole);
  }

  function toggleStatus(empNo) {
    google.script.run
      .withSuccessHandler((resp) => {
        if (resp.success) loadAccessControl();
        else alert(resp.message);
      })
      .toggleAccountStatus(empNo);
  }

  /* ── Leave Modal ─────────────────────────────────────────────── */
  function openLeaveModal() {
    const today = new Date().toISOString().split("T")[0];
    const modal = document.createElement("div");
    modal.id = "leave-modal";
    modal.style.cssText =
      "position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;";
    modal.innerHTML = `
      <div style="background:#fff;border-radius:8px;padding:40px;width:100%;max-width:440px;box-shadow:0 8px 48px rgba(0,0,0,0.12);">
        <h3 style="font-family:'DM Serif Display',serif;font-size:1.5rem;color:#000;margin-bottom:8px;">File Leave Request</h3>
        <p style="font-size:0.875rem;color:#93939f;font-family:'Inter',sans-serif;margin-bottom:28px;">Submit a leave request for HR review.</p>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="t-label" style="display:block;margin-bottom:6px;">Leave Type</label>
            <select id="leave-type" class="c-input" style="cursor:pointer;" onchange="validateLeaveGuard()">
              <option disabled selected>— Select Leave Category</option>
              <option>Annual</option>
              <option>Sick</option>
              <option>Vacation</option>
              <option>Emergency</option>
              <option>Additional</option>
              <option>Birthday</option>
              <option>Others</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label class="t-label" style="display:block;margin-bottom:6px;">Start Date</label>
              <input type="date" id="leave-start" class="c-input" min="${today}" oninput="validateLeaveGuard()">
            </div>
            <div>
              <label class="t-label" style="display:block;margin-bottom:6px;">End Date</label>
              <input type="date" id="leave-end" class="c-input" min="${today}" oninput="validateLeaveGuard()">
            </div>
          </div>
          <div>
            <label class="t-label" style="display:block;margin-bottom:6px;">Reason</label>
            <textarea id="leave-reason" class="c-input" rows="3" placeholder="Brief reason for leave…" style="resize:vertical;"></textarea>
          </div>
        </div>
        <div id="leave-guard-warning" style="margin-top:16px;display:none;padding:12px;background:#fef2f2;border-radius:8px;border:1px solid #fee2e2;"></div>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button id="leave-submit-btn" class="btn-solid" onclick="submitLeave()" style="flex:1;">Submit Request</button>
          <button class="btn-outline" onclick="document.getElementById('leave-modal').remove()" style="flex:1;text-align:center;">Cancel</button>
        </div>
        <div id="leave-result" style="margin-top:12px;"></div>
      </div>`;
    document.body.appendChild(modal);
  }

  function submitLeave() {
    const start = document.getElementById("leave-start").value;
    const end = document.getElementById("leave-end").value;
    if (!start || !end) {
      alert("Please select both start and end dates.");
      return;
    }
    const days = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
    const payload = {
      leaveType: document.getElementById("leave-type").value,
      startDate: start,
      endDate: end,
      days,
      reason: document.getElementById("leave-reason").value,
    };
    const result = document.getElementById("leave-result");
    result.textContent = "Submitting…";
    google.script.run
      .withSuccessHandler((resp) => {
        if (resp.success) {
          showToast("Leave request filed successfully!");
          document.getElementById("leave-modal").remove();
          loadLeave();
          // Update dashboard stats
          google.script.run.withSuccessHandler(d => {
             App.user.balanceSummary = d.personalLeaveBalance;
          }).getDashboardStats(App.user);
        } else {
          result.innerHTML = `<p style="color:#ef4444;font-size:0.75rem;font-weight:700;">⚠ ${resp.message}</p>`;
          showToast(resp.message, "error");
        }
      })
      .submitLeaveRequest(App.user, payload);
  }

  function validateLeaveGuard() {
    const type = document.getElementById("leave-type").value;
    const start = document.getElementById("leave-start").value;
    const end = document.getElementById("leave-end").value;
    const btn = document.getElementById("leave-submit-btn");
    const warning = document.getElementById("leave-guard-warning");
    const b = App.user.balanceSummary;
    
    if (!type || !start || !end) return;
    if (!b) return;

    const diff = new Date(end) - new Date(start);
    const requestedDays = Math.max(0, Math.round(diff / 86400000) + 1);

    if (diff < 0) {
      warning.innerHTML = `<p style="color:#ef4444;font-size:0.75rem;font-weight:700;">⚠ Invalid Selection: End date is before Start date.</p>`;
      warning.style.display = "block";
      btn.disabled = true;
      btn.style.opacity = "0.5";
      return;
    }

    let remaining = 99;
    if (["Annual", "Sick", "Vacation", "Emergency"].includes(type)) remaining = b.SIL?.remaining || 0;
    else if (type === "Additional") remaining = b.Additional?.remaining || 0;
    else if (type === "Birthday") {
       if (!b.Birthday?.isEligible) {
          warning.innerHTML = `<p style="color:#ef4444;font-size:0.75rem;font-weight:700;">⚠ Month Mismatch: Birthday leave only allowed during your birth month.</p>`;
          warning.style.display = "block";
          btn.disabled = true;
          btn.style.opacity = "0.5";
          return;
       }
       remaining = b.Birthday?.remaining || 0;
    }

    if (requestedDays > remaining) {
      warning.innerHTML = `<p style="color:#ef4444;font-size:0.75rem;font-weight:700;">⚠ Exceeds Balance: You requested ${requestedDays} days but only have ${remaining} available.</p>`;
      warning.style.display = "block";
      btn.disabled = true;
      btn.style.opacity = "0.5";
    } else {
      warning.style.display = "none";
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  }

  /* ── Provision Modal ─────────────────────────────────────────── */
  /* ── Provision Modal ─────────────────────────────────────────── */
  /* ── Utilities ──────────────────────────────────────────────── */
  function setBtn(btn, disabled, label) {
    if (!btn) return;
    btn.disabled = disabled;
    btn.textContent = label;
  }

  function showFormError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;
    const old = form.querySelector(".form-error");
    if (old) old.remove();
    const el = document.createElement("p");
    el.className = "form-error";
    el.style.cssText =
      'font-family:"IBM Plex Mono",monospace;font-size:0.75rem;color:#b30000;padding:10px 14px;background:rgba(179,0,0,0.05);border:1px solid rgba(179,0,0,0.15);border-radius:8px;margin-top:12px;';
    el.textContent = message;
    form.appendChild(el);
  }

  /**
   * Toggles input between 'password' and 'text'
   */
  function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const svg = btn.querySelector("svg");

    if (input.type === "password") {
      input.type = "text";
      svg.innerHTML =
        '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
      input.type = "password";
      svg.innerHTML =
        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
  }

  /* ── Notification & Toast Engine ────────────────────────── */

  /* ── Sidebar State Logic ──────────────────────────────────── */
  function toggleSidebarPin() {
    const sidebar = document.getElementById("main-sidebar");
    if (!sidebar) return;
    const isPinned = sidebar.classList.contains("sidebar-pinned-active");
    if (isPinned) {
      sidebar.classList.remove("sidebar-pinned-active");
      localStorage.setItem("sidebarPinned", "false");
    } else {
      sidebar.classList.add("sidebar-pinned-active");
      localStorage.setItem("sidebarPinned", "true");
    }
    updatePinButtonIcon(!isPinned);
  }

  function applySidebarSavedState() {
    const sidebar = document.getElementById("main-sidebar");
    if (!sidebar) return;
    const isPinned =
      localStorage.getItem("sidebarPinned") === "true" ||
      localStorage.getItem("sidebarPinned") === true;
    if (isPinned) {
      sidebar.classList.add("sidebar-pinned-active");
      updatePinButtonIcon(true);
    }
  }

  function updatePinButtonIcon(isPinned) {
    const btn = document.getElementById("sidebar-pin-btn");
    if (!btn) return;
    if (isPinned) {
      btn.innerHTML =
        '<svg class="w-4 h-4 fill-current text-[#c9a236]" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 4v8l3.5 3.5v2H13v6l-1 1-1-1v-6H5.5v-2L9 12V4h6z"></path></svg>';
    } else {
      btn.innerHTML =
        '<svg class="w-4 h-4 text-white/20 hover:text-white transition-all" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 4v8l3.5 3.5v2H13v6l-1 1-1-1v-6H5.5v-2L9 12V4h6z"></path></svg>';
    }
  }

  function toggleNotifPanel() {
    const p = document.getElementById("notif-panel");
    if (!p) return;
    const isVisible = p.style.display === "flex";
    p.style.display = isVisible ? "none" : "flex";

    const sidebar = document.getElementById("main-sidebar");
    if (sidebar) {
      if (!isVisible) {
        sidebar.classList.remove("group", "lg:hover:w-[288px]", "lg:hover:p-8");
      } else {
        sidebar.classList.add("group", "lg:hover:w-[288px]", "lg:hover:p-8");
      }
    }

    if (!isVisible) fetchNotifications();
  }

  function fetchNotifications() {
    if (!App.user) return;
    google.script.run
      .withSuccessHandler((resp) => {
        if (!resp.success) return;
        renderNotifications(resp.items, resp.count);
      })
      .getNotifications(App.user);
  }

  function renderNotifications(items, unreadCount) {
    const badge = document.getElementById("notif-badge");
    const list = document.getElementById("notif-list");

    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? "flex" : "none";
    }

    if (list) {
      if (!items || items.length === 0) {
        list.innerHTML = `<p style="padding:32px;text-align:center;color:#93939f;font-size:0.75rem;">No notifications found.</p>`;
        return;
      }

          list.innerHTML = items
            .map(
              (i) => `
            <div class="notif-item ${i.status === "Unread" ? "unread" : ""}" onclick="handleNotifClick('${i.id}', '${i.type}', '${i.message.replace(/'/g, "\\'")}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span class="tier-pill tier-${i.tier.toString().toUpperCase()}">${i.tier === "SUPPORT" ? "Support Required" : (i.tier == 1 ? "Action Required" : "Info")}</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:0.65rem;color:#93939f;">${formatNotifDate(i.timestamp)}</span>
                  <button class="notif-remove-btn" onclick="removeNotification(event, '${i.id}')">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
              <p style="font-size:0.8125rem;font-weight:700;color:#1c1707;margin-bottom:2px;">${i.title}</p>
              <p style="font-size:0.75rem;color:#796120;line-height:1.4;">${i.message}</p>
            </div>
          `,
            )
            .join("");
    }
  }

  function handleNotifClick(notifId, type, message = "") {
    google.script.run
      .withSuccessHandler(() => fetchNotifications())
      .markNotificationRead(notifId);
    
    // Support Deep Linking Logic
    if (message.includes("Support Request") || message.includes("Request from")) {
      const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
         const targetEmail = emailMatch[0];
         loadSection("directory");
         setTimeout(() => {
            const searchInput = document.getElementById("directory-search");
            if (searchInput) {
               searchInput.value = targetEmail;
               filterDirectory();
               
               // Auto-open if only one result
               setTimeout(() => {
                  const rows = document.querySelectorAll("#directory-table-body tr");
                  if (rows.length === 1) {
                     const empNo = rows[0].cells[0].innerText.trim();
                     App.directoryState.deepLinkTab = 'tab-general'; // In 'General' we have security group
                     openEditProfile(empNo);
                  }
               }, 500);
            }
         }, 400);
         return;
      }
    }

    // Standard Links
    if (type === "Leave") loadSection("leave");
  }

  function removeNotification(e, notifId) {
    if (e) e.stopPropagation();
    const item = (e.target.closest) ? e.target.closest('.notif-item') : null;
    if (item) {
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      item.style.transition = 'all 0.3s ease';
    }
    google.script.run
      .withSuccessHandler(() => fetchNotifications())
      .archiveNotification(notifId);
  }

  function markAllAsRead() {
    const list = document.getElementById("notif-list");
    if (!list) return;
    const unread = list.querySelectorAll(".notif-item.unread");
    unread.forEach((el) => el.classList.remove("unread"));
    // Server side mark all logic could be added to Code.gs, but for now we just clear badge
    document.getElementById("notif-badge").style.display = "none";
  }

  function formatNotifDate(ts) {
    const date = new Date(ts);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  }

  /**
   * Global Toast Alerts
   */
  function showToast(message, type = "success") {
    const old = document.getElementById("global-toast");
    if (old) old.remove();

    const colors = {
      success: "#c9a236",
      error: "#991b1b",
      info: "#3b82f6",
    };
    const color = colors[type] || colors.success;

    const toast = document.createElement("div");
    toast.id = "global-toast";
    toast.style.cssText = `
      position:fixed; bottom:32px; right:32px; z-index:9999;
      background:#ffffff; padding:16px 24px; border-radius:12px;
      box-shadow:0 12px 48px rgba(28, 23, 7, 0.15); border-left:4px solid ${color};
      font-family:'Inter',sans-serif; font-size:0.875rem; font-weight:600; color:#1c1707;
      display:flex; align-items:center; gap:12px; transform:translateZ(0);
      animation: slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    `;

    let iconHtml = "";
    if (type === "success") iconHtml = '<path d="M5 13l4 4L19 7"/>';
    else if (type === "error") iconHtml = '<path d="M18 6L6 18M6 6l12 12"/>';
    else
      iconHtml =
        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';

    toast.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="${color}" stroke-width="2" viewBox="0 0 24 24">
        ${iconHtml}
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.4s ease";
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  /**
   * Support & Dispatch Systems
   */
  function submitSupportRequest() {
    const email = document.getElementById("support-email").value;
    const type = document.getElementById("support-type").value;
    const message = document.getElementById("support-message").value;
    const btn = document.getElementById("support-submit-btn");

    if (!email || !message) {
      showToast("Please fill in your email and message.", "error");
      return;
    }

    setBtn(btn, true, "Sending...");
    google.script.run
      .withSuccessHandler((resp) => {
        setBtn(btn, false, "Submit Request");
        if (resp.success) {
          showToast(resp.message);
          closeModal("support-dispatch-modal");
        } else showToast(resp.message, "error");
      })
      .submitSupportRequest({ email, type, message });
  }

  function copyToClipboard(text) {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }

  function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPw = input.type === "password";
    input.type = isPw ? "text" : "password";
    btn.style.opacity = isPw ? "1" : "0.4";
  }

  function startNotificationSentry() {
    if (notificationSentryInterval) clearInterval(notificationSentryInterval);
    // Poll every 2 minutes for new support/system alerts
    notificationSentryInterval = setInterval(() => {
       if (App.currentView !== 'login') fetchNotifications();
    }, 120000);
  }

  /**
   * ── Dashboard Identity Bar Helpers ───────────────────────────
   */
  function renderProfileIdentityBar(user, stats) {
    const isClockedIn = App.dashboardData && App.dashboardData.isClockedIn;
    const initials = user.completeName ? user.completeName.split(" ").map(n => n[0]).join("") : "U";
    
    const isSuperAdmin = user.role && user.role.toUpperCase() === 'SUPERADMIN';
    const statusBadgeHTML = !isSuperAdmin ? `<div class="id-micro-badge">Status: ${isClockedIn ? 'ON-DUTY' : 'OFF-DUTY'}</div>` : '';
    
    return `
      <div class="id-bar anim-up" style="animation-delay: 0.05s;">
        <!-- Ghost Action Layer -->
        <div class="id-actions-overlay">
          <p class="text-[10px] font-black text-[#c9a236] uppercase tracking-[0.2em] mb-2">ID Command Center</p>
          ${!isSuperAdmin ? `
          <button class="btn-solid !py-2 !px-8 text-[10px] w-40" onclick="toggleDutyStatus()">
            ${isClockedIn ? 'End Shift' : 'Begin Shift'}
          </button>
          ` : ''}
          <button class="btn-outline !py-2 !px-8 text-[10px] w-40 bg-white" onclick="openProfileEditor()">
            ${isSuperAdmin ? 'Edit Account' : 'Edit Identity'}
          </button>
        </div>

        <!-- Avatar Portal -->
        <div class="avatar-portal" onclick="handleAvatarClick()">
          ${user.profilePhoto ? `<img src="${user.profilePhoto}" id="id-bar-avatar">` : `<div class="w-full h-full bg-[#faf6eb] flex items-center justify-center text-[#c9a236] font-black text-2xl">${initials}</div>`}
          <div class="upload-overlay">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
        </div>

        <!-- Identity Details -->
        <div>
          <h2 class="text-xl font-black text-[#1c1707] mb-1">${user.completeName}</h2>
          <div class="flex items-center justify-center gap-3 mb-4">
            <span class="text-[10px] font-black text-[#c9a236] uppercase tracking-widest">${user.role}</span>
            <div class="w-1 h-1 bg-gray-200 rounded-full"></div>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${user.department || 'General'}</span>
          </div>
          
          <!-- Sub-Badge Row (Session Info) -->
          <div class="flex items-center justify-center gap-2">
            <div class="id-micro-badge">ID: ${user.employeeNo}</div>
            ${statusBadgeHTML}
          </div>
        </div>
      </div>
    `;
  }

  function handleAvatarClick() {
    document.getElementById('avatar-input').click();
  }

  function uploadProfilePhoto(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    showToast("Processing profile photo...", "info");
    
    reader.onload = function(e) {
      const base64 = e.target.result;
      google.script.run
        .withSuccessHandler(resp => {
          if (resp.success) {
            App.user.profilePhoto = resp.url;
            try { localStorage.setItem("summit_user", JSON.stringify(App.user)); } catch(e){}
            
            showToast("Profile photo updated successfully!");
            
            // Sync Dashboard
            loadDashboard(); 
            
            // Sync Modal if open
            const modalPrev = document.getElementById('modal-avatar-preview');
            if (modalPrev) {
               modalPrev.src = resp.url;
               modalPrev.style.display = 'block';
               if (document.getElementById('avatar-fallback')) document.getElementById('avatar-fallback').style.display = 'none';
            }
          } else {
            showToast(resp.message, "error");
          }
        })
        .updateProfilePhoto(base64);
    };
    reader.readAsDataURL(file);
  }

  function toggleDutyStatus() {
    const isClockedIn = App.dashboardData && App.dashboardData.isClockedIn;
    // Route to our hardened Face-Gate attendance pipeline
    doClock(isClockedIn ? 'out' : 'in');
  }

  function handleCardGlow(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const glow = card.querySelector(".notiglow");
    const bglow = card.querySelector(".notiborderglow");
    
    if (glow) {
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    }
    if (bglow) {
      bglow.style.left = `${x}px`;
      bglow.style.top = `${y}px`;
    }
  }

  function openProfileEditor() {
    const u = App.user;
    if (!u) return;

    // Avatar Hero
    const preview = document.getElementById('modal-avatar-preview');
    if (u.profilePhoto) {
      preview.src = u.profilePhoto;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
      if (document.getElementById('modal-avatar-preview-container')) {
         const initials = u.completeName ? u.completeName.split(" ").map(n => n[0]).join("") : "U";
         document.getElementById('modal-avatar-preview-container').innerHTML = `<img src="" id="modal-avatar-preview" class="w-full h-full object-cover" style="display:none;"><div id="avatar-fallback" class="w-full h-full bg-[#faf6eb] flex items-center justify-center text-[#c9a236] font-black text-4xl">${initials}</div>`;
      }
    }

    // Corporate (Read-Only)
    document.getElementById('prof-name').value = u.completeName || '';
    document.getElementById('prof-id').value = u.employeeNo || '';
    document.getElementById('prof-dept').value = u.department || 'General';
    document.getElementById('prof-role').value = u.role || 'Employee';

    // Personal (Editable)
    // We map the raw App.user data (which follows the sheet headers)
    document.getElementById('prof-mobile').value = u["Mobile No."] || '';
    document.getElementById('prof-civil').value = u["Civil Status"] || 'Single';
    document.getElementById('prof-address').value = u["Complete Address"] || '';
    document.getElementById('prof-emergency-name').value = u["Emergency Contact Person"] || '';
    document.getElementById('prof-emergency-phone').value = u["Emergency Contact No."] || '';

    openModal('edit-profile-modal');
  }

  function submitProfileUpdate() {
    const payload = {
      "Mobile No.": document.getElementById('prof-mobile').value,
      "Civil Status": document.getElementById('prof-civil').value,
      "Complete Address": document.getElementById('prof-address').value,
      "Emergency Contact Person": document.getElementById('prof-emergency-name').value,
      "Emergency Contact No.": document.getElementById('prof-emergency-phone').value
    };

    showToast("Committing changes...", "info");
    
    google.script.run
      .withSuccessHandler(resp => {
        if (resp.success) {
          showToast("Profile updated successfully!");
          // Merge updates into local state
          Object.assign(App.user, payload);
          try {
            localStorage.setItem("summit_user", JSON.stringify(App.user));
          } catch(e) { console.warn("Local storage sync failed", e); }
          closeModal('edit-profile-modal');
          loadDashboard(); // Refresh UI if necessary
        } else {
          showToast(resp.message, "error");
        }
      })
      .updateProfileSelf(payload);
  }
</script>
