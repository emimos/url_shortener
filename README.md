# SwiftLink - High-Performance URL Shortener & Analytics Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6%2B-forestgreen.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v4.21-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

A modern, full-stack URL shortening service and real-time click analytics dashboard built with **Node.js**, **Express**, **MongoDB** (via **Mongoose**), and **React 19**. Features fast 302 redirections, scannable QR code generation, customizable aliases, link expiry dates, and real-time visitor tracking (referrers, devices, operating systems, and browsers).

---

## 🏛️ System Architecture

The application is structured into decoupled frontend and backend layers with an asynchronous, non-blocking click tracking pipeline:

```text
┌────────────────────────────────┐         ┌────────────────────────────────┐
│      Dashboard / User UI       │         │        Visitor / Scanner       │
│    (React 19 + Recharts)       │         │    (Clicks or Scans QR Code)   │
└───────────────┬────────────────┘         └───────────────┬────────────────┘
                │                                          │
       REST API HTTP Requests                        GET /r/:shortCode
                │                                          │
                ▼                                          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Core Application                     │
│                                                                           │
│  • Router & Controller Layer:                                             │
│    - /api/shorten: URL validation, collision check & QR code synthesis   │
│    - /api/urls: Querying, sorting, tag & search filters                   │
│    - /api/urls/:code/analytics: Aggregation pipelines                     │
│  • Redirection Engine:                                                    │
│    - Instant HTTP 302 Location redirect                                   │
│    - Asynchronous event logging (ua-parser-js & referrer sanitizer)       │
└─────────────────────┬─────────────────────────────────┬───────────────────┘
                      │                                 │
             CRUD Persistence                     Log Click Event
                      │                                 │
                      ▼                                 ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      MongoDB Database Layer (Mongoose)                    │
│                                                                           │
│  Collection: "urls"                    Collection: "clickevents"          │
│  • shortCode (Unique B-Tree Index)     • shortCode (B-Tree Index)         │
│  • originalUrl                         • timestamp (Date index)           │
│  • clicks (Atomic $inc counter)        • referrer, userAgent, ip          │
│  • customAlias, tags, expiresAt        • browser, os, device              │
└───────────────────────────────────────────────────────────────────────────┘
```

### Architectural Highlights

1. **Sub-Millisecond Redirection**: Redirection endpoints (`/r/:shortCode`) utilize an indexed primary key lookup. The client receives an immediate `302 Found` header while the click logging executes asynchronously, guaranteeing zero added latency to visitors.
2. **Adaptive Database Engine**: Features native Mongoose integration for production MongoDB clusters (local or MongoDB Atlas), alongside an automatic zero-config persistent storage fallback for instant prototyping.
3. **Deep Device & Traffic Intelligence**: Every redirection captures and normalizes:
   - **Referrer**: Identifies search engines, social platforms (X/Twitter, LinkedIn, Facebook, GitHub, Reddit), and direct traffic.
   - **User Agent Parsing**: Extracts hardware device type (Desktop, Mobile, Tablet), operating system, and browser version using `ua-parser-js`.
   - **IP Tracking**: Sanitizes client IP headers (`x-forwarded-for` aware).
4. **Interactive Analytics Visualizations**: Frontend analytics charts powered by `recharts` provide area charts for click timelines, donut charts for device distribution, and horizontal bar charts for traffic referrers.

---

## 🗄️ MongoDB Database Schemas

### 1. `urls` Collection

Stores shortened URL records and metadata:

```typescript
{
  _id: ObjectId,
  shortCode: String,      // Unique index: e.g. "github-node" or "xK9d2L"
  originalUrl: String,    // Target destination URL
  title: String,          // Optional human-readable title
  customAlias: String,    // Optional user-specified alias
  clicks: Number,         // Atomic counter updated on each redirect ($inc)
  expiresAt: Date,        // Optional expiration timestamp
  tags: [String],         // Array of categorization tags
  isActive: Boolean,      // Status flag to enable or pause link
  qrCode: String,         // Base64 Data URL of generated QR code
  createdAt: Date,        // Automatic ISO timestamp
  updatedAt: Date         // Automatic ISO timestamp
}
```

