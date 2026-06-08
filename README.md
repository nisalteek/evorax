# EvoraX - School Events Platform

A web-based event management system for EvoraX National School, Colombo. Students, teachers, and parents can browse events, register for activities, get QR tickets, and download participation certificates.

---

## Features

**Event browsing**
- View all events with category filters (debate, sports, exhibition, cultural, academic, music, drama, science)
- Filter by status (upcoming, ongoing, completed)
- Search events by name
- Featured events section on homepage

**Event registration**
- Register for any upcoming event
- Choose ticket type (General, Student, VIP)
- Add special requirements during registration
- Automatic QR code generation for each ticket

**Digital tickets**
- PDF ticket download with QR code
- Ticket includes event details, attendee name, and unique ID
- QR code can be scanned at venue entry

**Participation certificates**
- Automatic certificate generation after event completion
- PDF download with student name and event details
- School seal and signature placeholders

**Countdown timers**
- Live countdown on homepage for upcoming events
- Shows days, hours, minutes, seconds remaining

**Announcements board**
- Latest news and notices displayed on homepage
- Pinned announcements stay on top
- Different types: general, urgent, event, result, holiday

**Calendar view**
- Monthly calendar showing all events
- Click any date to see events on that day

**User authentication**
- Register as Student, Teacher, or Parent
- Login with email and password
- JWT token based authentication

**User dashboard**
- View your registered events
- See your ticket count
- Quick access to tickets and certificates

**My tickets page**
- List of all your registrations
- View ticket details
- Download ticket PDF
- Download certificate (for completed events)
- Cancel registration option

**Profile management**
- Update name, phone number, grade
- Change password

**Event feedback**
- Rate events from 1 to 5 stars
- Leave written comments
- View average ratings and other feedback

**Contact messages**
- Send messages to school administration
- Contact form collects name, email, subject, message

**Admin panel**
- Dashboard with statistics (total users, events, registrations, upcoming events, new messages)
- Manage events (create, edit, delete)
- Manage users (view all, change roles, activate/deactivate, delete)
- Manage announcements (create, edit, pin, delete)
- View contact messages and mark as read

**Visual features**
- Dark and light theme toggle
- Three.js animated background with floating particles
- GSAP scroll animations
- Responsive design works on mobile, tablet, desktop

---

## Tech Stack

**Backend**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- PDFKit for PDF generation
- QR code library

**Frontend**
- Vanilla JavaScript (no framework)
- HTML5
- CSS3 with dark/light theme variables
- Three.js for 3D background
- GSAP for scroll animations
- Font Awesome 6 for icons

---

## Setup Instructions

**Prerequisites**
- Node.js 18 or higher
- MongoDB (local or Atlas cloud)

**Installation steps**

```bash
# Download the code
git clone https://github.com/nisalteek/evorax.git
cd evorax

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database URL and secret keys

# Seed the database
npm run seed

# Start development server
npm run dev
Open http://localhost:5000

Default accounts after seeding

Admin: admin@evorax.lk / Admin@2024

Student: ariyaratna@student.evorax.lk / Student@123

Environment Variables
Create a .env file with these values:

text
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evorax
JWT_SECRET=your_random_secret_key
SESSION_SECRET=your_another_random_secret_key
NODE_ENV=development
ADMIN_EMAIL=admin@evorax.lk
ADMIN_PASSWORD=Admin@2024
Project Structure
text
evorax/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   └── Others.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── registrations.js
│   │   ├── tickets.js
│   │   ├── admin.js
│   │   ├── feedback.js
│   │   ├── announcements.js
│   │   └── contact.js
│   ├── utils/
│   │   └── seed.js
│   └── server.js
├── frontend/
│   └── public/
│       ├── index.html
│       ├── css/
│       │   └── main.css
│       └── js/
│           └── app.js
├── .env.example
├── package.json
└── README.md
API Endpoints
Public routes

POST /api/auth/register - Create account

POST /api/auth/login - Login

GET /api/events - List events

GET /api/events/upcoming - Upcoming events

GET /api/events/featured - Featured events

GET /api/events/:id - Single event

GET /api/announcements - List announcements

POST /api/contact - Send contact message

Protected routes (login required)

GET /api/auth/me - Current user

PUT /api/auth/profile - Update profile

PUT /api/auth/change-password - Change password

POST /api/registrations - Register for event

GET /api/registrations/my - My registrations

GET /api/registrations/check/:eventId - Check registration status

DELETE /api/registrations/:id - Cancel registration

GET /api/tickets/:id - Ticket data

GET /api/tickets/:id/pdf - Download ticket PDF

GET /api/tickets/:id/certificate - Download certificate PDF

POST /api/feedback - Submit event feedback

Admin routes

GET /api/admin/stats - Dashboard statistics

GET /api/admin/users - List all users

PUT /api/admin/users/:id/toggle - Activate/deactivate user

PUT /api/admin/users/:id/role - Change user role

DELETE /api/admin/users/:id - Delete user

POST /api/events - Create event

PUT /api/events/:id - Update event

DELETE /api/events/:id - Delete event

POST /api/announcements - Create announcement

PUT /api/announcements/:id - Update announcement

DELETE /api/announcements/:id - Delete announcement

GET /api/admin/contacts - View contact messages

PUT /api/admin/contacts/:id - Mark message as read

Deployment
Backend on Render

Push code to GitHub

Create new Web Service on Render

Connect GitHub repository

Build command: npm install

Start command: npm start

Add environment variables

Deploy

Frontend on Netlify

Push code to GitHub

Create new site on Netlify

Connect repository

Publish directory: frontend/public

Deploy

Update API base URL in app.js to point to your Render backend

Common Issues
Garbled text on tickets or certificates
Clear the titleSinhala, descriptionSinhala, and venueSinhala fields from events in the database.

MongoDB connection fails on Render
Check MONGODB_URI is correct. Add 0.0.0.0/0 to IP whitelist in MongoDB Atlas.

Port scan timeout on Render
Make sure server binds to process.env.PORT and listens on 0.0.0.0.