# Warehouse Management System v1.0

A modern, lightweight, and full-stack warehouse management system designed to provide clear inventory tracking, efficient stock movement operations, and insightful data visualization.


## ✨ Key Features

*   **Authentication & Authorization**: Secure role-based access control (Admin/Operator) using JSON Web Tokens (JWT).
*   **Core CRUD Operations**: Complete management modules for parts and suppliers.
*   **Transactional Stock Movements**: Atomic IN/OUT operations to ensure data integrity and prevent stock discrepancies.
*   **Data Visualization**: An intuitive dashboard showcasing key performance indicators (KPIs), stock level trends, and inventory composition charts powered by ECharts.
*   **Reporting & Exporting**: Powerful transaction log filtering with support for exporting data to both Excel and PDF formats.
*   **Comprehensive Testing**: Includes backend unit/integration tests (Jest & Supertest) and frontend end-to-end tests (Cypress) to ensure application stability.
*   **Containerized Deployment**: Fully containerized with Docker and Docker Compose for easy, one-command deployment.

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, PostgreSQL, Sequelize (ORM), JSON Web Token (JWT), bcryptjs
*   **Frontend**: Vue 3 (Composition API), Vite, Vue Router, Pinia, Axios, Element Plus, ECharts
*   **Testing**:
    *   Backend: Jest, Supertest
    *   Frontend: Vitest, Vue Testing Library, Cypress (E2E)
*   **Deployment**: Docker, Docker Compose, Nginx

## 🚀 Getting Started (Local Development)

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Prerequisites

Make sure you have the following software installed on your system:

*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [PostgreSQL](https://www.postgresql.org/download/)
*   [Git](https://git-scm.com/downloads)

### 2. Clone the Repository

```bash
git clone https://github.com/Bojom/Warehouse.git
cd Warehouse
```
### 3. Backend setup
Navigate to the backend directory

```bash
cd backend
```
Install dependencies
```bash
npm install
```

Create the .env file from the example and fill in your details
You will need to provide your database credentials and a JWT secret key.
```bash
cp .env.example .env
nano .env # Or use your favorite text editor
```


Start the backend server (runs on http://localhost:3001)
```bash
npm run dev
```

### 4. Frontend setup
Navigate to the frontend directory from the root

```bash
cd frontend
```
Install dependencies

```bash
npm install
```

Start the frontend development server (runs on http://localhost:5173)

```bash
npm run dev
```
### 5. Database initialization

Connect to your PostgreSQL instance and use a client like psql or a GUI tool like DBeaver/pgAdmin. Execute the SQL commands found in database/schema.sql to create the necessary tables and relationships.

Once setup is complete, open your browser and navigate to http://localhost:5173.

## This project includes a comprehensive test suite.

* Run Backend Tests:

```bash
cd backend
npm test -- --coverage
```
* Run Frontend Unit/Component Tests:

```bash
cd frontend
npm test
```
* Run Frontend End-to-End (E2E) Tests:

```bash
npx cypress open
```

## 🐳 Deployment with Docker

This is the recommended way to run the application for a production-like environment.

### 1. Prerequisites

*   [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)

### 2. Environment Configuration

The Docker Compose setup uses a `.env` file in the project root to manage sensitive credentials.

1.  Create a `.env` file in the root of the project:
    ```bash
    touch .env
    ```

2.  Add the following variables to the file. **This file should never be committed to Git.**

    ```env
    # .env
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=your_strong_password_here # Change this!
    POSTGRES_DB=warehouse_system_db
    JWT_SECRET=your_strong_jwt_secret_here # Change this!
    ```

### 3. Build and Run

1.  From the project root directory, run the following command to build the images and start the services in detached mode:

    ```bash
    docker-compose up --build -d
    ```

2.  **Important:** The first time you start the application, you must manually initialize the database. Execute the following commands to run the database synchronization and seed the initial admin user:
    ```bash
    docker-compose exec backend node /app/src/scripts/syncDb.js
    docker-compose exec backend node /app/src/scripts/seedAdmin.js
    ```
    You only need to run these commands once.

### 4. Access the Application
The application will be available at `http://localhost:8080`.

### 5. Manage Services
*   To view the logs of all running services:
    ```bash
    docker-compose logs -f
    ```
*   To stop and remove the containers, networks, and volumes:
    ```bash
    docker-compose down
    ```

## 📝 License

© 2025 [Bojom]. All Rights Reserved.