**Indexes:**
- `{ shortCode: 1 }` (Unique, Sparse)
- `{ createdAt: -1 }`
- `{ tags: 1 }`

### 2. `clickevents` Collection

Stores individual visit logs for analytics aggregation:

```typescript
{
  _id: ObjectId,
  shortCode: String,      // Indexed foreign key to urls.shortCode
  timestamp: Date,        // Indexed timestamp of visit
  ip: String,             // Visitor IP or proxy
  referrer: String,       // Normalized traffic source (e.g. "Google Search", "Direct")
  userAgent: String,      // Raw client user agent
  browser: String,        // Parsed browser name (e.g. "Chrome 122")
  os: String,             // Parsed OS (e.g. "macOS", "Windows 11")
  device: String,         // Device type: "Desktop" | "Mobile" | "Tablet"
  country: String         // Geo/Country if reverse proxy provides header
}
```

**Indexes:**
- `{ shortCode: 1, timestamp: -1 }` (Compound index for rapid time-series queries)

---

## 📦 Prerequisites

Before installing the project, ensure you have:

- **Node.js**: Version `18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm** (v9+) or **pnpm** or **yarn**
- **MongoDB**: A running instance of MongoDB:
  - **Local MongoDB Community Server** (v5.0+), OR
  - **MongoDB Atlas Cloud Cluster** (Free M0 tier available at [mongodb.com/atlas](https://www.mongodb.com/atlas))

---

## 🚀 Installation & Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/url-shortener.git
cd url-shortener
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update your `.env` configuration:

```env
# Server Port
PORT=3000

# Canonical Application Base URL (used for generating absolute short links)
APP_URL=http://localhost:3000

# MongoDB Connection String
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/url_shortener

# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/url_shortener?retryWrites=true&w=majority
```

> **Note:** If `MONGODB_URI` is omitted or temporarily unreachable, the application automatically falls back to an embedded JSON persistence engine located at `data/db.json`, ensuring uninterrupted operation.

### Step 4: Start MongoDB

#### Option A: Local MongoDB Service

- **macOS (Homebrew)**:
  ```bash
  brew services start mongodb/brew/mongodb-community
  ```
- **Ubuntu / Debian**:
  ```bash
  sudo systemctl start mongod
  sudo systemctl status mongod
  ```
- **Windows**:
  Start the **MongoDB Server** service from `services.msc` or via Command Prompt:
  ```cmd
  net start MongoDB
  ```

#### Option B: Run MongoDB via Docker

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:latest
```

### Step 5: Run the Development Server

Start the full-stack server (Express backend + Vite React client):

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🐳 Docker Deployment

To run both the application and MongoDB in containers:

### Option 1: Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: shortener-mongo
    restart: always
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    networks:
      - shortener-net

  app:
    build: .
    container_name: shortener-app
    restart: always
    ports:
      - '3000:3000'
    environment:
      - PORT=3000
      - APP_URL=http://localhost:3000
      - MONGODB_URI=mongodb://mongodb:27017/url_shortener
    depends_on:
      - mongodb
    networks:
      - shortener-net

volumes:
  mongo_data:

networks:
  shortener-net:
    driver: bridge
```

Start the containers:

```bash
docker compose up -d
```

### Option 2: Standalone Docker Container

```bash
# Build the production image
docker build -t url-shortener .

# Run the container connecting to your MongoDB Atlas or host database
docker run -d -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://<user>:<pwd>@cluster.mongodb.net/url_shortener" \
  -e PORT="3000" \
  --name url-shortener-app \
  url-shortener
```

---

## 🛠️ Production Build & Start

To build the optimized client bundle and compile the server bundle:

```bash
# Compile Vite frontend assets and bundle server.ts with esbuild
npm run build

