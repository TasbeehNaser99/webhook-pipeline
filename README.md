# 🚀 Webhook Pipeline System

A robust, distributed webhook processing system built with Node.js, BullMQ, and Docker. This system allows for asynchronous processing of incoming webhooks with built-in retry logic and PostgreSQL persistence.

---

## 🏗️ Architecture Design

The system is designed as a Producer-Consumer architecture to ensure high availability and reliability:

- **API (Producer):** An Express.js server that validates incoming webhooks against the database and pushes jobs to a Redis queue.
- **Redis (Message Broker):** Acts as the bridge between the API and the Worker, managing the job lifecycle.
- **Worker (Consumer):** A dedicated service that processes jobs, performs data enrichment, and notifies subscribers.
- **PostgreSQL:** Stores pipeline configurations and job history.

---

## 🛠️ Design Decisions

- **Asynchronous Processing:**  
  We chose BullMQ (Redis) to decouple the API response from the actual processing. This prevents the API from hanging if the processing takes too long.

- **Retry Logic:**  
  Implemented Exponential Backoff (3 attempts) to handle transient failures (like network glitches when calling the subscriber URL).

- **Containerization:**  
  Using Docker Compose ensures that the environment is identical across development, testing, and production.

- **Relational Schema:**  
  PostgreSQL was used to enforce data integrity (e.g., ensuring `source_path` is unique).

---

## 🚀 Setup & Installation

### Prerequisites
- Docker & Docker Compose  
- Node.js (for local development)

### 1. Clone & Environment

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL=postgres://user:password@db:5432/pipeline_db
REDIS_HOST=redis
REDIS_PORT=6379
```

### 2. Run with Docker

The entire stack can be launched with a single command:

```bash
sudo docker compose up -d --build
```

## 📖 Usage Guide

### 1. Create a Pipeline

Send a POST request to register a new webhook path:

```bash
curl -X POST http://localhost:3000/pipelines \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Order Updates",
       "source_path": "order-updates",
       "processor_type": "enricher",
       "subscriber_url": "https://httpbin.org/post"
     }'
```
### 2. Trigger the Webhook

Send data to your unique path:

```bash 
curl -X POST http://localhost:3000/pipelines/order-updates \
     -H "Content-Type: application/json" \
     -d '{"order_id": "TAB-2026", "status": "shipped"}'
```
### 3. Monitor Logs

Watch the Worker process the job in real-time:

```bash 
sudo docker compose logs -f worker
```
## 📊 Monitoring

A dashboard is available to monitor queue health:

- **URL:** http://localhost:3000/admin/queues

## 🛠️ Technologies Used

- **Backend:** TypeScript, Express.js
- **Queue Management:** BullMQ, Redis
- **Database:** PostgreSQL (with Drizzle ORM)
- **DevOps:** Docker, GitHub Actions (CI/CD)



