# 🚗 AUTOMALL - Web-Based Car Sales & Slot-Rental Management System

## Project Overview

AUTOMALL is a complete proxy car sales platform with a strict 60-car showroom slot limit. The system manages inventory, appointments, blind offers, and payment billing with a 2-hour "Soft Hold" OTW (On-The-Way) mechanism.

### Tech Stack

- **Frontend**: React.js + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend**: PHP 8+ with PDO
- **Database**: MySQL 5.7+
- **Server**: XAMPP (Apache + MySQL)
- **Build Tool**: Vite

---

## 🛠️ Installation & Setup

### Prerequisites

1. **XAMPP** installed and running (Apache + MySQL)
   - Download: https://www.apachefriends.org/
   - Start Apache & MySQL services

2. **Node.js** (v16+) and npm
   - Download: https://nodejs.org/

3. **Git** (optional)

### Step 1: Database Setup

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Run the SQL script to initialize the database:
   - Copy content from `database/automall_schema.sql`
   - Create new database or select existing `automall_db`
   - Execute the SQL script
   - Verify 8 tables are created: D1-D8

```sql
-- Import automall_schema.sql into phpMyAdmin
```

### Step 2: Backend Setup (PHP API)

1. **File Structure**:
   ```
   c:\xampp\htdocs\automall proj\
   ├── backend\
   │   ├── config.php (Database connection)
   │   └── api\
   │       ├── apply_otw_hold.php
   │       ├── release_expired_holds.php
   │       ├── get_available_vehicles.php
   │       ├── get_vehicle_detail.php
   │       └── get_buyer_appointments.php
   └── database\
       └── automall_schema.sql
   ```

2. **Update config.php** if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Change if you have MySQL password
   define('DB_NAME', 'automall_db');
   ```

3. **Test Backend**:
   ```bash
   curl http://localhost/automall proj/backend/api/get_available_vehicles.php
   ```

### Step 3: Frontend Setup (React)

1. Navigate to the React project:
   ```bash
   cd "c:\Users\Administrator\Downloads\Web-Based Car Sales System"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```
   VITE_API_BASE=http://localhost/automall proj/backend/api
   VITE_SHOP_PHONE=+639091234567
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   - Opens at: `http://localhost:5173`

---

## 📋 API Documentation

### 1. Apply OTW Hold

**Endpoint**: `POST /backend/api/apply_otw_hold.php`

**Request**:
```json
{
  "user_id": 4,
  "vehicle_id": 1,
  "appointment_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTW Hold successfully applied",
  "data": {
    "vehicle_id": 1,
    "vehicle_status": "On_Hold",
    "hold_expiry": "2026-02-21 15:30:00",
    "message": "Vehicle is now on hold. You have 2 hours to arrive at the showroom."
  }
}
```

**Logic**:
- Checks if vehicle is still `Available`
- Updates vehicle status to `On_Hold`
- Sets `Hold_Expiry` to 2 hours from now
- Updates appointment to `OTW_Confirmed`
- Uses transactions for data integrity

---

### 2. Get Available Vehicles

**Endpoint**: `GET /backend/api/get_available_vehicles.php`

**Query Parameters**:
- `page`: int (default: 1)
- `limit`: int (default: 20, max: 100)
- `search`: string (make/model)
- `min_price`: decimal
- `max_price`: decimal
- `fuel_type`: string

**Response**:
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "vehicle_id": 1,
        "make_model_year": "2019 Mitsubishi Montero Sport",
        "asking_price": 1200000,
        "mileage": 85000,
        "fuel_type": "Diesel",
        "color": "Black",
        "seller_first_name": "Juan",
        "seller_last_name": "Dela Cruz",
        "seller_phone": "09171234567",
        "slot_id": 15
      }
    ],
    "total": 45,
    "page": 1,
    "total_pages": 3,
    "limit": 20
  }
}
```

---

### 3. Get Vehicle Detail

**Endpoint**: `GET /backend/api/get_vehicle_detail.php?vehicle_id=1`

**Response**: Returns complete vehicle details including OR/CR image URL

---

### 4. Get Buyer Appointments

**Endpoint**: `GET /backend/api/get_buyer_appointments.php?user_id=4`

**Response**:
```json
{
  "success": true,
  "data": {
    "scheduled": [
      {
        "appointment_id": 1,
        "schedule_datetime": "2026-02-22 14:00:00",
        "appt_status": "Scheduled",
        "vehicle_id": 1,
        "make_model_year": "2019 Mitsubishi Montero Sport",
        "asking_price": 1200000,
        "hold_expiry": null
      }
    ],
    "completed": []
  }
}
```

---

### 5. Release Expired Holds (CRON)

**Endpoint**: `POST /backend/api/release_expired_holds.php`

**Setup as CRON Job**:
```bash
# Run every 5 minutes
*/5 * * * * curl -X POST http://localhost/automall proj/backend/api/release_expired_holds.php
```

---

## 🎨 React Components

### BuyerDashboard

Main component for buyers to manage appointments and OTW holds.

```tsx
<BuyerDashboard
  userId={4}
  userName="Maria Santos"
  userPhone="09181234567"
