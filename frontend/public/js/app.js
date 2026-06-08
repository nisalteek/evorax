/* ═══════════════════════════════════════════════════════════
   EVORAX — FRONTEND APPLICATION
   Three.js hero, GSAP animations, full SPA routing
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── STATE ──────────────────────────────────────────────── */
const App = {
  user: null,
  token: null,
  currentPage: 'home',
  events: [],
  eventsPage: 1,
  eventsCategory: 'all',
  eventsStatus: '',
  eventsSearch: '',
  calendarDate: new Date(),
  calendarEvents: [],
  pendingEventId: null,
  editingEventId: null,
  editingAnnId: null,
  feedbackEventId: null,
};

/* ─── API ────────────────────────────────────────────────── */
const API = {
  base: 'https://evorax.onrender.com/api',
  async req(method, path, body, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && App.token) headers['Authorization'] = `Bearer ${App.token}`;
    try {
      const res = await fetch(this.base + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  },
  get: (path, auth) => API.req('GET', path, null, auth),
  post: (path, body, auth) => API.req('POST', path, body, auth),
  put: (path, body, auth) => API.req('PUT', path, body, auth),
  del: (path, auth) => API.req('DELETE', path, null, auth),
};

/* ─── AUTH HELPERS ───────────────────────────────────────── */
function saveAuth(token, user) {
  App.token = token;
  App.user = user;
  localStorage.setItem('vidu_token', token);
  localStorage.setItem('vidu_user', JSON.stringify(user));
  updateNavAuth();
}

function loadAuth() {
  const t = localStorage.getItem('vidu_token');
  const u = localStorage.getItem('vidu_user');
  if (t && u) {
    try {
      App.token = t;
      App.user = JSON.parse(u);
      updateNavAuth();
    } catch (_) {}
  }
}

function logout() {
  App.token = null;
  App.user = null;
  localStorage.removeItem('vidu_token');
  localStorage.removeItem('vidu_user');
  updateNavAuth();
  showPage('home');
  toast('Signed out successfully', 'success');
}

function updateNavAuth() {
  const authBtns = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const adminLink = document.getElementById('adminLink');
  const nameDisplay = document.getElementById('userNameDisplay');
  const avatarDisplay = document.getElementById('userAvatarDisplay');

  if (App.user) {
    authBtns.classList.add('hidden');
    userMenu.classList.remove('hidden');
    const firstName = (App.user.name || 'User').split(' ')[0];
    nameDisplay.textContent = firstName;
    avatarDisplay.textContent = (App.user.name || 'U')[0].toUpperCase();
    if (App.user.role === 'admin') {
      adminLink.classList.remove('hidden');
    } else {
      adminLink.classList.add('hidden');
    }
  } else {
    authBtns.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

/* ─── ROUTING ────────────────────────────────────────────── */
function showPage(name, params = {}) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (!page) return;
  page.classList.add('active');
  App.currentPage = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update nav active
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.route === name);
  });

  // Close mobile menu
  document.getElementById('navLinks').classList.remove('mobile-open');

  // Page-specific loaders
  switch (name) {
    case 'home':         loadHomeData(); break;
    case 'events':       loadEventsPage(); break;
    case 'announcements': loadAnnouncementsPage(); break;
    case 'calendar':     renderCalendar(); break;
    case 'dashboard':    loadDashboard(); break;
    case 'myTickets':    loadMyTickets(); break;
    case 'profile':      loadProfile(); break;
    case 'admin':
      if (!App.user || App.user.role !== 'admin') {
        toast('Admin access required', 'error');
        showPage('login');
        return;
      }
      loadAdminPanel();
      break;
    case 'event-detail':
      if (params.id) loadEventDetail(params.id);
      break;
    case 'login':
    case 'register':
      if (App.user) { showPage('home'); return; }
      break;
  }
}

/* ─── TOAST ──────────────────────────────────────────────── */
function toast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} toast-icon"></i><span class="toast-text">${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ─── MODAL ──────────────────────────────────────────────── */
function openModal(id) {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById(id).classList.add('active');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

/* ─── HOME PAGE ──────────────────────────────────────────── */
async function loadHomeData() {
  loadHeroStats();
  loadCountdowns();
  loadAnnouncementsBanner();
  loadFeaturedEvents();
}

async function loadHeroStats() {
  const [evRes, regRes] = await Promise.all([
    API.get('/events?limit=1'),
    API.get('/events/upcoming'),
  ]);
  animateCount('statEvents', evRes.total || 0);
  animateCount('statStudents', (evRes.total || 0) * 18);
  animateCount('statUpcoming', (regRes.events || []).length);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const step = target / 60;
  const interval = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.floor(start).toLocaleString();
    if (start >= target) clearInterval(interval);
  }, 25);
}

// Category images from Unsplash
function categoryImage(category) {
  const images = {
    debate: 'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?w=400&h=240&fit=crop',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=240&fit=crop',
    exhibition: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=240&fit=crop',
    cultural: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=240&fit=crop',
    academic: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=240&fit=crop',
    music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=240&fit=crop',
    drama: 'https://images.unsplash.com/photo-1507924538820-3a4a8145e33f?w=400&h=240&fit=crop',
    science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=240&fit=crop',
    other: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=240&fit=crop'
  };
  return images[category] || images.other;
}

