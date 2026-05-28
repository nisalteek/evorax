## EvoraX National School Events Platform

A full-stack school event management web platform built with Node.js, Express, MongoDB, Three.js, and GSAP.

---

## Features

- Cinematic Three.js hero with floating particles and GSAP scroll animations
- Dark / Light theme toggle
- Event listings with category filters, search, and pagination
- Live countdown timers for upcoming events
- Interactive monthly calendar view
- Announcements board (pinned, urgent, holiday types)
- User registration & login (JWT auth)
- Role-based access: Student, Teacher, Parent, Admin
- Event registration with QR-code digital tickets
- Downloadable PDF ticket (styled boarding-pass layout)
- Downloadable PDF participation certificate (A4 landscape)
- Admin panel: manage events, users, announcements, messages
- Event feedback & star ratings
- Contact page with message inbox
- Fully responsive — mobile-first

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| PDF | PDFKit |
| QR Code | qrcode |
| Frontend | Vanilla JS SPA |
| 3D / Animation | Three.js r128, GSAP 3 + ScrollTrigger |
| Icons | Font Awesome 6 |
| Fonts | Cormorant Garamond, DM Sans, Noto Sans Sinhala |

---

## Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Steps

```bash
# 1. Enter the project folder
cd evorax-events

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and set MONGODB_URI, JWT_SECRET, SESSION_SECRET

# 4. Seed the database with sample events and admin user
npm run seed

# 5. Start the development server
npm run dev

# 6. Open in browser
# http://localhost:5000
```

### Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@evorax.lk | Admin@2024 |
| Student | ariyaratna@student.evorax.lk | Student@123 |

---

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/evorax
JWT_SECRET=change_this_to_a_long_random_string
SESSION_SECRET=change_this_to_another_long_string
NODE_ENV=development
ADMIN_EMAIL=admin@evorax.lk
ADMIN_PASSWORD=Admin@2024
```

---

## Deploy to Render

1. Push code to a GitHub repository.
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect your GitHub repo.
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add all environment variables from `.env.example` in the Render dashboard.
7. Set `MONGODB_URI` to your MongoDB Atlas connection string.
8. Set `NODE_ENV=production`.
9. Deploy. After deploy, run the seed once via Render Shell: `npm run seed`.

### MongoDB Atlas (free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free M0 cluster.
3. Click **Connect** → **Connect your application**.
4. Copy the URI and replace `<password>` with your DB user password.
5. Paste into `MONGODB_URI` in Render environment variables.

---

## Deploy to Netlify (Frontend-only option)

> For full-stack, Render is recommended. Netlify works if you split frontend/backend.

For full-stack on Netlify:
1. Install Netlify CLI: `npm i -g netlify-cli`
2. `netlify init`
3. Set publish directory to `frontend/public`
4. Add a `netlify.toml` with redirect rules for the SPA.

---

## Project Structure

```
evorax-events/
├── backend/
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   └── Others.js         # Announcement, Feedback, Contact
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── registrations.js
│   │   ├── tickets.js        # PDF ticket + certificate
│   │   ├── admin.js
│   │   ├── feedback.js
│   │   ├── announcements.js
│   │   └── contact.js
│   ├── utils/
│   │   └── seed.js           # Database seeder
│   └── server.js
├── frontend/
│   └── public/
│       ├── index.html        # SPA shell
│       ├── css/
│       │   └── main.css      # Full design system
│       └── js/
│           └── app.js        # SPA logic, Three.js, GSAP
├── .env.example
├── .gitignore
├── package.json
├── Procfile                  # For Heroku / Render
└── README.md
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | User | Get current user |
| PUT | /api/auth/profile | User | Update profile |
| PUT | /api/auth/change-password | User | Change password |
| GET | /api/events | — | List events (filter, search, paginate) |
| GET | /api/events/upcoming | — | Upcoming events for countdown |
| GET | /api/events/featured | — | Featured events |
| GET | /api/events/:id | — | Single event |
| POST | /api/events | Admin | Create event |
| PUT | /api/events/:id | Admin | Update event |
| DELETE | /api/events/:id | Admin | Delete event |
| POST | /api/events/:id/live-update | Admin | Add live update |
| POST | /api/registrations | User | Register for event |
| GET | /api/registrations/my | User | My registrations |
| GET | /api/registrations/check/:eventId | User | Check if registered |
| PUT | /api/registrations/:id/cancel | User | Cancel registration |
| GET | /api/tickets/:id | User | Get ticket data |
| GET | /api/tickets/:id/pdf | User | Download ticket PDF |
| GET | /api/tickets/:id/certificate | User | Download certificate PDF |
| GET | /api/announcements | — | List announcements |
| POST | /api/announcements | Admin | Create announcement |
| POST | /api/feedback | User | Submit feedback |
| GET | /api/feedback/event/:id | — | Event feedback |
| POST | /api/contact | — | Submit contact message |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | All users |
| PUT | /api/admin/users/:id/toggle | Admin | Toggle user active |
| PUT | /api/admin/users/:id/role | Admin | Change user role |
| GET | /api/admin/contacts | Admin | All contact messages |

---

## License

Built for EvoraX National School, Colombo, Sri Lanka.
