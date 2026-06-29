# Hospital Food Management System (HFMS) - System Architecture & Engineering Blueprint

This document details the complete system architecture, database schema, API endpoints, UI architecture, and scalability model for the Hospital Food Management System (HFMS). Designed as a production-ready MVP for a fast-growing healthcare startup, this platform ensures strict dietary compliance, zero-error food delivery, real-time inventory alerts, and seamless multi-department coordination.

---

## 1. High-Level System Architecture

```
+-------------------------------------------------------------------------------+
|                                CLIENT TIER                                    |
|  +----------------+  +-------------------+  +---------------+  +-----------+  |
|  | Admin Portal   |  | Doctor/Dietician  |  | Patient App   |  | Pantry/   |  |
|  | (React+Redux)  |  | Dashboard         |  | (Mobile Resp) |  | Delivery  |  |
|  +--------+-------+  +---------+---------+  +-------+-------+  +-----+-----+  |
+-----------|--------------------|--------------------|----------------|--------+
            |                    |                    |                |
            +--------------------+---------+----------+----------------+
                                           |  HTTP / REST & WebSockets (Socket.io)
                                           v
+-------------------------------------------------------------------------------+
|                             API & GATEWAY LAYER                               |
|  +-------------------------------------------------------------------------+  |
|  |   Nginx / Cloudflare Load Balancer & WAF                                |  |
|  +-------------------------------------------------------------------------+  |
|  |   Express.js API Gateway & Middleware (Auth, RBAC, Rate Limiter)        |  |
+------------------------------------------+------------------------------------+
                                           |
                                           v
+-------------------------------------------------------------------------------+
|                             BUSINESS LOGIC TIER                               |
|  +-----------------------+  +-----------------------+  +-------------------+  |
|  | Auth & Role Manager   |  | Diet & Allergy Engine |  | Order Workflow    |  |
|  +-----------------------+  +-----------------------+  +-------------------+  |
|  | Inventory & Wastage   |  | Real-Time Chat & Notif|  | QR & OTP Verifier |  |
|  +-----------------------+  +-----------------------+  +-------------------+  |
|  | Audit Logger (Winston)|  | Recommendation Engine |  | Payments (Stripe) |  |
+--------------------------+--+-----------------------+--+-------------------+--+
                           |                          |
                           v                          v
+--------------------------+--------------------------+-------------------------+
|                                DATA TIER                                      |
|  +---------------------------------+  +------------------------------------+  |
|  | MongoDB Atlas (Multi-Region)    |  | Redis Cache (Session & Pub/Sub)    |  |
|  | Collections: Users, Orders, ... |  | Socket.io State & Frequent Queries |  |
|  +---------------------------------+  +------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### Architectural Principles
1. **Separation of Concerns (SoC):** Distinct separation between client UI layers, stateless REST API controllers, business services, and data persistence models.
2. **Security & Compliance (HIPAA-Ready):** Hardened authentication via JWT, granular Role-Based Access Control (RBAC), end-to-end audit logging for critical operations, and secure payload handling.
3. **High Availability & Fault Tolerance:** Stateless backend architecture compatible with horizontal autoscaling across containerized clusters (e.g., Kubernetes, AWS ECS).
4. **Real-Time Responsiveness:** WebSockets (`Socket.IO`) integrated with Redis Pub/Sub for sub-second updates on meal delivery status, live patient chats, and urgent inventory low-stock alerts.

---

## 2. Database Schema (MongoDB / Mongoose)

The schema is heavily optimized for fast read-heavy operations (e.g., menu catalog, diet plans) and transactional integrity for write operations (orders, inventory tracking).

### `users`
- `_id`: ObjectId
- `name`: String (Required)
- `email`: String (Required, Unique, Indexed)
- `passwordHash`: String (Required)
- `role`: Enum [`Admin`, `Doctor`, `Dietician`, `Patient`, `Pantry`, `Delivery`] (Indexed)
- `phoneNumber`: String
- `active`: Boolean (Default: true)
- `createdAt`, `updatedAt`: Date

### `patient_profiles`
- `_id`: ObjectId
- `userId`: ObjectId (Ref: `User`, Unique, Indexed)
- `patientId`: String (Unique, Indexed)
- `hospitalRegNumber`: String (Unique)
- `assignedDoctor`: ObjectId (Ref: `User`, Indexed)
- `assignedDietician`: ObjectId (Ref: `User`, Indexed)
- `wardNumber`: String
- `bedNumber`: String
- `diseaseType`: String
- `recoveryStage`: Enum [`Critical`, `Moderate`, `Recovering`, `Discharge Ready`]
- `ageGroup`: String
- `allergies`: [String]
- `medicalRestrictions`: [String]

### `diet_plans`
- `_id`: ObjectId
- `patientId`: ObjectId (Ref: `User`, Indexed)
- `createdBy`: ObjectId (Ref: `User`)
- `calories`: Number
- `proteinLimit`: Number
- `carbsLimit`: Number
- `fatLimit`: Number
- `sugarLimit`: Number
- `sodiumLimit`: Number
- `mealSchedule`: [{ mealType: String, time: String }]
- `status`: Enum [`Active`, `Modified`, `Archived`]
- `createdAt`, `updatedAt`: Date

### `meal_items` (Hospital Approved Catalog)
- `_id`: ObjectId
- `name`: String (Required)
- `category`: Enum [`Breakfast`, `Lunch`, `Dinner`, `Snack`, `Beverage`]
- `calories`: Number
- `protein`: Number
- `carbs`: Number
- `fat`: Number
- `sugar`: Number
- `sodium`: Number
- `ingredients`: [String]
- `allergens`: [String]
- `recommendedFor`: [String] (e.g., Diabetes, Hypertension, Post-Op)
- `available`: Boolean
- `price`: Number

### `orders`
- `_id`: ObjectId
- `patientId`: ObjectId (Ref: `User`, Indexed)
- `mealItems`: [{ mealId: ObjectId (Ref: `MealItem`), quantity: Number }]
- `totalPrice`: Number
- `orderType`: Enum [`Standard`, `CustomRequest`]
- `customNotes`: String
- `dieticianApproval`: Enum [`Pending`, `Approved`, `Rejected`, `NotRequired`]
- `preparationStatus`: Enum [`Received`, `Preparing`, `Packaged`, `ReadyForDelivery`]
- `deliveryStatus`: Enum [`Pending`, `Assigned`, `OutForDelivery`, `Delivered`, `Failed`]
- `deliveryPartnerId`: ObjectId (Ref: `User`, Indexed)
- `qrCodeData`: String
- `verificationOTP`: String
- `paymentStatus`: Enum [`Pending`, `Completed`, `Refunded`]
- `deliveredAt`: Date
- `createdAt`, `updatedAt`: Date

### `inventory_items`
- `_id`: ObjectId
- `itemName`: String (Unique, Indexed)
- `category`: String
- `quantity`: Number
- `unit`: String (e.g., kg, liters, packets)
- `minimumThreshold`: Number
- `lastRestocked`: Date

### `audit_logs`
- `_id`: ObjectId
- `userId`: ObjectId (Ref: `User`, Indexed)
- `action`: String (e.g., `DIET_PLAN_CREATED`, `ORDER_VERIFIED`, `INVENTORY_UPDATE`)
- `details`: Object
- `ipAddress`: String
- `createdAt`: Date (Indexed for TTL/Archiving)

### `chat_messages`
- `_id`: ObjectId
- `senderId`: ObjectId (Ref: `User`, Indexed)
- `receiverId`: ObjectId (Ref: `User`, Indexed)
- `message`: String
- `read`: Boolean
- `createdAt`: Date

---

## 3. API Endpoints Specification

All protected endpoints require a valid JWT Bearer Token in the `Authorization` header.

### Authentication & User Management
- `POST /api/auth/register` - Register a new user (with role-specific payload validation).
- `POST /api/auth/login` - Authenticate user & return JWT + user profile.
- `GET /api/users` - [Admin] Get all users with filters for role & active status.
- `GET /api/users/:id` - Get specific user profile details.
- `PUT /api/users/:id` - [Admin] Update user role/permissions/profile.

### Diet Plans & Patient Operations
- `POST /api/diet-plans` - [Doctor/Dietician] Create a new diet plan.
- `PUT /api/diet-plans/:id` - [Doctor/Dietician] Modify an existing diet plan.
- `GET /api/diet-plans/patient/:patientId` - Get active diet plan for a patient.
- `GET /api/patients/assigned` - [Doctor/Dietician] Get list of assigned patients.
- `POST /api/patients/custom-food-request` - [Patient] Submit customized food request.
- `PUT /api/patients/custom-food-request/:orderId` - [Doctor/Dietician] Approve/reject request.
- `GET /api/patients/:patientId/compliance` - Get nutritional compliance & intake summary.

### Menu Catalog & Recommendation Engine
- `GET /api/meals` - Browse hospital-approved food catalog.
- `POST /api/meals` - [Admin] Add new meal to catalog.
- `GET /api/meals/recommendations/:patientId` - Get AI/rule-based meal recommendations.
- `POST /api/meals/validate-allergy` - Perform automated allergy & restriction checks on selected meals.

### Order Workflow & Preparation
- `POST /api/orders` - [Patient] Place food order (triggers allergy check & diet limits validation).
- `GET /api/orders` - Get orders filtered by role (Patient orders, Pantry active queue, Delivery queue).
- `GET /api/orders/:id` - Get full order details & tracking status.
- `PUT /api/orders/:id/prep-status` - [Pantry] Update preparation/packaging status.
- `PUT /api/orders/:id/assign-delivery` - [Pantry/Admin] Assign delivery partner.

### Delivery & Verification
- `GET /api/delivery/assigned` - [Delivery] Get assigned delivery tasks.
- `PUT /api/delivery/:orderId/accept` - [Delivery] Accept delivery task.
- `POST /api/delivery/:orderId/verify` - [Delivery] Verify delivery via QR Code scan or OTP.
- `POST /api/delivery/:orderId/fail` - [Delivery] Report failed delivery with reason.

### Inventory & Pantry Management
- `GET /api/inventory` - [Pantry/Admin] Get inventory stock list.
- `POST /api/inventory` - [Pantry/Admin] Add new inventory item.
- `PUT /api/inventory/:id` - [Pantry/Admin] Update stock quantity & threshold.
- `GET /api/inventory/low-stock` - [Pantry/Admin] Get low stock alert list.
- `GET /api/inventory/reports` - [Pantry/Admin] Get daily preparation & wastage stats.

### Analytics & Audit Logs
- `GET /api/analytics/dashboard` - [Admin] Get top-level metrics (orders, active staff, revenue, wastage).
- `GET /api/audit-logs` - [Admin] Get system audit logs with pagination and filtering.

### Chat & Messaging
- `GET /api/chat/:userId` - Get chat conversation history with a specific user.
- `POST /api/chat/send` - Send a chat message (also broadcast via Socket.io).

---

## 4. UI Architecture (React + Redux Toolkit + Tailwind CSS)

```
+-----------------------------------------------------------------------+
|                            APP ROUTER                                 |
+-----------------------------------+-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            | (Public)                                      | (Protected / RBAC)
            v                                               v
