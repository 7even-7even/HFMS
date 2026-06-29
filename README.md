# Hospital Food Management System (HFMS) - Production MVP

The **Hospital Food Management System (HFMS)** is a comprehensive, production-ready full-stack web application designed to streamline food ordering, dietary management, inventory tracking, and meal delivery operations inside a hospital environment.

## Key Features & Capabilities

- **Role-Based Workflows:** Full support for 5 specialized system roles: `Administrator`, `Doctor/Dietician`, `Patient`, `Inventory/Pantry Manager`, and `Delivery Partner`.
- **Allergy & Medical Restriction Engine:** Automated pre-order verification checks customized food requests against patient allergies, medical restrictions, and doctor-prescribed limitations.
- **AI/Rule-Based Food Recommendation Engine:** Smart meal suggestions tailored to disease type, recovery stage, age group, and nutritional targets.
- **QR-Based & OTP Meal Verification:** Ensures 100% zero-error meal delivery by matching Patient ID, Order ID, and Diet Plan ID at the bedside.
- **Real-Time Synchronicity:** Integrated Socket.IO for sub-second updates on meal preparation status, real-time live delivery tracking, low-stock alerts, and secure Doctor-Patient messaging.
- **HIPAA-Ready Auditing:** Comprehensive audit logging tracking all diet plan modifications, order updates, payment actions, and inventory changes.

---

## Getting Started

The project is structured as a robust monorepo consisting of a Node.js/Express TypeScript backend and a React/Vite TypeScript frontend.

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB (Running locally or MongoDB Atlas)

### Quick Start (Development Mode)

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Seed the database with sample production demo data:**
   ```bash
   npm run seed
   ```
   *This automatically creates pre-configured accounts for all roles (Admin, Doctor, Dietician, Patient, Pantry, Delivery), alongside hospital food items, initial inventory stock, active diet plans, and sample orders.*

3. **Start both Backend and Frontend concurrently:**
   ```bash
   npm run dev
   ```

- **Frontend Application:** Available at `http://localhost:5173`
- **Backend API & Socket Server:** Available at `http://localhost:5000`



## Documentation

For an in-depth review of the system design, architectural diagrams, complete database schema, API specifications, and scalability strategies, please refer to [ARCHITECTURE.md](./ARCHITECTURE.md).
