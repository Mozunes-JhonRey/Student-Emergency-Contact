# Data Gatherer — Complete Setup

A web form to collect and save personal and guardian contact information to a MySQL database.

## What It Does

- **Form (info.html)** — Collects: full name, address, birthday, phone, guardian name, guardian phone
- **Server (server.js)** — Validates, saves to MySQL, provides REST API
- **Database** — Persistent storage in `data_gatherer.submissions` table

## Files

- `info.html` — Web form (client-side)
- `server.js` — Express backend (handles form submissions, connects to MySQL)
- `package.json` — Node.js dependencies
- `MySQL Local.session.sql` — SQL script to create database & table
- `README.md` — API documentation
- `SETUP_GUIDE.md` — Installation guide

## Quick Start

### 1. Create Database & Table (one-time)

**In MySQL Workbench:**
1. Open `MySQL Local.session.sql`
2. Execute the script (Ctrl+Enter)
3. Verify: `DESCRIBE data_gatherer.submissions;`

# Data Gatherer — Setup & Usage

Data Gatherer is a Node.js + Express application that accepts personal and guardian contact information via a web form and stores submissions in a MySQL database.

## Key Components

- `info.html` — Client-side form for collecting submissions
- `server.js` — Express backend: validates input, exposes REST endpoints, and writes to MySQL
- `MySQL Local.session.sql` — SQL script to create the `data_gatherer` database and `submissions` table
- `package.json` — Project dependencies and start script

## Quick Start

1) Create the database and table

   - Open `MySQL Local.session.sql` in MySQL Workbench and execute the script.
   - Confirm table creation: `DESCRIBE data_gatherer.submissions;`

2) Install dependencies and start the server

   ```powershell
   cd "C:\Users\JZIAH\Desktop\database"
   npm install
   npm start
   ```

   The server should log a successful database connection and the listening URL (default: `http://localhost:3000`).

3) Open the form

   - Visit `http://localhost:3000/info.html` in your browser, complete the fields, and submit.

## Database Schema (summary)

The `submissions` table stores contact details, optional guardian information, a `source` field, and timestamps (`created_at`, `updated_at`). Indexes are provided on `created_at` and `name` for efficient queries.

Example schema (see `MySQL Local.session.sql` for full definition):

```sql
CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  birthday DATE NOT NULL,
  phone VARCHAR(30) NOT NULL,
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(30),
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API (overview)

- POST `/api/submissions` — Create a submission. Expects JSON with `name`, `address`, `birthday`, `phone`; `guardian_name`, `guardian_phone`, and `source` are optional. Returns `201` and the new record ID.
- GET `/api/submissions` — List submissions (supports `limit` and `offset` query parameters).
- GET `/api/submissions/:id` — Retrieve a single submission by ID.
- DELETE `/api/submissions/:id` — Delete a submission.
- GET `/health` — Basic health endpoint.

Full request/response examples are included in the original README; keep them for integration testing.

## Query Examples (MySQL)

```sql
USE data_gatherer;
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 10;
SELECT * FROM submissions WHERE name LIKE '%John%';
SELECT DATE(created_at) AS date, COUNT(*) AS count FROM submissions GROUP BY DATE(created_at);
```

## Configuration

You can override connection and server settings using environment variables before running `npm start`:

```powershell
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = ""
$env:DB_NAME = "data_gatherer"
$env:PORT = "3000"
npm start
```

## Troubleshooting

- "npm: The term 'npm' is not recognized" — Install Node.js from https://nodejs.org and restart your shell.
- "ECONNREFUSED 127.0.0.1:3306" — Ensure MySQL is running.
- "Access denied for user" — Verify credentials and permissions for the configured MySQL user.
- Form submits but no data saved — Check server logs for errors and confirm the `data_gatherer.submissions` table exists.

## Production Recommendations

For production deployments:

1. Use environment variables for secrets (DB credentials).
2. Protect admin endpoints with authentication and authorization.
3. Add rate limiting and input validation.
4. Serve the app over HTTPS and enforce CORS policies as needed.
5. Implement regular database backups and monitoring.

---

Screenshots for the Data Gatherer app

This folder contains example screenshots used in the project README. The files below are present in this directory and are referenced by the main documentation.

Screenshots included


Screenshots for the Data Gatherer app

This folder contains example screenshots used in the project README. The files below are present in this directory and are referenced by the main documentation.

Screenshots included

- `home-page.png` — The application form view (served at `/info.html`).
<img width="1351" height="635" alt="home-page" src="https://github.com/user-attachments/assets/793b87fa-dc21-4a79-b830-ea4234f7bfe3" />
  
- `data-gatherer.png` — Application header / landing view showing the app branding.
<img width="1349" height="634" alt="data-gatherer" src="https://github.com/user-attachments/assets/70da829d-1307-4806-9be5-fc575c7298ac" />
  
- `save-state.png` — Example of the form autosave or draft state stored in the browser.
<img width="1345" height="625" alt="save-state" src="https://github.com/user-attachments/assets/faea2c2d-bdbe-4c3c-a15b-0815d413f6e9" />

- `output.png` — Server or client output showing submission confirmation or console logs.
<img width="1340" height="630" alt="output" src="https://github.com/user-attachments/assets/ecdf50e2-a563-4e85-a20e-1d82f28e5b7c" />