+-----------------------+                       +-----------------------+
|  Login / Register     |                       | Main Dashboard Layout |
+-----------------------+                       +-----------+-----------+
                                                            |
     +-----------------+-----------------+------------------+------------------+
     |                 |                 |                     |               |
     v                 v                 v                     v               v
+----------+     +------------+   +--------------+     +---------------+ +-------------+
| Admin    |     | Doctor/    |   | Patient      |     | Pantry Mgr    | | Delivery    |
| Portal   |     | Dietician  |   | Dashboard    |     | Dashboard     | | App         |
+----------+     +------------+   +--------------+     +---------------+ +-------------+
| - Metrics|     | - Patients |   | - Diet Plan  |     | - Inventory   | | - Assigned  |
| - Users  |     | - Diet Plan|   | - Catalog    |     | - Prep Queue  | | - Accept/   |
| - Logs   |     | - Approvals|   | - Order/Track|     | - Low Stock   | |   Verify    |
| - Catalog|     | - Chat     |   | - Chat/Pay   |     | - Reports     | | - History   |
+----------+     +------------+   +--------------+     +---------------+ +-------------+
```

### State Management (Redux Toolkit)
- `authSlice`: Manages authentication token, logged-in user profile, active role, and session state.
- `orderSlice`: Manages active order workflows, cart state, tracking status, and live updates.
- `inventorySlice`: Manages pantry inventory stock levels and low-stock notification triggers.
- `chatSlice`: Manages active chat sessions, live message list, and unread badges.
- `socketMiddleware`: Intercepts Socket.IO events and dispatches corresponding Redux actions to keep UI in real-time sync.

---

## 5. Scalability & Production Readiness

1. **Database Indexing:** Composite and single-field indexing on `email`, `role`, `patientId`, `assignedDoctor`, `preparationStatus`, and `deliveryStatus` ensure query execution under 10ms even at 10M+ records.
2. **Horizontal Scaling:** API layer is strictly stateless. Session state is managed via client-side JWTs and shared Redis cache. Socket.io utilizes Redis adapter for multi-instance pub/sub event syncing.
3. **Stateless Authentication:** JWT authentication removes server-side session overhead.
4. **Allergy & Diet Validation Engine:** Fully decoupled rule engine running in memory to validate complex multi-parameter restrictions (sodium, sugar, allergens) instantaneously before write operations.
5. **Caching Strategy:** Frequently accessed menus and static hospital configurations are cached in Redis with a 24-hour TTL, invalidated upon admin updates.

---

## 6. Detailed Order Workflow & Data Flow

```
+-----------+         +------------+         +-------------+         +-------------+         +-------------+
|  Patient  |         | API Engine |         | Pantry Mgr  |         | Delivery P. |         | Database    |
+-----+-----+         +-----+------+         +------+------+         +------+------+         +------+------+
      |                     |                       |                       |                       |
      | 1. Browse Catalog   |                       |                       |                       |
      |-------------------->|                       |                       |                       |
      |                     | 2. Fetch Menu & Check Diet Limits             |                       |
      |                     |---------------------------------------------------------------------->|
      |                     |<-- Returns Filtered & Validated Catalog ------------------------------|
      |<-- Display Meals ---|                       |                       |                       |
      |                     |                       |                       |                       |
      | 3. Select Meal & Place Order                |                       |                       |
      |-------------------->|                       |                       |                       |
      |                     | 4. Run Allergy & Diet Rule Engine             |                       |
      |                     |---(Passes validation)-->|                     |                       |
      |                     | 5. Generate Order (Status: Received, QR/OTP Created)                 |
      |                     |---------------------------------------------------------------------->|
      |                     |                       |                       |                       |
      |                     | 6. Socket Broadcast: New Order Received       |                       |
      |                     |---------------------->|                       |                       |
      |                     |                       | 7. Update Status: Preparing / Packaged        |
      |                     |                       |---------------------------------------------->|
      |                     |                       |                       |                       |
      |                     | 8. Assign Delivery Partner                    |                       |
      |                     |---------------------------------------------->|                       |
      |                     |                       |                       | 9. Accept & Pickup    |
      |                     |                       |                       |---------------------->|
      |                     | 10. Socket Broadcast: Out for Delivery        |                       |
      |<-- Live Tracking ---|-----------------------+-----------------------|                       |
      |                     |                       |                       |                       |
      | 11. Delivery Arrives & Scans QR / Enters OTP                        |                       |
      |<===================================================================>|                       |
      |                     |                       |                       | 12. Verify Delivery   |
      |                     |                       |                       |----(POST /verify)---->|
      |                     |                       |                       |                       |
      |                     | 13. Process Online Payment / Complete Order                           |
      |                     |---------------------------------------------------------------------->|
      |                     | 14. Socket Broadcast: Order Delivered & Complete                      |
      |<-- Order Complete --|-----------------------+-----------------------+-----------------------|
      +---------------------+-----------------------+-----------------------+-----------------------+