async function loadCountdowns() {
  const res = await API.get('/events/upcoming');
  const container = document.getElementById('countdownCarousel');
  if (!container) return;
  const events = res.events || [];

  if (!events.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No upcoming events</p></div>`;
    return;
  }

  container.innerHTML = events.map(ev => {
    const cat = ev.category || 'event';
    const icon = categoryIcon(cat);
    const catImg = categoryImage(ev.category);
    return `
      <div class="countdown-card" onclick="showPage('event-detail', {id:'${ev._id}'})">
        <div class="countdown-card-img" style="height:140px;overflow:hidden;border-radius:12px;margin-bottom:1rem">
          <img src="${catImg}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div class="countdown-card-cat">${icon} ${cat.toUpperCase()}</div>
        <div class="countdown-card-title">${ev.title}</div>
        ${ev.titleSinhala ? `<div class="countdown-card-si">${ev.titleSinhala}</div>` : ''}
        <div class="countdown-timer" id="timer-${ev._id}" data-date="${ev.date}"></div>
        <div class="countdown-venue"><i class="fa-solid fa-location-dot"></i>${ev.venue}</div>
      </div>`;
  }).join('');

  startAllTimers(events);
}

function startAllTimers(events) {
  events.forEach(ev => {
    updateTimer(ev._id, ev.date);
    setInterval(() => updateTimer(ev._id, ev.date), 1000);
  });
}

function updateTimer(id, dateStr) {
  const el = document.getElementById(`timer-${id}`);
  if (!el) return;
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) { el.innerHTML = '<span style="color:var(--success);font-weight:600">Happening Now!</span>'; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.innerHTML = [
    { n: d, l: 'Days' }, { n: h, l: 'Hours' },
    { n: m, l: 'Mins' }, { n: s, l: 'Secs' }
  ].map(u => `<div class="timer-unit"><span class="timer-num">${String(u.n).padStart(2,'0')}</span><span class="timer-lbl">${u.l}</span></div>`).join('');
}

async function loadAnnouncementsBanner() {
  const res = await API.get('/announcements');
  const container = document.getElementById('announcementsList');
  if (!container) return;
  const list = (res.announcements || []).slice(0, 4);
  container.innerHTML = list.length
    ? list.map(a => announcementHTML(a)).join('')
    : '<div class="empty-state"><i class="fa-solid fa-bullhorn"></i><p>No announcements</p></div>';
}

function announcementHTML(a) {
  const typeIcons = { urgent: 'fa-triangle-exclamation', event: 'fa-calendar-star', holiday: 'fa-sun', result: 'fa-trophy', general: 'fa-bullhorn' };
  const date = new Date(a.createdAt).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
  return `
    <div class="announcement-item ${a.type} ${a.isPinned ? 'ann-pinned' : ''}">
      <div class="ann-type-icon"><i class="fa-solid ${typeIcons[a.type] || typeIcons.general}"></i></div>
      <div class="ann-content">
        ${a.isPinned ? '<span class="ann-pin"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}
        <div class="ann-title">${a.title}</div>
        ${a.titleSinhala ? `<div class="ann-si">${a.titleSinhala}</div>` : ''}
        <div class="ann-body">${a.content}</div>
      </div>
      <div class="ann-date">${date}</div>
    </div>`;
}

async function loadFeaturedEvents() {
  const res = await API.get('/events/featured');
  const grid = document.getElementById('featuredEventsGrid');
  if (!grid) return;
  const events = res.events || [];
  grid.innerHTML = events.length
    ? events.map(ev => eventCardHTML(ev)).join('')
    : '<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No featured events yet</p></div>';
  animateCards('.events-preview-section .event-card');
}

/* ─── EVENT CARD ─────────────────────────────────────────── */
function eventCardHTML(ev) {
  const categoryImg = categoryImage(ev.category);
  const img = ev.image || categoryImg;
  const date = new Date(ev.date).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
  const spotsLeft = ev.capacity - (ev.registeredCount || 0);
  const price = ev.ticketPrice === 0 ? 'Free' : `LKR ${ev.ticketPrice.toLocaleString()}`;
  return `
    <div class="event-card" onclick="showPage('event-detail', {id:'${ev._id}'})">
      <div class="event-card-img">
        <img src="${img}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.src='${categoryImg}'">
        <span class="event-cat-badge">${ev.category}</span>
        <span class="event-status-badge status-${ev.status}">${ev.status}</span>
      </div>
      <div class="event-card-body">
        <div class="event-card-title">${ev.title}</div>
        ${ev.titleSinhala ? `<div class="event-card-si">${ev.titleSinhala}</div>` : ''}
        <div class="event-card-meta">
          <span class="meta-item"><i class="fa-solid fa-calendar"></i>${date}</span>
          <span class="meta-item"><i class="fa-solid fa-clock"></i>${ev.time}</span>
          <span class="meta-item"><i class="fa-solid fa-location-dot"></i>${ev.venue.split(',')[0]}</span>
        </div>
        <div class="event-card-footer">
          <span class="event-price">${price}</span>
          <span class="event-spots">${spotsLeft > 0 ? spotsLeft + ' spots left' : 'Full'}</span>
        </div>
      </div>
    </div>`;
}

/* ─── EVENTS PAGE ────────────────────────────────────────── */
async function loadEventsPage() {
  const res = await API.get(`/events?category=${App.eventsCategory}&status=${App.eventsStatus}&search=${encodeURIComponent(App.eventsSearch)}&page=${App.eventsPage}&limit=12`);
  const grid = document.getElementById('eventsGrid');
  const pagination = document.getElementById('eventsPagination');
  if (!grid) return;

  const events = res.events || [];
  grid.innerHTML = events.length
    ? events.map(ev => eventCardHTML(ev)).join('')
    : '<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-calendar-xmark"></i><p>No events found</p></div>';

  // Pagination
  const pages = res.pages || 1;
  pagination.innerHTML = Array.from({ length: pages }, (_, i) => i + 1)
    .map(p => `<button class="${p === App.eventsPage ? 'active' : ''}" onclick="goToEventsPage(${p})">${p}</button>`)
    .join('');

  animateCards('#eventsGrid .event-card');
}

function goToEventsPage(p) {
  App.eventsPage = p;
  loadEventsPage();
  document.getElementById('page-events').scrollIntoView({ behavior: 'smooth' });
}

/* ─── EVENT DETAIL PAGE ──────────────────────────────────── */
async function loadEventDetail(id) {
  const container = document.getElementById('eventDetailContent');
  container.innerHTML = '<div class="loading-spinner"></div>';

  const [evRes, fbRes, regRes] = await Promise.all([
    API.get(`/events/${id}`),
    API.get(`/feedback/event/${id}`),
    App.user ? API.get(`/registrations/check/${id}`, true) : Promise.resolve({ registered: false }),
  ]);

  if (!evRes.success) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Event not found</p></div>';
    return;
  }

  const ev = evRes.event;
  const isRegistered = regRes.registered;
  const reg = regRes.registration;
  const price = ev.ticketPrice === 0 ? 'Free' : `LKR ${ev.ticketPrice.toLocaleString()}`;
  const spotsLeft = ev.capacity - (ev.registeredCount || 0);
  const pct = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));
  const date = new Date(ev.date).toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const categoryImg = categoryImage(ev.category);
  const heroImg = ev.image || categoryImg;

  const imgSection = `
    <div class="event-detail-hero">
      <img src="${heroImg}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover">
      <div class="event-detail-hero-overlay"></div>
    </div>`;

  const liveSection = ev.liveUpdates && ev.liveUpdates.length ? `
    <div class="live-updates">
      <h4><span class="live-dot"></span>Live Updates</h4>
      ${ev.liveUpdates.slice().reverse().slice(0, 5).map(u => `
        <div class="live-update-item">
          <div>${u.message}</div>
          <div class="live-update-time">${new Date(u.timestamp).toLocaleTimeString('en-LK')}</div>
        </div>`).join('')}
    </div>` : '';

  // UPDATED: Added Cancel Registration button for registered users
  const regBtn = ev.status === 'completed' || ev.status === 'cancelled'
    ? `<button class="btn btn-ghost btn-full" disabled>Registration Closed</button>`
    : isRegistered
      ? `<div>
          <button class="btn btn-outline btn-full" style="margin-bottom:0.75rem" onclick="viewTicket('${reg._id}')"><i class="fa-solid fa-ticket"></i> View My Ticket</button>
          <button class="btn btn-danger btn-full" style="margin-bottom:0.75rem" onclick="cancelRegistration('${reg._id}', '${ev.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-xmark"></i> Cancel Registration</button>
          <button class="btn btn-ghost btn-full" onclick="openFeedbackModal('${ev._id}')"><i class="fa-solid fa-star"></i> Leave Feedback</button>
         </div>`
      : `<button class="btn btn-primary btn-full" onclick="openRegModal('${ev._id}','${ev.title.replace(/'/g,"\\'")}')"><i class="fa-solid fa-ticket"></i> Register Now</button>`;

  const feedback = fbRes.feedback || [];
  const avgRating = fbRes.averageRating || 0;
  const stars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));

  container.innerHTML = `
    ${imgSection}
    <div class="event-detail-body">
      <div class="event-detail-grid">
        <div class="event-detail-main">
          <div style="margin-bottom:0.5rem">
            <span class="event-cat-badge" style="position:static;display:inline-block;margin-bottom:0.75rem">${ev.category}</span>
            <span class="event-status-badge status-${ev.status}" style="position:static;display:inline-block;margin-left:0.5rem">${ev.status}</span>
          </div>
          <h1>${ev.title}</h1>
          ${ev.titleSinhala ? `<div class="si-title">${ev.titleSinhala}</div>` : ''}
          <div class="event-detail-meta-bar">
            <span class="meta-item"><i class="fa-solid fa-calendar"></i>${date}</span>
            <span class="meta-item"><i class="fa-solid fa-clock"></i>${ev.time}</span>
            <span class="meta-item"><i class="fa-solid fa-location-dot"></i>${ev.venue}</span>
            <span class="meta-item"><i class="fa-solid fa-user"></i>${ev.organizer}</span>
          </div>
          <div class="event-detail-desc">${ev.description}</div>
          ${ev.descriptionSinhala ? `<div class="event-detail-desc" style="font-size:0.95rem;color:var(--text3)">${ev.descriptionSinhala}</div>` : ''}
          ${ev.requirements ? `<div style="margin-top:1.5rem"><h4 style="margin-bottom:0.5rem;color:var(--text2)">Requirements</h4><p style="color:var(--text2)">${ev.requirements}</p></div>` : ''}
          ${ev.prizes && ev.prizes.length ? `
            <div style="margin-top:1.5rem">
              <h4 style="margin-bottom:0.85rem">🏆 Prizes</h4>
              <div style="display:flex;flex-wrap:wrap;gap:0.65rem">
                ${ev.prizes.map(p => `<div style="background:var(--gold-dim);border:1px solid var(--gold);border-radius:10px;padding:0.5rem 1rem"><strong style="color:var(--gold)">${p.place}</strong><br/><span style="font-size:0.82rem;color:var(--text2)">${p.prize}</span></div>`).join('')}
              </div>
            </div>` : ''}
          ${liveSection}

          <!-- Feedback Section -->
          <div class="feedback-section">
            <div class="feedback-header">
              <h3 style="font-family:var(--font-display)">Event Feedback</h3>
              ${App.user && isRegistered ? `<button class="btn btn-outline" onclick="openFeedbackModal('${ev._id}')"><i class="fa-solid fa-star"></i> Rate Event</button>` : ''}
            </div>
            ${feedback.length ? `
              <div class="feedback-rating-summary">
                <div class="rating-big">${avgRating.toFixed(1)}</div>
                <div>
                  <div class="rating-stars">${stars}</div>
                  <div style="font-size:0.82rem;color:var(--text3)">${fbRes.total} review${fbRes.total !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div>${feedback.map(f => `
                <div class="feedback-item">
                  <div class="feedback-author">${f.authorName}</div>
                  <div class="feedback-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</div>
                  <div class="feedback-text">${f.comment}</div>
                </div>`).join('')}
              </div>` : '<p style="color:var(--text3)">No feedback yet. Be the first to review!</p>'}
          </div>
        </div>

        <!-- Sidebar -->
        <div>
          <div class="event-sidebar-card">
            <div class="sidebar-price">${price} <small>${ev.currency || 'LKR'}</small></div>
            <div class="sidebar-capacity">
              <i class="fa-solid fa-users"></i>
              ${ev.registeredCount} / ${ev.capacity} registered
            </div>
            <div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%"></div></div>
            <p style="font-size:0.78rem;color:var(--text3);margin-bottom:1.25rem">${spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Fully booked'}</p>
            ${ev.registrationDeadline ? `<p style="font-size:0.78rem;color:var(--warning);margin-bottom:1rem"><i class="fa-solid fa-clock"></i> Deadline: ${new Date(ev.registrationDeadline).toLocaleDateString('en-LK')}</p>` : ''}
            ${App.user ? regBtn : `<button class="btn btn-primary btn-full" onclick="showPage('login')"><i class="fa-solid fa-right-to-bracket"></i> Login to Register</button>`}
          </div>
        </div>
      </div>
    </div>`;

  gsapAnimate();
}

