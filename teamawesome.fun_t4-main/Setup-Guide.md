# 🧩 TeamAwesome.Fun – Full Stack Project

A full-stack application with a **React (Vite)** frontend, **Node.js + Express** backend, **PostgreSQL** database, and **AWS S3 mock via LocalStack**, all containerized using Docker.

---

## ⚙️ Prerequisites

Ensure the following are installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)
- (Optional) [Node.js >=16.x](https://nodejs.org/) — only required if running outside Docker

---

## 📦 Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone https://github.com/BusyBitsRocks/teamawesome.fun_t4.git
   cd teamawesome.fun_t4
   ```

2. **Create Environment File**

   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Update `.env` (if needed)**  
   The provided `.env` is pre-configured for development using Docker + LocalStack.  
   AWS credentials and S3 bucket are emulated using LocalStack.

4. **Start All Services**
   ```bash
   docker-compose up --build
   ```

---

## 🔗 Application URLs

| Service     | URL                             | Description                  |
| ----------- | ------------------------------- | ---------------------------- |
| Frontend    | http://localhost:5173           | React (Vite) Frontend        |
| Backend API | http://localhost:3000           | Node.js + Express API        |
| LocalStack  | http://localhost:4566           | AWS S3 Mock (via LocalStack) |
| PostgreSQL  | Host: `localhost`, Port: `5432` | PostgreSQL DB (Docker only)  |

---

## 📂 Project Structure

```
teamawesome.fun_t4/
├── backend/              # Express API
│   └── .env              # Environment configuration
├── frontend/             # React frontend (Vite)
├── docker-compose.yml    # Docker Compose configuration
└── README.md             # You're here!
```

---

## 🐳 Useful Docker Commands

```bash
# 🛑 Stop and remove containers + volumes
docker-compose down -v

# 🧹 Remove all unused Docker volumes
docker volume prune -f

# 🚀 Rebuild and start everything
docker-compose up --build

# 🔁 Start in background (detached mode)
docker-compose up -d

# 🧼 Remove stopped containers/images/networks/volumes (careful!)
docker system prune -a

# 🐚 Open a shell inside a container (e.g., backend)
docker exec -it teamawesomefun_t4-backend-1 sh
```

---

## 🧪 LocalStack Notes

- **LocalStack** emulates AWS S3 for development and testing.
- The following environment variables are used to interface with LocalStack:
  ```env
  DEV_S3_ENDPOINT=http://localstack:4566
  DEV_S3_BUCKET_NAME=teamawesome-bucket
  AWS_ACCESS_KEY_ID=test
  AWS_SECRET_ACCESS_KEY=test
  AWS_REGION=us-east-1
  ```

✅ This setup does **not** require a real AWS account during development.

---

## 🧠 Tips

- Backend code hot-reloads using `npm start` with volume binding.
- Frontend uses Vite dev server, accessible at `http://localhost:5173`
- LocalStack simulates `S3` access — use the `aws-sdk` in Node.js or Postman to verify uploads.

---