```

---

## 7. Workspace Repository Structure

```
/home/user/
├── ARCHITECTURE.md          # System design & specification blueprint
├── README.md                # Quickstart guide & execution instructions
├── package.json             # Root monorepo workspace package manager
├── docker-compose.yml       # Dev/Local MongoDB & Redis container definitions
├── backend/                 # Node.js + Express + TypeScript + Socket.io Server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/          # Database, environment, socket initialization
│       ├── models/          # Mongoose database models (User, Order, DietPlan, etc.)
│       ├── controllers/     # Route logic & request handling
│       ├── routes/          # Express route definitions
│       ├── middlewares/     # JWT Auth, RBAC, Error Handler, Audit Logger
│       ├── services/        # AllergyDetector, RecommendationEngine, QRService
│       ├── socket/          # Socket.io event handlers & real-time sync
│       ├── seed/            # Automated mock data generator (demo accounts & items)
│       └── server.ts        # Entry point
└── frontend/                # React + Vite + Redux Toolkit + Tailwind CSS App
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    └── src/
        ├── assets/          # Static assets & styles
        ├── components/      # Reusable UI components (Navbar, Sidebar, Modal, QR)
        ├── features/        # Redux slices (auth, order, inventory, chat)
        ├── hooks/           # Custom React hooks
        ├── pages/           # Role-based dashboards (Admin, Doctor, Patient, etc.)
        ├── services/        # Axios API client & Socket.io client wrapper
        ├── types/           # Shared TypeScript interface definitions
        └── App.tsx          # Main layout & router configuration
```