/* ─── REGISTRATION ───────────────────────────────────────── */
function openRegModal(eventId, title) {
  if (!App.user) { showPage('login'); return; }
  App.pendingEventId = eventId;
  document.getElementById('modalEventTitle').textContent = `Register: ${title}`;
  openModal('modal-register-event');
}

async function confirmEventRegistration() {
  if (!App.pendingEventId) return;
  const btn = document.getElementById('confirmRegBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;margin:0"></div>';

  const res = await API.post('/registrations', {
    eventId: App.pendingEventId,
    ticketType: document.getElementById('ticketTypeSelect').value,
    attendeePhone: document.getElementById('regPhone2').value,
    specialRequirements: document.getElementById('regRequirements').value,
  }, true);

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-ticket"></i> Confirm Registration';

  if (res.success) {
    closeModal();
    toast('Registration confirmed!', 'success');
    if (App.currentPage === 'event-detail') {
      loadEventDetail(App.pendingEventId);
    }
    App.pendingEventId = null;
  } else {
    toast(res.message || 'Registration failed', 'error');
  }
}

/* ─── TICKETS ────────────────────────────────────────────── */
async function viewTicket(regId) {
  const res = await API.get(`/tickets/${regId}`, true);
  if (!res.success) { toast('Ticket not found', 'error'); return; }

  const reg = res.registration;
  const ev = reg.event || {};
  const date = ev.date ? new Date(ev.date).toLocaleDateString('en-LK', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : '';

  document.getElementById('ticketModalBody').innerHTML = `
    <div class="ticket-display">
      <div class="ticket-display-top" style="background:#1a1a35">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
          <div>
            <div style="font-family:var(--font-display);color:var(--gold);font-size:1.4rem;font-weight:700">EVORAX</div>
            <div style="font-size:0.7rem;color:#8888aa;letter-spacing:0.15em">EVENT TICKET</div>
          </div>
          <div style="background:var(--gold-dim);border:1px solid var(--gold);border-radius:8px;padding:0.3rem 0.75rem;font-size:0.7rem;font-weight:600;color:var(--gold);text-transform:uppercase">${ev.category || 'event'}</div>
        </div>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:600;color:#fff;margin-bottom:0.25rem">${ev.title || ''}</div>
        ${ev.titleSinhala ? `<div style="font-size:0.85rem;color:#8888aa;margin-bottom:1rem">${ev.titleSinhala}</div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1rem">
          <div><div style="font-size:0.7rem;color:#8888aa;text-transform:uppercase;letter-spacing:0.1em">Date</div><div style="font-size:0.88rem;color:#fff;font-weight:500">${date}</div></div>
          <div><div style="font-size:0.7rem;color:#8888aa;text-transform:uppercase;letter-spacing:0.1em">Time</div><div style="font-size:0.88rem;color:#fff;font-weight:500">${ev.time || ''}</div></div>
          <div><div style="font-size:0.7rem;color:#8888aa;text-transform:uppercase;letter-spacing:0.1em">Venue</div><div style="font-size:0.88rem;color:#fff;font-weight:500">${(ev.venue || '').split(',')[0]}</div></div>
          <div><div style="font-size:0.7rem;color:#8888aa;text-transform:uppercase;letter-spacing:0.1em">Ticket Type</div><div style="font-size:0.88rem;color:var(--gold);font-weight:600;text-transform:uppercase">${reg.ticketType || 'general'}</div></div>
        </div>
        <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:0.7rem;color:#8888aa;text-transform:uppercase;letter-spacing:0.1em">Attendee</div>
          <div style="font-size:1rem;color:#fff;font-weight:600">${reg.attendeeName}</div>
          <div style="font-size:0.8rem;color:#8888aa">${reg.attendeeEmail}</div>
        </div>
      </div>
      <div class="ticket-display-qr" style="background:#0f0f23;flex-direction:column;gap:0.85rem">
        ${reg.qrCode ? `<img src="${reg.qrCode}" alt="QR Code" style="width:180px;height:180px;border-radius:12px;border:4px solid var(--surface2)">` : '<div style="width:180px;height:180px;background:var(--surface2);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--text3)">No QR</div>'}
        <div class="ticket-id-display">${reg.ticketId}</div>
        <div style="font-size:0.72rem;color:#555577;text-align:center">Scan this QR at the venue entrance</div>
      </div>
    </div>
    <p style="font-size:0.78rem;color:var(--text3);text-align:center">Status: <strong style="color:${reg.status==='confirmed'?'var(--success)':'var(--warning)'}">${reg.status.toUpperCase()}</strong></p>`;

  document.getElementById('downloadTicketBtn').onclick = () => downloadTicket(regId);
  document.getElementById('downloadCertBtn').onclick = () => downloadCertificate(regId);
  openModal('modal-ticket');
}

function downloadTicket(regId) {
  window.open(`/api/tickets/${regId}/pdf?token=${App.token}`, '_blank');
  fetch(`/api/tickets/${regId}/pdf`, {
    headers: { Authorization: `Bearer ${App.token}` }
  }).then(res => res.blob()).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${regId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }).catch(() => toast('Download failed', 'error'));
}

function downloadCertificate(regId) {
  fetch(`/api/tickets/${regId}/certificate`, {
    headers: { Authorization: `Bearer ${App.token}` }
  }).then(res => res.blob()).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${regId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Certificate downloaded!', 'success');
  }).catch(() => toast('Download failed', 'error'));
}

/* ─── MY TICKETS PAGE ────────────────────────────────────── */
async function loadMyTickets() {
  if (!App.user) { showPage('login'); return; }
  const container = document.getElementById('myTicketsList');
  container.innerHTML = '<div class="loading-spinner"></div>';

  const res = await API.get('/registrations/my', true);
  const regs = res.registrations || [];

  if (!regs.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-ticket-simple"></i><p>No registrations yet. <a href="#" onclick="showPage('events')" style="color:var(--gold)">Browse events</a></p></div>`;
    return;
  }

  container.innerHTML = regs.map(r => {
    const ev = r.event || {};
    const date = ev.date ? new Date(ev.date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const statusColor = r.status === 'confirmed' ? 'var(--success)' : r.status === 'attended' ? 'var(--gold)' : 'var(--warning)';
    const categoryImg = categoryImage(ev.category);
    const img = ev.image || categoryImg;
    return `
      <div class="ticket-item">
        <div class="ticket-img">
          <img src="${img}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div class="ticket-info">
          <div class="ticket-title">${ev.title || 'Unknown Event'}</div>
          <div class="ticket-meta">
            ${date ? `<span><i class="fa-solid fa-calendar" style="color:var(--gold)"></i> ${date}</span>` : ''}
            ${ev.venue ? `<span><i class="fa-solid fa-location-dot" style="color:var(--gold)"></i> ${ev.venue.split(',')[0]}</span>` : ''}
            <span><i class="fa-solid fa-tag" style="color:var(--gold)"></i> ${r.ticketType}</span>
          </div>
          <div class="ticket-id">${r.ticketId}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
          <span class="ticket-status" style="background:rgba(0,0,0,0.2);color:${statusColor};border:1px solid ${statusColor}">${r.status.toUpperCase()}</span>
          <div class="ticket-actions">
            <button class="btn btn-outline btn-xs" onclick="viewTicket('${r._id}')"><i class="fa-solid fa-eye"></i> View</button>
            <button class="btn btn-danger btn-xs" onclick="cancelRegistration('${r._id}', '${ev.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button class="btn btn-ghost btn-xs" onclick="downloadCertificate('${r._id}')"><i class="fa-solid fa-certificate"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ─── ANNOUNCEMENTS PAGE ─────────────────────────────────── */
async function loadAnnouncementsPage() {
  const container = document.getElementById('announcementsPageList');
  container.innerHTML = '<div class="loading-spinner"></div>';
  const res = await API.get('/announcements');
  const list = res.announcements || [];
  container.innerHTML = list.length
    ? list.map(a => announcementHTML(a)).join('')
    : '<div class="empty-state"><i class="fa-solid fa-bullhorn"></i><p>No announcements at this time</p></div>';
}

/* ─── CALENDAR ───────────────────────────────────────────── */
async function renderCalendar() {
  const res = await API.get('/events?limit=100');
  App.calendarEvents = res.events || [];

  const d = App.calendarDate;
  const year = d.getFullYear();
  const month = d.getMonth();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  document.getElementById('calMonthYear').textContent = `${months[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const grid = document.getElementById('calendarGrid');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day other-month"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const thisDate = new Date(year, month, day);
    const isToday = thisDate.toDateString() === today.toDateString();
    const eventsOnDay = App.calendarEvents.filter(ev => {
      const evDate = new Date(ev.date);
      return evDate.getFullYear() === year && evDate.getMonth() === month && evDate.getDate() === day;
    });
    html += `
      <div class="cal-day${isToday ? ' today' : ''}${eventsOnDay.length ? ' has-event' : ''}" onclick="showCalDayEvents(${year},${month},${day})">
        ${day}
        ${eventsOnDay.length ? `<div class="cal-event-dot"></div>` : ''}
      </div>`;
  }

  grid.innerHTML = html;
  showCalDayEvents(year, month, today.getDate());
}

function showCalDayEvents(year, month, day) {
  const eventsOnDay = App.calendarEvents.filter(ev => {
    const d = new Date(ev.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
  const container = document.getElementById('calendarEventsList');
  if (!eventsOnDay.length) {
    container.innerHTML = `<p style="color:var(--text3);text-align:center;padding:1rem">No events on this day</p>`;
    return;
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  container.innerHTML = eventsOnDay.map(ev => `
    <div class="cal-event-item" onclick="showPage('event-detail', {id:'${ev._id}'})">
      <div class="cal-event-date-box">
        <div class="cal-date-num">${day}</div>
        <div class="cal-date-mon">${months[month]}</div>
      </div>
      <div style="flex:1">
        <div style="font-weight:600;margin-bottom:0.2rem">${ev.title}</div>
        <div style="font-size:0.8rem;color:var(--text3)">${ev.time} — ${ev.venue.split(',')[0]}</div>
      </div>
      <span class="event-cat-badge" style="position:static">${ev.category}</span>
    </div>`).join('');
}

/* ─── DASHBOARD ──────────────────────────────────────────── */
async function loadDashboard() {
  if (!App.user) { showPage('login'); return; }
  document.getElementById('dashboardGreeting').textContent = `Welcome, ${App.user.name.split(' ')[0]}!`;
  const res = await API.get('/registrations/my', true);
  const regs = res.registrations || [];
  document.getElementById('dashTicketCount').textContent = regs.length;
  document.getElementById('dashRegistrations').textContent = regs.filter(r => r.status !== 'cancelled').length;

  const container = document.getElementById('dashboardRegistrations');
  if (!regs.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No registrations yet. <a href="#" onclick="showPage('events')" style="color:var(--gold)">Browse events</a></p></div>`;
    return;
  }
  container.innerHTML = regs.slice(0, 5).map(r => {
    const ev = r.event || {};
    const date = ev.date ? new Date(ev.date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' }) : '';
    const categoryImg = categoryImage(ev.category);
    const img = ev.image || categoryImg;
    return `
      <div class="ticket-item">
        <div class="ticket-img"><img src="${img}" style="width:100%;height:100%;object-fit:cover"></div>
        <div class="ticket-info">
          <div class="ticket-title">${ev.title || ''}</div>
          <div class="ticket-meta">${date ? `<span>${date}</span>` : ''}<span>${r.ticketId}</span></div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-ghost btn-xs" onclick="viewTicket('${r._id}')"><i class="fa-solid fa-eye"></i></button>
          <button class="btn btn-danger btn-xs" onclick="cancelRegistration('${r._id}', '${ev.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
  }).join('');
}

/* ─── PROFILE ────────────────────────────────────────────── */
function loadProfile() {
  if (!App.user) { showPage('login'); return; }
  const u = App.user;
  document.getElementById('profileAvatar').textContent = (u.name || 'U')[0].toUpperCase();
  document.getElementById('profileName').textContent = u.name || '';
  document.getElementById('profileRole').textContent = u.role || 'student';
  document.getElementById('profileEmail').textContent = u.email || '';
  document.getElementById('profileNameInput').value = u.name || '';
  document.getElementById('profilePhone').value = u.phone || '';
  document.getElementById('profileGrade').value = u.grade || '';
}

/* ─── CONTACT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type=submit]');
      btn.disabled = true;
      const res = await API.post('/contact', {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value,
      });
      btn.disabled = false;
      if (res.success) {
        toast('Message received!', 'success');
        contactForm.reset();
      } else {
        toast(res.message || 'Failed to send', 'error');
      }
    });
  }
});

/* ─── FEEDBACK ───────────────────────────────────────────── */
function openFeedbackModal(eventId) {
  if (!App.user) { showPage('login'); return; }
  App.feedbackEventId = eventId;
  document.getElementById('feedbackEventId').value = eventId;
  document.getElementById('feedbackRating').value = 0;
  document.getElementById('feedbackComment').value = '';
  setupStarRating();
  openModal('modal-feedback');
}

function setupStarRating() {
  const stars = document.querySelectorAll('#starRating i');
  stars.forEach((star, i) => {
    star.className = 'fa-regular fa-star';
    star.addEventListener('click', () => {
      document.getElementById('feedbackRating').value = i + 1;
      stars.forEach((s, j) => {
        s.className = j <= i ? 'fa-solid fa-star active' : 'fa-regular fa-star';
      });
    });
    star.addEventListener('mouseover', () => {
      stars.forEach((s, j) => s.className = j <= i ? 'fa-solid fa-star active' : 'fa-regular fa-star');
    });
  });
  document.getElementById('starRating').addEventListener('mouseleave', () => {
    const val = parseInt(document.getElementById('feedbackRating').value) || 0;
    stars.forEach((s, i) => s.className = i < val ? 'fa-solid fa-star active' : 'fa-regular fa-star');
  });
}

async function submitFeedback() {
  const rating = parseInt(document.getElementById('feedbackRating').value);
  const comment = document.getElementById('feedbackComment').value.trim();
  if (!rating) { toast('Please select a rating', 'warning'); return; }
  if (!comment) { toast('Please write a comment', 'warning'); return; }

  const res = await API.post('/feedback', {
    eventId: App.feedbackEventId,
    rating,
    comment,
  }, true);

  if (res.success) {
    closeModal();
    toast(res.message, 'success');
  } else {
    toast(res.message || 'Failed to submit feedback', 'error');
  }
}

/* ─── AUTH FORMS ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');
      err.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      const res = await API.post('/auth/login', {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value,
      });

      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';

      if (res.success) {
        saveAuth(res.token, res.user);
        toast(res.message, 'success');
        showPage('home');
      } else {
        err.textContent = res.message;
        err.classList.remove('hidden');
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('registerError');
      const btn = document.getElementById('registerBtn');
      err.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      const res = await API.post('/auth/register', {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        role: document.getElementById('regRole').value,
        phone: document.getElementById('regPhone').value,
        grade: document.getElementById('regGrade').value,
      });

      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';

      if (res.success) {
        saveAuth(res.token, res.user);
        toast(res.message, 'success');
        showPage('home');
      } else {
        err.textContent = res.message;
        err.classList.remove('hidden');
      }
    });
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await API.put('/auth/profile', {
        name: document.getElementById('profileNameInput').value,
        phone: document.getElementById('profilePhone').value,
        grade: document.getElementById('profileGrade').value,
      }, true);
      if (res.success) {
        App.user = res.user;
        localStorage.setItem('vidu_user', JSON.stringify(res.user));
        updateNavAuth();
        toast('Profile updated!', 'success');
        loadProfile();
      } else {
        toast(res.message || 'Update failed', 'error');
      }
    });
  }

  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await API.put('/auth/change-password', {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value,
      }, true);
      if (res.success) {
        toast('Password changed!', 'success');
        passwordForm.reset();
      } else {
        toast(res.message || 'Failed', 'error');
      }
    });
  }
});

function fillDemo(email, pass) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = pass;
}
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* ─── ADMIN PANEL ────────────────────────────────────────── */
async function loadAdminPanel() {
  loadAdminStats();
  loadAdminEvents();
  loadAdminUsers();
  loadAdminAnnouncements();
  loadAdminContacts();
}

async function loadAdminStats() {
  const res = await API.get('/admin/stats', true);
  if (!res.success) return;
  const { stats, recentEvents, recentUsers } = res;
  const items = [
    { n: stats.users, label: 'Users', icon: 'fa-users' },
    { n: stats.events, label: 'Events', icon: 'fa-calendar' },
    { n: stats.registrations, label: 'Registrations', icon: 'fa-ticket' },
    { n: stats.upcoming, label: 'Upcoming', icon: 'fa-clock' },
    { n: stats.contacts, label: 'New Messages', icon: 'fa-envelope' },
  ];
  document.getElementById('adminStatsGrid').innerHTML = items.map(s => `
    <div class="admin-stat-card">
      <div style="font-size:1.5rem;color:var(--gold);margin-bottom:0.5rem"><i class="fa-solid ${s.icon}"></i></div>
      <div class="admin-stat-num">${s.n}</div>
      <div class="admin-stat-label">${s.label}</div>
    </div>`).join('');

  document.getElementById('adminRecentEvents').innerHTML = (recentEvents || []).map(ev => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.65rem 0;border-bottom:1px solid var(--border2)">
      <div><div style="font-weight:500;font-size:0.88rem">${ev.title}</div><div style="font-size:0.75rem;color:var(--text3)">${new Date(ev.date).toLocaleDateString('en-LK')}</div></div>
      <span class="event-status-badge status-${ev.status}">${ev.status}</span>
    </div>`).join('');

  document.getElementById('adminRecentUsers').innerHTML = (recentUsers || []).map(u => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.65rem 0;border-bottom:1px solid var(--border2)">
      <div><div style="font-weight:500;font-size:0.88rem">${u.name}</div><div style="font-size:0.75rem;color:var(--text3)">${u.email}</div></div>
      <span class="role-badge" style="font-size:0.65rem">${u.role}</span>
    </div>`).join('');
}

async function loadAdminEvents() {
  const res = await API.get('/events?limit=50');
  const container = document.getElementById('adminEventsList');
  const events = res.events || [];
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
      <tbody>
        ${events.map(ev => `
          <tr>
            <td>${ev.title}</td>
            <td><span class="event-cat-badge" style="position:static">${ev.category}</span></td>
            <td>${new Date(ev.date).toLocaleDateString('en-LK')}</td>
            <td><span class="event-status-badge status-${ev.status}">${ev.status}</span></td>
            <td>${ev.registeredCount || 0}/${ev.capacity}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-xs" onclick="openEventModal('${ev._id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-danger btn-xs" onclick="deleteEvent('${ev._id}')"><i class="fa-solid fa-trash"></i></button>
              <button class="btn btn-outline btn-xs" onclick="showPage('event-detail',{id:'${ev._id}'})"><i class="fa-solid fa-eye"></i></button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function loadAdminUsers() {
  const res = await API.get('/admin/users', true);
  const container = document.getElementById('adminUsersList');
  const users = res.users || [];
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.name}</td>
            <td style="font-size:0.82rem">${u.email}</td>
            <td><span class="role-badge" style="font-size:0.65rem">${u.role}</span></td>
            <td style="font-size:0.82rem">${new Date(u.createdAt).toLocaleDateString('en-LK')}</td>
            <td><span style="color:${u.isActive ? 'var(--success)' : 'var(--danger)'};font-size:0.8rem;font-weight:600">${u.isActive ? 'Active' : 'Inactive'}</span></td>
            <td class="actions">
              <button class="btn btn-danger btn-xs" onclick="deleteUser('${u._id}')"><i class="fa-solid fa-trash"></i> Delete</button>
              <button class="btn btn-ghost btn-xs" onclick="toggleUser('${u._id}')">${u.isActive ? 'Deactivate' : 'Activate'}</button>
              <select class="select-input" style="font-size:0.75rem;padding:0.2rem 0.5rem" onchange="changeUserRole('${u._id}',this.value)">
                <option value="student" ${u.role==='student'?'selected':''}>Student</option>
                <option value="teacher" ${u.role==='teacher'?'selected':''}>Teacher</option>
                <option value="parent" ${u.role==='parent'?'selected':''}>Parent</option>
                <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
              </select>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function loadAdminAnnouncements() {
  const res = await API.get('/announcements');
  const container = document.getElementById('adminAnnouncementsList');
  const list = res.announcements || [];
  container.innerHTML = list.length ? `
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Type</th><th>Pinned</th><th>Actions</th></tr></thead>
      <tbody>
        ${list.map(a => `
          <tr>
            <td>${a.title}</td>
            <td>${a.type}</td>
            <td>${a.isPinned ? '📌' : '—'}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-xs" onclick="openAnnouncementModal('${a._id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-danger btn-xs" onclick="deleteAnnouncement('${a._id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>` : '<p style="color:var(--text3)">No announcements yet</p>';
}

async function loadAdminContacts() {
  const res = await API.get('/admin/contacts', true);
  const container = document.getElementById('adminContactsList');
  const contacts = res.contacts || [];
  container.innerHTML = contacts.length ? contacts.map(c => `
    <div style="background:var(--surface);border:1px solid var(--border${c.status==='new'?'':'2'});border-radius:var(--radius);padding:1.25rem;margin-bottom:0.85rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
        <div>
          <strong>${c.name}</strong> <span style="color:var(--text3);font-size:0.82rem">&lt;${c.email}&gt;</span>
          ${c.status === 'new' ? '<span style="background:var(--accent-dim);color:var(--accent);font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:4px;margin-left:0.5rem">NEW</span>' : ''}
        </div>
        <span style="font-size:0.75rem;color:var(--text3)">${new Date(c.createdAt).toLocaleDateString('en-LK')}</span>
      </div>
      <div style="font-weight:600;margin-bottom:0.3rem">${c.subject}</div>
      <div style="font-size:0.88rem;color:var(--text2)">${c.message}</div>
      ${c.status === 'new' ? `<button class="btn btn-ghost btn-xs" style="margin-top:0.75rem" onclick="markContactRead('${c._id}')">Mark as Read</button>` : ''}
    </div>`).join('')
  : '<p style="color:var(--text3)">No messages yet</p>';
}

/* ─── ADMIN ACTIONS ──────────────────────────────────────── */
function openEventModal(id = null) {
  App.editingEventId = id;
  const title = document.getElementById('eventFormTitle');

  if (id) {
    title.textContent = 'Edit Event';
    API.get(`/events/${id}`).then(res => {
      if (!res.success) return;
      const ev = res.event;
      document.getElementById('ef-title').value = ev.title || '';
      document.getElementById('ef-titleSinhala').value = ev.titleSinhala || '';
      document.getElementById('ef-description').value = ev.description || '';
      document.getElementById('ef-category').value = ev.category || 'debate';
      document.getElementById('ef-status').value = ev.status || 'upcoming';
      document.getElementById('ef-date').value = ev.date ? ev.date.split('T')[0] : '';
      document.getElementById('ef-time').value = ev.time || '';
      document.getElementById('ef-endDate').value = ev.endDate ? ev.endDate.split('T')[0] : '';
      document.getElementById('ef-venue').value = ev.venue || '';
      document.getElementById('ef-venueSinhala').value = ev.venueSinhala || '';
      document.getElementById('ef-organizer').value = ev.organizer || '';
      document.getElementById('ef-capacity').value = ev.capacity || 100;
      document.getElementById('ef-ticketPrice').value = ev.ticketPrice || 0;
      document.getElementById('ef-regDeadline').value = ev.registrationDeadline ? ev.registrationDeadline.split('T')[0] : '';
      document.getElementById('ef-image').value = ev.image || '';
      document.getElementById('ef-featured').checked = ev.featured || false;
      document.getElementById('ef-id').value = ev._id;
    });
  } else {
    title.textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('ef-id').value = '';
  }
  openModal('modal-event-form');
}

async function submitEventForm() {
  const id = document.getElementById('ef-id').value;
  const data = {
    title: document.getElementById('ef-title').value,
    titleSinhala: document.getElementById('ef-titleSinhala').value,
    description: document.getElementById('ef-description').value,
    category: document.getElementById('ef-category').value,
    status: document.getElementById('ef-status').value,
    date: document.getElementById('ef-date').value,
    time: document.getElementById('ef-time').value,
    endDate: document.getElementById('ef-endDate').value || undefined,
    venue: document.getElementById('ef-venue').value,
    venueSinhala: document.getElementById('ef-venueSinhala').value,
    organizer: document.getElementById('ef-organizer').value,
    capacity: parseInt(document.getElementById('ef-capacity').value),
    ticketPrice: parseFloat(document.getElementById('ef-ticketPrice').value) || 0,
    registrationDeadline: document.getElementById('ef-regDeadline').value || undefined,
    image: document.getElementById('ef-image').value,
    featured: document.getElementById('ef-featured').checked,
  };

  const res = id
    ? await API.put(`/events/${id}`, data, true)
    : await API.post('/events', data, true);

  if (res.success) {
    closeModal();
    toast(res.message, 'success');
    loadAdminEvents();
  } else {
    toast(res.message || 'Failed', 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  const res = await API.del(`/events/${id}`, true);
  if (res.success) { toast('Event deleted', 'success'); loadAdminEvents(); }
  else toast(res.message || 'Failed', 'error');
}

async function toggleUser(id) {
  const res = await API.put(`/admin/users/${id}/toggle`, {}, true);
  if (res.success) { toast('User status updated', 'success'); loadAdminUsers(); }
}

async function changeUserRole(id, role) {
  const res = await API.put(`/admin/users/${id}/role`, { role }, true);
  if (res.success) toast('Role updated', 'success');
}

async function markContactRead(id) {
  await API.put(`/admin/contacts/${id}`, {}, true);
  loadAdminContacts();
}

function openAnnouncementModal(id = null) {
  App.editingAnnId = id;
  document.getElementById('annFormTitle').textContent = id ? 'Edit Announcement' : 'Add Announcement';
  if (!id) { document.getElementById('announcementForm').reset(); document.getElementById('ann-id').value = ''; }
  else {
    API.get('/announcements').then(res => {
      const ann = (res.announcements || []).find(a => a._id === id);
      if (!ann) return;
      document.getElementById('ann-title').value = ann.title || '';
      document.getElementById('ann-titleSinhala').value = ann.titleSinhala || '';
      document.getElementById('ann-content').value = ann.content || '';
      document.getElementById('ann-type').value = ann.type || 'general';
      document.getElementById('ann-priority').value = ann.priority || 0;
      document.getElementById('ann-pinned').checked = ann.isPinned || false;
      document.getElementById('ann-id').value = ann._id;
    });
  }
  openModal('modal-announcement-form');
}

async function submitAnnouncementForm() {
  const id = document.getElementById('ann-id').value;
  const data = {
    title: document.getElementById('ann-title').value,
    titleSinhala: document.getElementById('ann-titleSinhala').value,
    content: document.getElementById('ann-content').value,
    type: document.getElementById('ann-type').value,
    priority: parseInt(document.getElementById('ann-priority').value) || 0,
    isPinned: document.getElementById('ann-pinned').checked,
    targetAudience: ['all'],
  };
  const res = id
    ? await API.put(`/announcements/${id}`, data, true)
    : await API.post('/announcements', data, true);
  if (res.success) { closeModal(); toast('Saved', 'success'); loadAdminAnnouncements(); }
  else toast(res.message || 'Failed', 'error');
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  const res = await API.del(`/announcements/${id}`, true);
  if (res.success) { toast('Deleted', 'success'); loadAdminAnnouncements(); }
}

/* ─── HELPERS ────────────────────────────────────────────── */
function categoryIcon(cat) {
  const icons = { debate: '<i class="fa-solid fa-comments"></i>', sports: '<i class="fa-solid fa-trophy"></i>', exhibition: '<i class="fa-solid fa-image"></i>', cultural: '<i class="fa-solid fa-masks-theater"></i>', academic: '<i class="fa-solid fa-book"></i>', music: '<i class="fa-solid fa-music"></i>', drama: '<i class="fa-solid fa-theater-masks"></i>', science: '<i class="fa-solid fa-flask"></i>', other: '<i class="fa-solid fa-star"></i>' };
  return icons[cat] || icons.other;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ─── GSAP ANIMATIONS ────────────────────────────────────── */
function gsapAnimate() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.event-card, .step-card, .dashboard-card, .ticket-item, .announcement-item').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

function animateCards(selector) {
  if (typeof gsap === 'undefined') return;
  gsap.utils.toArray(selector).forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, delay: i * 0.07, ease: 'power2.out' });
  });
}

/* ─── THREE.JS HERO ──────────────────────────────────────── */
function initThreeHero() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const count = 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    const isGold = Math.random() > 0.6;
    colors[i * 3] = isGold ? 0.78 : 0.48;
    colors[i * 3 + 1] = isGold ? 0.66 : 0.44;
    colors[i * 3 + 2] = isGold ? 0.3 : 0.94;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.7 });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  const shapes = [];
  const geoms = [
    new THREE.OctahedronGeometry(0.4),
    new THREE.TetrahedronGeometry(0.35),
    new THREE.IcosahedronGeometry(0.3),
  ];
  for (let i = 0; i < 6; i++) {
    const mesh = new THREE.Mesh(
      geoms[i % geoms.length],
      new THREE.MeshBasicMaterial({ color: 0xc9a84c, wireframe: true, transparent: true, opacity: 0.25 })
    );
    mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 2);
    mesh.userData = { rotX: (Math.random() - 0.5) * 0.01, rotY: (Math.random() - 0.5) * 0.012 };
    scene.add(mesh);
    shapes.push(mesh);
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame += 0.008;
    particles.rotation.y += 0.0006;
    particles.rotation.x += 0.0002;
    camera.position.x += (mouseX - camera.position.x) * 0.04;
    camera.position.y += (-mouseY - camera.position.y) * 0.04;
    shapes.forEach((s, i) => {
      s.rotation.x += s.userData.rotX;
      s.rotation.y += s.userData.rotY;
      s.position.y += Math.sin(frame + i) * 0.003;
    });
    renderer.render(scene, camera);
  }
  animate();
}

/* ─── SCROLL ANIMATIONS (GSAP) ───────────────────────────── */
function initScrollAnimations() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('.section-header').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  gsap.utils.toArray('.step-card').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 50, scale: 0.94 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.7, delay: i * 0.1,
      ease: 'back.out(1.4)',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  const pdiv = document.querySelector('.parallax-divider');
  if (pdiv) {
    gsap.to('.parallax-content', {
      y: -40,
      scrollTrigger: { trigger: pdiv, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  }

  gsap.utils.toArray('.countdown-card').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, x: i % 2 === 0 ? -30 : 30 }, {
      opacity: 1, x: 0, duration: 0.7, delay: i * 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
}

/* ─── NAVBAR SCROLL ──────────────────────────────────────── */
function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });

  document.getElementById('userAvatarBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.getElementById('userDropdown')?.classList.remove('open');
  });

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('mobile-open');
  });

  document.querySelectorAll('.nav-link[data-route]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.route);
    });
  });
}

