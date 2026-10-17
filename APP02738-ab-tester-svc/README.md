# 🚀 AB Tester Project

This project uses Docker to easily run all required services (backend, frontend, database, and cache).

## 📦 Requirements

Make sure you have installed:

* Docker  
* Docker Compose  

## 📁 Important Structure

For the project to work correctly, your folder structure should look like this:

    /parent-folder
    │
    ├── ab-tester-ui
    │   ├── docker-compose.yml
    │   ├── .env
    │   └── /src
    │
    └── ab-tester-ui   ← IMPORTANT (must be a sibling folder, not inside backend)

⚠️ **The `ab-tester-ui` folder must NOT be inside the backend project.**  
It needs to be at the same level (as a sibling directory), because the `frontend` service mounts it as a volume using a relative path (`../ab-tester-ui`).

## ⚙️ Setup

1. Copy the environment variables file:

```bash
cp .env.example .env
```

2. Edit the `.env` file if you need to customize any values.

## ▶️ Run the project

To start all services, run:

```bash
docker compose up
```

This will start:

* 🐘 PostgreSQL on port `5432`  
* ⚡ Redis on port `6379`  
* 🧠 Backend at `http://localhost:4000`  
* 💻 Frontend at `http://localhost:3000`  

## 📖 API documentation

With the backend running, open the interactive Swagger UI at
[`http://localhost:4000/docs`](http://localhost:4000/docs). The OpenAPI document is
available at [`http://localhost:4000/docs-json`](http://localhost:4000/docs-json).

Use **Authorize** in Swagger UI to provide a JWT bearer token or the `refreshToken`
cookie for protected endpoints.

## 🔄 Development

Code changes are automatically reflected thanks to the configured Docker volumes.

## 🧩 Additional Notes

* A `.npmrc` file is required in **both the backend and frontend folders**.  
  This file is **not included in the repository** and must be requested from another developer on the team.

* If you run into dependency issues, rebuild the images:

```bash
docker compose up --build
```

* If TypeScript types or IntelliSense are not working properly in Visual Studio Code, you can install dependencies locally with:

```bash
npm ci
```

This helps ensure your editor correctly recognizes types and avoids IDE-related issues.

* Make sure ports `3000`, `4000`, `5432`, and `6379` are available.

---

You're all set! 🚀