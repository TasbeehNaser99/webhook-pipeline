# 🚀 Robust Webhook Pipeline System

A high-performance, distributed webhook processing engine built with Node.js, BullMQ, and Docker. This system is architected for reliability, featuring asynchronous job processing, multi-stage data transformation, and secure delivery.
---

## 🏗️ Architecture Design

The system is designed as a Producer-Consumer architecture to ensure high availability and reliability:

- **API (Producer):** An Express.js gateway that validates incoming payloads and enqueues jobs into Redis.
- **Redis (Message Broker):** Orchestrates the job lifecycle using BullMQ for high-throughput queuing.
- **Worker (Consumer):** A specialized service that executes data processing (Transform/Filter/Enrich) and handles secure delivery.
- **PostgreSQL:** The source of truth for pipeline configurations and persistent job logs.

---

## 🛠️ DAdvanced Features & Design Decisions

**1. Reliability & Resilience**

- **Asynchronous Processing:**  
  API responses are near-instant, while heavy processing happens in the background.

- **Exponential Backoff:**  
  Built-in retry logic (3 attempts) with increasing delays to handle transient network failures gracefully.

- **Graceful Shutdown:**  
  The worker is designed to finish active jobs before shutting down during updates.

**2. Security & Integrity (The Polish) 🔐**

- **Webhook Signing:** Every outgoing request includes an `X-Webhook-Signature` header.

- **HMAC-SHA256:** Payloads are signed using a secret key, allowing subscribers to verify that the data is authentic and hasn't been tampered with.

**3. Observability**

- **Real-time Dashboard:** Integrated **BullBoard** at `/admin/queues` for monitoring job states (Waiting, Active, Completed, Failed).
- **Structured Logging:** Detailed logs for each stage of the pipeline (Action Detection -> Transformation -> Delivery).


---

## 🚀 Setup & Installation

### Prerequisites
- Docker & Docker Compose  
- Node.js (for local development)

### 1. Clone & Environment

Create a `.env` file based on the provided `.env.example`:

```env
cp .env.example .env
# Edit .env with your specific credentials
```

### 2. Run with Docker

The entire stack can be launched with a single command:

```bash
sudo docker compose up -d --build
```

## 📖 Usage Guide

### 1. Create a Pipeline

Define a new webhook endpoint and choose a `processor_type` (`transformer`, `filter`, or `enricher`):

```bash
curl -X POST http://localhost:3000/pipelines \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Order Updates",
       "source_path": "order-updates",
       "processor_type": "enricher",
       "subscriber_url": "https://webhook.site/YOUR_UNIQUE_ID"
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

## 🛠️ TTech Stack & Tools

- **Backend:** TypeScript, Express.js
- **Queue Management:** BullMQ, Redis
- **Database:** PostgreSQL (with Drizzle ORM)
- **DevOps:** Docker, GitHub Actions (CI/CD)
- **Security:** Crypto (HMAC-SHA256)
- **Monitoring:** BullBoard