/* ─── THEME ──────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('vidu_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vidu_theme', next);
    updateThemeIcon(next);
  });
}
function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = `fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
}

/* ─── ADMIN TABS ─────────────────────────────────────────── */
function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(`admin-tab-${tab.dataset.tab}`);
      if (content) content.classList.add('active');
    });
  });
}

/* ─── EVENTS FILTER LISTENERS ────────────────────────────── */
function initEventFilters() {
  document.querySelectorAll('.chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-cat]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      App.eventsCategory = chip.dataset.cat;
      App.eventsPage = 1;
      if (App.currentPage === 'events') loadEventsPage();
    });
  });

  let searchTimeout;
  document.getElementById('eventSearch')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      App.eventsSearch = e.target.value;
      App.eventsPage = 1;
      if (App.currentPage === 'events') loadEventsPage();
    }, 400);
  });

  document.getElementById('statusFilter')?.addEventListener('change', (e) => {
    App.eventsStatus = e.target.value;
    App.eventsPage = 1;
    if (App.currentPage === 'events') loadEventsPage();
  });
}

/* ─── CALENDAR NAV ───────────────────────────────────────── */
function initCalendarNav() {
  document.getElementById('calPrev')?.addEventListener('click', () => {
    App.calendarDate.setMonth(App.calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
    App.calendarDate.setMonth(App.calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

/* ─── LOADER ─────────────────────────────────────────────── */
function hideLoader() {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2000);
}

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadAuth();
  initTheme();
  initNavbar();
  initAdminTabs();
  initEventFilters();
  initCalendarNav();
  initThreeHero();
  hideLoader();

  setTimeout(() => {
    initScrollAnimations();
    showPage('home');

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({ delay: 2.2 });
      tl.from('.hero-badge', { opacity: 0, y: 20, duration: 0.7, ease: 'power2.out' })
        .from('.hero-title-en', { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .from('.hero-subtitle', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4')
        .from('.hero-cta', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.3')
        .from('.hero-stats', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.2')
        .from('.hero-scroll-hint', { opacity: 0, duration: 0.5 }, '-=0.1');
    }
  }, 100);
});

/* ─── ADMIN FUNCTIONS ──────────────────────────────────────── */
// Delete user (admin only)
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

  const res = await API.del(`/admin/users/${userId}`, true);
  if (res.success) {
    toast('User deleted successfully', 'success');
    loadAdminUsers(); // Refresh the user list
  } else {
    toast(res.message || 'Failed to delete user', 'error');
  }
}

// Cancel registration (for users and admins)
async function cancelRegistration(regId, eventTitle) {
  if (!confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) return;

  const res = await API.del(`/registrations/${regId}`, true);
  if (res.success) {
    toast('Registration cancelled successfully', 'success');
    if (App.currentPage === 'myTickets') {
      loadMyTickets();
    } else if (App.currentPage === 'dashboard') {
      loadDashboard();
    } else if (App.currentPage === 'event-detail') {
      loadEventDetail(App.pendingEventId);
    }
  } else {
    toast(res.message || 'Failed to cancel registration', 'error');
  }
}

// Make functions global
window.deleteUser = deleteUser;
window.cancelRegistration = cancelRegistration;