/>
```

**Features**:
- View upcoming appointments
- View appointment history
- Auto-refresh every 30 seconds
- OTW Confirmation button
- Call showroom button

---

### OTWConfirmationModal

Modal that appears 2 hours before appointment.

```tsx
<OTWConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  appointment={appointment}
  userId={userId}
  onSuccess={handleSuccess}
/>
```

**Features**:
- Countdown timer
- Vehicle details preview
- 2-hour hold confirmation
- Success animation
- Error handling

---

### VehicleMarketplace

Browse and filter available vehicles.

```tsx
<VehicleMarketplace
  userId={userId}
  onVehicleSelect={handleVehicleSelect}
/>
```

**Features**:
- Search by make/model
- Price range filter
- Pagination
- Seller contact info
- Schedule viewing button

---

## 💾 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| **D1_Unified_Accounts** | Users (Buyers, Sellers, Staff, Admin) |
| **D2_Vehicle_Inventory** | Vehicle listings with status & hold tracking |
| **D3_Master_Calendar** | Appointments (Viewings, Intakes, Walk-ins) |
| **D4_Transaction_Records** | Completed sales records |
| **D5_Slot_Storage** | 60 physical showroom slots (1-60) |
| **D7_Billing_Records** | Monthly rental fees for slots |
| **D8_Inquiry_Log** | Blind offers from buyers |

### Key Constraints

- **Slot Limit**: `Slot_ID` must be between 1 and 60
- **Vehicle Status**: `Draft`, `Pending_Intake`, `Available`, `On_Hold`, `Sold`
- **Appointment Status**: `Scheduled`, `OTW_Confirmed`, `Completed`, `Cancelled`, `No_Show`
- **Hold Expiry**: Auto-expires after 2 hours (use stored procedure or CRON)

---

## 🔄 Business Flow: OTW Soft Hold

```
1. BUYER schedules viewing
   ↓
2. SYSTEM sets Appt_Status = "Scheduled"
   ↓
3. BUYER receives notification at 2-hour mark
   ↓
4. BUYER clicks "Confirm I'm On The Way"
   ↓
5. PHP apply_otw_hold.php executes:
   - Vehicle_Status → "On_Hold"
   - Hold_Expiry → NOW() + 2 HOURS
   - Appt_Status → "OTW_Confirmed"
   ↓
6. SYSTEM monitors Hold_Expiry:
   - If buyer arrives: SALE or appointment completed
   - If Hold_Expiry expired: release hold, revert status
   ↓
7. Vehicle becomes "Available" again (if not purchased)
```

---

## 🚨 Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Vehicle no longer available` | Vehicle status is not "Available" | Check if vehicle is in `On_Hold`, `Sold`, or `Draft` |
| `Appointment not found` | Invalid appointment_id or user_id mismatch | Verify IDs in DB |
| `Database connection failed` | MySQL not running or wrong credentials | Start XAMPP, check config.php |
| `CORS error` | Frontend not allowed by backend | Update `CORS_ORIGIN` in config.php |
| `Hold not released` | CRON job not running | Schedule `release_expired_holds.php` as CRON |

---

## 📊 Testing Data

Default test users (passwords are SHA2 hashed):

```sql
User 1 (Admin): admin@automall.com / admin123
User 2 (Staff): staff@automall.com / staff123
User 3 (Seller): juan@example.com / password123
User 4 (Buyer): maria@example.com / password123
```

Test vehicle: 2019 Mitsubishi Montero Sport - ₱1,200,000

---

## 🔐 Security Best Practices

1. **PDO Prepared Statements**: All queries use parameterized statements
2. **CORS Headers**: Restrict to frontend origin only
3. **Input Validation**: Validate all numeric IDs and enums
4. **Transactions**: Critical operations use DB transactions
5. **Error Logging**: All errors logged to error_log
6. **Password Hashing**: Use bcrypt in production (currently SHA2 for demo)

---

## 📱 Frontend Integration Points

### Environment Variables

```
VITE_API_BASE=http://localhost/automall proj/backend/api
VITE_SHOP_PHONE=+639091234567
VITE_DEBUG=true
```

### API Hook Usage

```tsx
import { useAPI, applyOTWHold } from '@/lib/api';

// Option 1: Using hook
const { call, loading, error } = useAPI();
const response = await call('get_available_vehicles.php');

// Option 2: Using direct helper
const response = await applyOTWHold(userId, vehicleId, appointmentId);
```

---

## 🚀 Deployment Checklist

- [ ] Database initialized with automall_schema.sql
- [ ] Backend config.php configured correctly
- [ ] Frontend environment variables set
- [ ] CORS origin updated for production URL
- [ ] CRON job setup for release_expired_holds.php
- [ ] Database backups configured
- [ ] Error logging reviewed
- [ ] Password hashing updated to bcrypt
- [ ] SSL/HTTPS configured
- [ ] Load testing completed

---

## 📞 Support & Documentation

- **Database Schema**: See automall_schema.sql
- **API Reference**: See individual .php files
- **UI/UX Components**: See React components in src/components/
- **Business Logic**: See config.php helper functions

---

**Version**: 1.0.0  
**Last Updated**: February 21, 2026  
**Status**: Production Ready ✅