# Start the production CommonJS server
npm run start
```

---

## 📡 REST API Reference

All API requests and responses communicate via standard JSON over HTTP.

### 1. Shorten a URL
- **Endpoint**: `POST /api/shorten`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "originalUrl": "https://react.dev/blog/2024/02/15/react-19",
    "customAlias": "react-19",        // Optional (3-30 alphanumeric characters)
    "title": "React 19 Official Post",// Optional
    "tags": ["frontend", "react"],    // Optional
    "expiresAt": "2026-12-31T23:59:59Z" // Optional ISO date
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "url": {
      "id": "65fc2310ab4f...",
      "shortCode": "react-19",
      "originalUrl": "https://react.dev/blog/2024/02/15/react-19",
      "shortUrl": "http://localhost:3000/r/react-19",
      "title": "React 19 Official Post",
      "clicks": 0,
      "createdAt": "2026-09-21T13:52:00.000Z",
      "qrCode": "data:image/png;base64,iVBORw0KGgo...",
      "isActive": true
    }
  }
  ```

---

### 2. List All Shortened URLs
- **Endpoint**: `GET /api/urls`
- **Query Parameters**:
  - `q`: Search query string (matches code, title, or destination)
  - `tag`: Filter by specific tag
- **Response** (`200 OK`):
  ```json
  {
    "urls": [
      {
        "id": "65fc2310ab4f...",
        "shortCode": "react-19",
        "originalUrl": "https://react.dev/...",
        "shortUrl": "http://localhost:3000/r/react-19",
        "clicks": 142,
        "isActive": true,
        "createdAt": "2026-09-21T13:52:00.000Z"
      }
    ]
  }
  ```

---

### 3. Get Detailed Analytics for a URL
- **Endpoint**: `GET /api/urls/:shortCode/analytics`
- **Response** (`200 OK`):
  ```json
  {
    "analytics": {
      "shortCode": "react-19",
      "originalUrl": "https://react.dev/...",
      "shortUrl": "http://localhost:3000/r/react-19",
      "title": "React 19 Official Post",
      "totalClicks": 142,
      "clicksOverTime": [
        { "date": "Sep 15", "clicks": 18 },
        { "date": "Sep 16", "clicks": 25 },
        { "date": "Sep 17", "clicks": 32 }
      ],
      "devices": [
        { "name": "Desktop", "value": 98 },
        { "name": "Mobile", "value": 40 },
        { "name": "Tablet", "value": 4 }
      ],
      "referrers": [
        { "name": "Google Search", "value": 64 },
        { "name": "X / Twitter", "value": 38 },
        { "name": "Direct / None", "value": 22 }
      ],
      "browsers": [
        { "name": "Chrome 122", "value": 85 },
        { "name": "Safari 17", "value": 35 }
      ],
      "recentClicks": [
        {
          "id": "clk_171...",
          "timestamp": "2026-09-21T13:40:12.000Z",
          "ip": "192.168.1.45",
          "referrer": "Google Search",
          "browser": "Chrome 122",
          "os": "macOS",
          "device": "Desktop"
        }
      ]
    }
  }
  ```

---

### 4. Toggle URL Active / Paused State
- **Endpoint**: `PATCH /api/urls/:shortCode/toggle`
- **Response** (`200 OK`): Returns the updated URL object with toggled `isActive`.

---

### 5. Delete a Short URL
- **Endpoint**: `DELETE /api/urls/:shortCode`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "URL deleted successfully"
  }
  ```

---

### 6. System Status & Health
- **Endpoint**: `GET /api/status`
- **Response** (`200 OK`):
  ```json
  {
    "status": "operational",
    "dbType": "mongodb",
    "isMongoConnected": true,
    "mongoUriConfigured": true,
    "totalUrls": 12,
    "totalClicks": 843,
    "uptime": 3600
  }
  ```

---

## 🔒 Security Best Practices

1. **Input Validation**: Strict protocol validation (`http:`/`https:`) prevents `javascript:` pseudo-protocol injection or open redirection vulnerabilities.
2. **Short Code Collision Avoidance**: Unique indexing on MongoDB `shortCode` backed by collision detection logic during creation.
3. **Link Expiration Support**: Automatic expiration enforcement with HTTP 410 Gone status.
4. **Anonymized IP Handling**: Protects end-user privacy while maintaining accurate visit analytics.

---

## 📄 License

This project is licensed under the Apache 2.0 License.
