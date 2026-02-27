# 🏗️ AUTOMALL - System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTOMALL SYSTEM                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Buyer Dashboard │  │  Marketplace     │  │  OTW Modal       │           │
│  │                  │  │                  │  │                  │           │
│  │ • Appointments   │  │ • Browse cars    │  │ • 2-hr timer     │           │
│  │ • Hold status    │  │ • Search/filter  │  │ • Confirmation   │           │
│  │ • Call showroom  │  │ • Pagination     │  │ • Success toast  │           │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘           │
│           │                     │                     │                     │
│           └─────────────────────┴─────────────────────┘                     │
│                            │                                                 │
│                 ┌──────────▼──────────┐                                      │
│                 │   API Service Layer │                                      │
│                 │                     │                                      │
│                 │ • useAPI hook       │                                      │
│                 │ • applyOTWHold()    │                                      │
│                 │ • getVehicles()     │                                      │
│                 │ • getAppointments() │                                      │
│                 └──────────┬──────────┘                                      │
│                            │                                                 │
│          (http://localhost:5173)                                             │
│                            │                                                 │
└────────────────────────────┼─────────────────────────────────────────────────┘
                             │
                    (CORS, fetch/axios)
                             │
┌────────────────────────────▼─────────────────────────────────────────────────┐
│                       BACKEND LAYER (PHP)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ config.php - Configuration & Database Connection             │           │
│  │ • PDO MySQL connection                                       │           │
│  │ • CORS headers setup                                         │           │
│  │ • Helper functions (validation, queries, responses)         │           │
│  └──────────┬───────────────────────────────────────────────────┘           │
│             │                                                                │
│  ┌──────────▼───────────────────────────────────────────────────┐           │
│  │ API Endpoints Layer (/backend/api/)                          │           │
│  │                                                               │           │
│  │ ┌─────────────────────┐ ┌─────────────────────┐             │           │
│  │ │apply_otw_hold.php   │ │get_available_       │             │           │
│  │ │                     │ │vehicles.php         │             │           │
│  │ │POST:                │ │                     │             │           │
│  │ │ • Validate input    │ │GET:                 │             │           │
│  │ │ • Check available   │ │ • Filter vehicles   │             │           │
│  │ │ • Apply 2-hr hold   │ │ • Pagination        │             │           │
│  │ │ • Transactions      │ │ • Price range       │             │           │
│  │ │ • Return success    │ │ • Search support    │             │           │
│  │ └─────────────────────┘ └─────────────────────┘             │           │
│  │                                                               │           │
│  │ ┌─────────────────────┐ ┌─────────────────────┐             │           │
│  │ │release_expired_     │ │get_buyer_           │             │           │
│  │ │holds.php            │ │appointments.php     │             │           │
│  │ │                     │ │                     │             │           │
│  │ │POST (CRON):         │ │GET:                 │             │           │
│  │ │ • Find expired      │ │ • Scheduled appts   │             │           │
│  │ │ • Release holds     │ │ • Completed appts   │             │           │
│  │ │ • Update status     │ │ • Auto-refresh      │             │           │
│  │ │ • Log actions       │ │ • Hold expiry time  │             │           │
│  │ └─────────────────────┘ └─────────────────────┘             │           │
│  │                                                               │           │
│  │ ┌─────────────────────┐                                      │           │
│  │ │get_vehicle_detail   │                                      │           │
│  │ │.php                 │                                      │           │
│  │ │                     │                                      │           │
│  │ │GET:                 │                                      │           │
│  │ │ • Validate vehicle  │                                      │           │
│  │ │ • Return details    │                                      │           │
│  │ │ • Seller info       │                                      │           │
│  │ └─────────────────────┘                                      │           │
│  └──────────────────────────────────────────────────────────────┘           │
│             │                                                                │
│          (PDO Queries)                                                       │
│             │                                                                │
└─────────────┼────────────────────────────────────────────────────────────────┘
              │
┌─────────────▼────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (MySQL)                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ automall_db                                                  │           │
│  ├──────────────────────────────────────────────────────────────┤           │
│  │                                                              │           │
│  │ D1_Unified_Accounts                                          │           │
│  │ ├─ User_ID (PK)                                              │           │
│  │ ├─ Role (Customer, Staff, Admin)                           │           │
│  │ ├─ Name, Phone, Email                                       │           │
│  │ └─ Account_Status                                           │           │
│  │                                                              │           │
│  │ D2_Vehicle_Inventory ★ CRITICAL                            │           │
│  │ ├─ Vehicle_ID (PK)                                          │           │
│  │ ├─ Owner_ID (FK → D1)                                       │           │
│  │ ├─ Assigned_Slot_ID (FK → D5, 1-60)                         │           │
│  │ ├─ Status (Draft, Available, On_Hold, Sold)  ★             │           │
│  │ ├─ Hold_Expiry (DateTime)  ★ OTW Timer                      │           │
│  │ └─ [Make, Model, Price, OR/CR, Mileage, Color]             │           │
│  │                                                              │           │
│  │ D3_Master_Calendar                                          │           │
│  │ ├─ Appointment_ID (PK)                                      │           │
│  │ ├─ User_ID (FK → D1)                                        │           │
│  │ ├─ Target_Vehicle_ID (FK → D2)                             │           │
│  │ ├─ Appt_Status (Scheduled, OTW_Confirmed, Completed)  ★   │           │
│  │ ├─ Schedule_DateTime                                        │           │
│  │ └─ Appt_Type (Viewing, Intake, Walk_In)                    │           │
│  │                                                              │           │
│  │ D5_Slot_Storage ★ 60-SLOT LIMIT                            │           │
│  │ ├─ Slot_ID (PK, 1-60)  ★                                    │           │
│  │ ├─ Slot_Status (Available, Occupied)                       │           │
│  │ └─ Current_Vehicle_ID (FK → D2)                            │           │
│  │                                                              │           │
│  │ D4_Transaction_Records (Sales)                              │           │
│  │ ├─ Transaction_ID (PK)                                      │           │
│  │ ├─ Vehicle_ID, Seller_ID, Buyer_ID, Facilitated_By        │           │
│  │ ├─ Final_Sale_Price                                         │           │
│  │ └─ Transaction_Date                                         │           │
│  │                                                              │           │
│  │ D7_Billing_Records                                          │           │
│  │ ├─ Billing_ID (PK)                                          │           │
│  │ ├─ Seller_ID, Vehicle_ID                                    │           │
│  │ ├─ Rent_Amount (Monthly fee)                                │           │
│  │ └─ Payment_Status (Paid, Overdue, Pending)                 │           │
│  │                                                              │           │
│  │ D8_Inquiry_Log (Blind Offers)                               │           │
│  │ ├─ Inquiry_ID (PK)                                          │           │
│  │ ├─ Buyer_ID, Target_Vehicle_ID                              │           │
│  │ ├─ Offer_Amount                                             │           │
│  │ └─ Inquiry_Status (Pending, Accepted, Rejected)            │           │
│  │                                                              │           │
│  │ Stored Procedures:                                          │           │
│  │ • sp_release_expired_holds()  ★                             │           │
│  │ • sp_get_available_vehicles()                               │           │
│  │                                                              │           │
│  │ Views:                                                       │           │
│  │ • v_available_vehicles                                      │           │
│  │ • v_upcoming_appointments                                   │           │
│  │                                                              │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  ★ = Critical for OTW functionality                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - OTW Soft Hold Process

```
TIMELINE: 2 HOURS BEFORE APPOINTMENT
─────────────────────────────────────

T-120 min (2 hours before)
  │
  ├─→ Frontend polls every 30 sec
  │   └─→ SQL: SELECT * FROM D3_Master_Calendar 
  │       WHERE Schedule_DateTime between NOW() and NOW()+120min
  │
T-60 min
  │
  └─→ Still polling... no action yet
  
T-10 min
  │
  ├─→ Frontend detects appointment within 2 hours
  │   └─→ Shows OTW Confirmation Modal
  │
T-5 min
  │
  ├─→ BUYER CLICKS "Confirm I'm On The Way"
  │   │
  │   ├─→ POST /api/apply_otw_hold.php
  │   │
  │   ├─→ PHP Validates:
  │   │   ├─ user_id matches appointment
  │   │   ├─ vehicle_id is valid
  │   │   ├─ vehicle_status == "Available"
  │   │   └─ appointment_status == "Scheduled"
  │   │
  │   ├─→ DB Transaction Starts:
  │   │   │
  │   │   ├─ UPDATE D2_Vehicle_Inventory
  │   │   │  SET Vehicle_Status = 'On_Hold'
  │   │   │      Hold_Expiry = NOW() + INTERVAL 2 HOUR
  │   │   │  WHERE Vehicle_ID = 1
  │   │   │
  │   │   ├─ UPDATE D3_Master_Calendar
  │   │   │  SET Appt_Status = 'OTW_Confirmed'
  │   │   │      Confirmation_Sent_At = NOW()
  │   │   │  WHERE Appointment_ID = 1
  │   │   │
  │   │   └─ Transaction Commits ✓
  │   │
  │   └─→ Return: { success: true, hold_expiry: "2026-02-21 15:30:00" }
  │
  ├─→ Frontend receives response
  │   └─→ Show success toast: "Vehicle reserved for 2 hours!"
  │

DURING 2-HOUR HOLD
──────────────────

T+30 min
  │
  ├─→ Vehicle status in DB: On_Hold
  │   └─→ Nobody else can book this vehicle
  │
T+45 min
  │
  ├─→ Other buyers viewing marketplace
  │   └─→ Vehicle NOT shown (status != Available)
  │

AFTER 2 HOURS (EITHER):
──────────────────────

A) BUYER ARRIVES & COMPLETES SALE
   ├─→ Staff completes appointment
   ├─→ UPDATE D2_Vehicle_Inventory SET Vehicle_Status = 'Sold'
   ├─→ UPDATE D3_Master_Calendar SET Appt_Status = 'Completed'
   └─→ Transaction recorded in D4

B) BUYER DOESN'T ARRIVE (EXPIRE)
   │
   ├─→ CRON Job runs every 5 minutes:
   │   POST /api/release_expired_holds.php
   │
   ├─→ PHP finds:
   │   SELECT * FROM D2_Vehicle_Inventory
   │   WHERE Vehicle_Status = 'On_Hold' 
   │   AND Hold_Expiry < NOW()
   │
   ├─→ DB Transaction:
   │   │
   │   ├─ UPDATE D2_Vehicle_Inventory
   │   │  SET Vehicle_Status = 'Available'
   │   │      Hold_Expiry = NULL
   │   │  WHERE Vehicle_ID = 1
   │   │
   │   ├─ UPDATE D3_Master_Calendar
   │   │  SET Appt_Status = 'No_Show'
   │   │  WHERE Target_Vehicle_ID = 1 
   │   │  AND Appt_Status = 'OTW_Confirmed'
   │   │
   │   └─ Transaction Commits ✓
   │
   ├─→ Vehicle becomes Available again
   │   └─→ Next buyer can now book it
   │
   └─→ Log: "Auto-released OTW hold for Vehicle 1"
```

---

## Data Integrity & Constraints

```
┌────────────────────────────────────────────────────────┐
│          REFERENTIAL INTEGRITY DIAGRAM                 │
└────────────────────────────────────────────────────────┘

D1_Unified_Accounts (User_ID)
    ↑                ↑              ↑
    │                │              │
    │ (Owner)        │ (Seller)   │ (Buyer)
    │                │              │
D2_Vehicle_Inventory ←─────────────── D4_Transaction_Records
    ↑                                    │
    │ (Target_Vehicle_ID)          (Vehicle_ID)
    │                                    │
D3_Master_Calendar                  D7_Billing_Records
    ├─→ (Current_Vehicle_ID)
    │
D5_Slot_Storage ←─ (Assigned_Slot_ID)

D8_Inquiry_Log ←─→ (Buyer_ID) to D1
               ←─→ (Target_Vehicle_ID) to D2

CONSTRAINTS:
  ✓ Slot_ID must be 1-60 (enforced in schema)
  ✓ Vehicle_Status must be in (Draft, Pending_Intake, Available, On_Hold, Sold)
  ✓ All FK relationships ON DELETE RESTRICT (except nullable)
  ✓ Unique: Phone_Number, Slot_ID per vehicle
```

---

## Performance Optimization

```
INDEXES CREATED:
  ✓ idx_role (D1) - for role-based queries
  ✓ idx_phone (D1) - for SMS notifications
  ✓ idx_status (D2) - for "Available" vehicles
  ✓ idx_slot (D2) - for slot lookups
  ✓ idx_hold_expiry (D2) - for release_expired_holds CRON
  ✓ idx_status (D3) - for appointment queries
  ✓ idx_datetime (D3) - for scheduling
  ✓ idx_status (D7) - for billing queries
  ✓ idx_status (D8) - for offer queries

QUERY OPTIMIZATION:
  • Pagination (limit 20, max 100)
  • SELECT only needed columns
  • JOIN with indexes
  • Use prepared statements (PDO)
```

---

## Deployment Architecture

```
PRODUCTION SETUP:
┌─────────────────────────────────────────────────────┐
│                    INTERNET                         │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│        NGINX Reverse Proxy (Port 80/443)            │
│        (SSL/HTTPS termination)                      │
└────────────┬────────────────────────────────────────┘
             │
        ┌────┴────┐
        │          │
┌───────▼──────┐ ┌──────▼───────┐
│ React App    │ │ PHP Backend  │
│ (Port 3000)  │ │ (Port 8080)  │
└───────┬──────┘ └──────┬───────┘
        │               │
        └───────┬───────┘
                │
        ┌───────▼──────────┐
        │   MySQL 5.7+     │
        │ (Port 3306)      │
        │ automall_db      │
        └──────────────────┘

CRON JOBS:
  */5 * * * * curl -X POST http://localhost:8080/api/release_expired_holds.php
  0 1 * * * mysqldump -u root automall_db | gzip > backup_$(date +\%Y\%m\%d).sql.gz
```

---

**Architecture Version**: 1.0  
**Last Updated**: February 21, 2026

---

## End-to-End Business Logic (DFD 1.0–18.0)

This section maps the high-level DFD processes to concrete API endpoints, tables, and rules so the system can be tested consistently.

### 1. Accounts & Roles

- **(1.0) Authenticate & Register Account**  
  - Endpoints:  
    - `/backend/api/auth/login.php` → login (JWT)  
    - `/backend/api/auth/register.php` → registration (JWT)  
  - Tables: `D1_Unified_Accounts`  
  - Rules:  
    - Verify `Email` exists and `Account_Status = 'Active'`.  
    - Password check supports legacy `SHA2` hashes and new bcrypt, with auto‑rehash.  
    - Successful login/registration returns JWT + role (`Customer`/`Staff`/`Admin`).

- **(2.0) Assign Staff System Access**  
  - Endpoint: `/backend/api/admin/admin_panel.php?action=manage_staff` (owner/admin only).  
  - Tables: `D1_Unified_Accounts`  
  - Rules:  
    - Only `Role = 'Admin'` may create/update `Role = 'Staff'`.  
    - Enforces unique `Email` and `Phone_Number`.

- **(18.0) Extract Transaction & Inventory Reports**  
  - Endpoint: `/backend/api/admin/admin_panel.php?action=analytics`  
  - Tables: `D2_Vehicle_Inventory`, `D4_Transaction_Records`, `D5_Slot_Storage`, `D7_Billing_Records`, `D8_Inquiry_Log`  
  - Rules:  
    - Aggregates revenue, slot utilization, overdue billing, and pending offers for the Admin Dashboard analytics UI.

### 2. Seller Journey

- **(3.0) Upload Vehicle Details & OR/CR**  
  - Endpoints:  
    - `/backend/api/seller/upload_vehicle.php` → create draft vehicle.  
    - `/backend/api/uploads/file_upload.php` → upload OR/CR images.  
  - Tables: `D2_Vehicle_Inventory`  
  - Rules:  
    - Authenticated Seller passes `user_id` and vehicle specs.  
    - Inserts row with `Vehicle_Status = 'Draft'`, `Assigned_Slot_ID = NULL`.  
    - Staff see drafts in Admin “Approvals” view.

- **(5.0) Book Physical Intake Schedule**  
  - Endpoint: `/backend/api/appointments/schedule_intake.php` (routed via `AppointmentController` in MVC or equivalent script).  
  - Tables: `D3_Master_Calendar`  
  - Rules:  
    - Creates `Appt_Type = 'Intake_Appraisal'`, `Appt_Status = 'Scheduled'` linked to `Owner_ID` and `Vehicle_ID`.

- **(7.0) Submit Monthly Slot Rental Fee**  
  - Endpoint: `/backend/api/transactions/manage_transactions.php?action=record_rent_payment`  
  - Tables: `D7_Billing_Records`  
  - Rules:  
    - Inserts billing row with `Payment_Status = 'Paid'`, `Payment_Date = NOW()`.  
    - Used by Seller dashboard and Admin analytics for rent revenue.

- **(11.0) Accept or Reject Blind Offers**  
  - Endpoint: `/backend/api/offers/manage_offers.php`  
    - `action=create` → Buyer submits offer.  
    - `action=update_status` → Seller accepts/rejects/counters.  
  - Tables: `D8_Inquiry_Log`  
  - Rules:  
    - New offers default to `Inquiry_Status = 'Pending_Seller'`.  
    - Seller decisions set `Inquiry_Status` to `Accepted` / `Rejected` / `Countered` and update `Counter_Offer` when needed.

### 3. Staff Journey

- **(4.0) Verify Submitted OR/CR Documents**  
  - Endpoint: `/backend/api/admin/admin_panel.php?action=verify_vehicle_docs`  
  - Tables: `D2_Vehicle_Inventory`  
  - Rules:  
    - Staff review drafts and set `Vehicle_Status` to `Pending_Intake` or mark as rejected with reason.

- **(6.0) Appraise Condition & Assign Parking Slot**  
  - Endpoint: `/backend/api/admin/admin_panel.php?action=assign_slot`  
  - Tables: `D2_Vehicle_Inventory`, `D5_Slot_Storage`  
  - Rules:  
    - Choose `Slot_ID` where `Slot_Status = 'Available'`.  
    - Update `D2_Vehicle_Inventory.Assigned_Slot_ID` and set `D5_Slot_Storage.Slot_Status = 'Occupied'`, `Current_Vehicle_ID = Vehicle_ID`.

- **(8.0) Publish Listing to Web Catalog**  
  - Endpoint: `/backend/api/admin/admin_panel.php?action=publish_listing`  
  - Tables: `D2_Vehicle_Inventory`  
  - Rules:  
    - After docs verified, slot assigned, and rent paid, set `Vehicle_Status = 'Available'`.  
    - Frontend marketplace (`get_available_vehicles.php`) only shows `Available` vehicles.

- **(15.0) Record Sudden Walk‑ins & Trade‑ins**  
  - Endpoint: `/backend/api/appointments/schedule_walkin.php`  
  - Tables: `D3_Master_Calendar`  
  - Rules:  
    - Creates `Appt_Type = 'Walk_In'`, optional `Trade_In_Details`, linked to `User_ID` when known.

- **(16.0) Execute Sale & Print Certificates**  
  - Endpoint: `/backend/api/transactions/manage_transactions.php?action=complete_sale`  
  - Tables: `D4_Transaction_Records`, `D2_Vehicle_Inventory`, `D5_Slot_Storage`, `D7_Billing_Records`  
  - Rules:  
    - Inserts `D4_Transaction_Records` row with seller, buyer, facilitator, price.  
    - Sets `Vehicle_Status = 'Sold'`.  
    - Flags slot and billing records for cleanup in process (17.0).

### 4. Buyer Journey

- **(9.0) Browse Web Catalog & Filter Searches**  
  - Endpoints:  
    - `/backend/api/get_available_vehicles.php` (legacy script)  
    - or `/api/vehicles` via `VehicleController::getAvailable()`  
  - Tables / Views: `D2_Vehicle_Inventory`, `v_available_vehicles`  
  - Rules:  
    - Only `Vehicle_Status = 'Available'` are returned, with optional filters for price, make, fuel, etc.

- **(10.0) Submit Financial Blind Offer**  
  - Endpoint: `/backend/api/offers/manage_offers.php?action=create`  
  - Tables: `D8_Inquiry_Log`  
  - Rules:  
    - Inserts `Buyer_ID`, `Target_Vehicle_ID`, `Offer_Amount`, `Inquiry_Status='Pending_Seller'`, optional `Message` and `Response_Deadline`.

- **(12.0) Book Shop Viewing Date & Time**  
  - Endpoints:  
    - `/backend/api/appointments/schedule_viewing.php` (or `AppointmentController::schedule`)  
    - `/backend/api/get_buyer_appointments.php` → list for Buyer dashboard.  
  - Tables: `D3_Master_Calendar`  
  - Rules:  
    - Creates `Appt_Type = 'Viewing'`, `Appt_Status = 'Scheduled'` linked to buyer and vehicle.

- **(13.0) Confirm OTW & Lock Unit**  
  - Endpoints:  
    - `/backend/api/apply_otw_hold.php` → apply hold.  
    - `/backend/api/release_expired_holds.php` → auto‑release (see System Jobs).  
  - Tables: `D2_Vehicle_Inventory`, `D3_Master_Calendar`  
  - Rules:  
    - Validates that appointment belongs to buyer and is within the allowed time window.  
    - Sets `Vehicle_Status = 'On_Hold'`, `Hold_Expiry = NOW() + INTERVAL 2 HOUR` and `Appt_Status = 'OTW_Confirmed'`.

### 5. System Jobs

- **(14.0) Auto‑Release Expired OTW Holds**  
  - Endpoint: `/backend/api/release_expired_holds.php` (cron or Task Scheduler).  
  - Tables / Procedures: `D2_Vehicle_Inventory`, `D3_Master_Calendar`, `sp_release_expired_holds()`  
  - Rules:  
    - Finds `Vehicle_Status = 'On_Hold'` where `Hold_Expiry < NOW()` and sets them back to `Available` while updating related appointments to `No_Show`.

- **(17.0) Remove Sold Listing & Free Up Slot**  
  - Endpoint: `/backend/api/transactions/manage_transactions.php?action=free_slot` (or part of `complete_sale`).  
  - Tables: `D2_Vehicle_Inventory`, `D5_Slot_Storage`  
  - Rules:  
    - For `Vehicle_Status = 'Sold'`, clears `Assigned_Slot_ID` and sets the corresponding `D5_Slot_Storage.Slot_Status = 'Available'`, `Current_Vehicle_ID = NULL`.

Use this mapping as your test matrix: for each DFD step, call the listed endpoint, verify the affected table(s), and then confirm the correct UI (Buyer Dashboard, Seller Garage, or Admin Command Center) reflects the updated state.
