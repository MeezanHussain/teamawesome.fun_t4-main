# 📘 Backend API Documentation
## 📌 Project Overview
This backend is built using **Node.js (Express.js)** and integrates with a **PostgreSQL** database using the `pg` module. The system supports:
- Secure user registration and login via **JWT authentication**
- Full **user profile management** (bio, name, visibility)
- **Link management** (add/edit/remove)
- Middleware-driven **input validation** using **Zod**
- Sanitized user input to prevent **XSS**
- Robust **error handling** with custom status codes and messages

---

## ⚙️ Setup Guide

### 🔧 Prerequisites
- Node.js >= 16.x
- PostgreSQL database
- AWS RDS or local DB (with correct pg_hba config)
- `.env` file (see below)

### 🛠 Installation

```bash
git clone <your-repo-url>
cd backend
npm install
cp .env.example .env
npm start
```

### 🌱 .env Variables

| Key | Description |
|-----|-------------|
| `NODE_ENV` | `"development"` or `"production"` |
| `DB_USER` / `DEV_DB_USER` | DB username |
| `DB_PASSWORD` / `DEV_DB_PASSWORD` | DB password |
| `DB_HOST` / `DEV_DB_HOST` | DB host URL/IP |
| `DB_NAME` / `DEV_DB_NAME` | DB name |
| `DB_PORT` | Postgres port (default: 5432) |
| `JWT_SECRET` | Secret key to sign JWTs |
| `JWT_EXPIRES_IN` | e.g., `1d`, `2h` |
| `DB_SCHEMA` / `DEV_SCHEMA` | Schema to connect to |
| `DB_SSL` | `"true"` if RDS/SSL required |

---

## 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Register a new user | ❌ |
| POST | `/login` | Login & receive token | ❌ |
| GET | `/me` | Get current user info | ✅ |

---

## 👤 Profile Routes (`/api/profile`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Fetch profile info | ✅ |
| PUT | `/name` | Update first & last name | ✅ |
| PUT | `/bio` | Update or clear bio | ✅ |
| PUT | `/password` | Change user password | ✅ |
| DELETE | `/delete` | Permanently delete account | ✅ |

---

## 🔗 Link Routes (`/api/profile/links`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Add a new link | ✅ |
| GET | `/` | Get all links | ✅ |
| PUT | `/:id` | Edit a specific link | ✅ |
| DELETE | `/:id` | Delete a link | ✅ |

---

## 📐 Middleware

| File | Purpose |
|------|---------|
| `auth.js` | JWT authentication + DB user check |
| `errorHandler.js` | Formats errors with `status`, `code`, `message` |
| `validateName.js` | Validates first/last name using Zod |
| `validateEmail.js` | Validates email format |
| `validatePassword.js` | Enforces strong passwords |
| `validateBio.js` | Allows markdown-safe, XSS-free bios |
| `validateLink.js` | Validates link title + URL fields |

---

## ❗ Error Handling Format

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 🛢️ Assumed Database Tables

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY NOT NULL,

  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,

  password TEXT NOT NULL CHECK (char_length(password) >= 8),

  bio TEXT CHECK (char_length(bio) <= 1000),
  profile_picture_url TEXT CHECK (char_length(profile_picture_url) <= 500),

  is_profile_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user links
CREATE TABLE user_links (
  id SERIAL PRIMARY KEY,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(100) NOT NULL CHECK (char_length(title) > 0),
  url TEXT NOT NULL CHECK (char_length(url) <= 500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

---

## 🧪 Test the API

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{ "firstName": "Test", "lastName": "User", "email": "test@example.com", "password": "Strong1!" }'
```

---

## 📅 Last Updated
*April 18, 2025*

---
© 2025 – Team4 Swinburne
