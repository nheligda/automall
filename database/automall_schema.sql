-- =====================================================
-- AUTOMALL - Web-Based Proxy Car Sales & Slot-Rental Management System
-- Database Schema (MySQL)
-- =====================================================

-- Drop existing database if exists
DROP DATABASE IF EXISTS automall_db;
CREATE DATABASE automall_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE automall_db;

-- =====================================================
-- D1: Unified Accounts Table
-- =====================================================
CREATE TABLE D1_Unified_Accounts (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Role ENUM('Customer', 'Staff', 'Admin') NOT NULL DEFAULT 'Customer',
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone_Number VARCHAR(20) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Account_Status ENUM('Active', 'Banned', 'Suspended') NOT NULL DEFAULT 'Active',
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (Role),
    INDEX idx_phone (Phone_Number),
    INDEX idx_email (Email)
);

-- =====================================================
-- D5: Slot Storage Table (Create before D2 for FK reference)
-- =====================================================
CREATE TABLE D5_Slot_Storage (
    Slot_ID INT PRIMARY KEY COMMENT 'Values 1-60 only',
    Slot_Status ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
    Current_Vehicle_ID INT UNIQUE NULL,
    Last_Updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (Slot_Status)
);

-- Populate Slot_Storage with 60 slots (1-60)
INSERT INTO D5_Slot_Storage (Slot_ID, Slot_Status) 
VALUES 
(1, 'Available'), (2, 'Available'), (3, 'Available'), (4, 'Available'), (5, 'Available'),
(6, 'Available'), (7, 'Available'), (8, 'Available'), (9, 'Available'), (10, 'Available'),
(11, 'Available'), (12, 'Available'), (13, 'Available'), (14, 'Available'), (15, 'Available'),
(16, 'Available'), (17, 'Available'), (18, 'Available'), (19, 'Available'), (20, 'Available'),
(21, 'Available'), (22, 'Available'), (23, 'Available'), (24, 'Available'), (25, 'Available'),
(26, 'Available'), (27, 'Available'), (28, 'Available'), (29, 'Available'), (30, 'Available'),
(31, 'Available'), (32, 'Available'), (33, 'Available'), (34, 'Available'), (35, 'Available'),
(36, 'Available'), (37, 'Available'), (38, 'Available'), (39, 'Available'), (40, 'Available'),
(41, 'Available'), (42, 'Available'), (43, 'Available'), (44, 'Available'), (45, 'Available'),
(46, 'Available'), (47, 'Available'), (48, 'Available'), (49, 'Available'), (50, 'Available'),
(51, 'Available'), (52, 'Available'), (53, 'Available'), (54, 'Available'), (55, 'Available'),
(56, 'Available'), (57, 'Available'), (58, 'Available'), (59, 'Available'), (60, 'Available');

-- =====================================================
-- D2: Vehicle Inventory Table
-- =====================================================
CREATE TABLE D2_Vehicle_Inventory (
    Vehicle_ID INT AUTO_INCREMENT PRIMARY KEY,
    Owner_ID INT NOT NULL,
    Assigned_Slot_ID INT UNIQUE NULL,
    Make_Model_Year VARCHAR(100) NOT NULL,
    Asking_Price DECIMAL(12, 2) NOT NULL,
    OR_CR_Image_URL VARCHAR(500) NULL,
    Vehicle_Status ENUM('Draft', 'Pending_Intake', 'Available', 'On_Hold', 'Sold') NOT NULL DEFAULT 'Draft',
    Hold_Expiry DATETIME NULL,
    Description TEXT NULL,
    Mileage INT NULL,
    Transmission VARCHAR(50) NULL,
    Fuel_Type VARCHAR(50) NULL,
    Color VARCHAR(50) NULL,
    Plate_Number VARCHAR(32) NULL,
    Engine_Number VARCHAR(64) NULL,
    Chassis_Number VARCHAR(64) NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Owner_ID) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Assigned_Slot_ID) REFERENCES D5_Slot_Storage(Slot_ID) ON DELETE SET NULL,
    INDEX idx_owner (Owner_ID),
    INDEX idx_status (Vehicle_Status),
    INDEX idx_slot (Assigned_Slot_ID),
    INDEX idx_hold_expiry (Hold_Expiry)
);

-- =====================================================
-- D3: Master Calendar Table
-- =====================================================
CREATE TABLE D3_Master_Calendar (
    Appointment_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NULL,
    Target_Vehicle_ID INT NOT NULL,
    Appt_Type ENUM('Viewing', 'Intake_Appraisal', 'Walk_In') NOT NULL,
    Schedule_DateTime DATETIME NOT NULL,
    Has_Trade_In BOOLEAN DEFAULT FALSE,
    Trade_In_Details VARCHAR(500) NULL,
    Appt_Status ENUM('Scheduled', 'OTW_Confirmed', 'Completed', 'Cancelled', 'No_Show') NOT NULL DEFAULT 'Scheduled',
    Confirmation_Sent_At DATETIME NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE SET NULL,
    FOREIGN KEY (Target_Vehicle_ID) REFERENCES D2_Vehicle_Inventory(Vehicle_ID) ON DELETE RESTRICT,
    INDEX idx_user (User_ID),
    INDEX idx_vehicle (Target_Vehicle_ID),
    INDEX idx_status (Appt_Status),
    INDEX idx_datetime (Schedule_DateTime)
);

-- =====================================================
-- D4: Transaction Records Table
-- =====================================================
CREATE TABLE D4_Transaction_Records (
    Transaction_ID INT AUTO_INCREMENT PRIMARY KEY,
    Vehicle_ID INT NOT NULL,
    Seller_ID INT NOT NULL,
    Buyer_ID INT NULL,
    Facilitated_By INT NOT NULL,
    Final_Sale_Price DECIMAL(12, 2) NOT NULL,
    Transaction_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Payment_Method VARCHAR(50) NULL,
    Notes TEXT NULL,
    FOREIGN KEY (Vehicle_ID) REFERENCES D2_Vehicle_Inventory(Vehicle_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Seller_ID) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Buyer_ID) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE SET NULL,
    FOREIGN KEY (Facilitated_By) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE RESTRICT,
    INDEX idx_vehicle (Vehicle_ID),
    INDEX idx_seller (Seller_ID),
    INDEX idx_buyer (Buyer_ID),
    INDEX idx_date (Transaction_Date)
);

-- =====================================================
-- D7: Billing Records Table
-- =====================================================
CREATE TABLE D7_Billing_Records (
    Billing_ID INT AUTO_INCREMENT PRIMARY KEY,
    Seller_ID INT NOT NULL,
    Vehicle_ID INT NOT NULL,
    Rent_Amount DECIMAL(12, 2) NOT NULL,
    Rent_Due_Date DATE NOT NULL,
    Payment_Status ENUM('Paid', 'Overdue', 'Pending_Verification', 'Cancelled') NOT NULL DEFAULT 'Pending_Verification',
    Payment_Date DATETIME NULL,
    Payment_Method VARCHAR(50) NULL,
    Invoice_URL VARCHAR(500) NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Seller_ID) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Vehicle_ID) REFERENCES D2_Vehicle_Inventory(Vehicle_ID) ON DELETE RESTRICT,
    INDEX idx_seller (Seller_ID),
    INDEX idx_status (Payment_Status),
    INDEX idx_due_date (Rent_Due_Date)
);

-- =====================================================
-- D8: Inquiry Log Table (Blind Offers)
-- =====================================================
CREATE TABLE D8_Inquiry_Log (
    Inquiry_ID INT AUTO_INCREMENT PRIMARY KEY,
    Buyer_ID INT NOT NULL,
    Target_Vehicle_ID INT NOT NULL,
    Offer_Amount DECIMAL(12, 2) NOT NULL,
    Inquiry_Status ENUM('Pending_Seller', 'Accepted', 'Rejected', 'Countered', 'Withdrawn') NOT NULL DEFAULT 'Pending_Seller',
    Counter_Offer DECIMAL(12, 2) NULL,
    Counter_Timestamp DATETIME NULL,
    Response_Deadline DATETIME NULL,
    Message TEXT NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Buyer_ID) REFERENCES D1_Unified_Accounts(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Target_Vehicle_ID) REFERENCES D2_Vehicle_Inventory(Vehicle_ID) ON DELETE CASCADE,
    INDEX idx_buyer (Buyer_ID),
    INDEX idx_vehicle (Target_Vehicle_ID),
    INDEX idx_status (Inquiry_Status),
    INDEX idx_deadline (Response_Deadline)
);

-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Insert test users
INSERT INTO D1_Unified_Accounts (Role, First_Name, Last_Name, Email, Phone_Number, Password_Hash, Account_Status)
VALUES 
('Admin', 'Admin', 'User', 'admin@automall.com', '09091234567', SHA2('admin123', 256), 'Active'),
('Staff', 'Staff', 'Member', 'staff@automall.com', '09091234568', SHA2('staff123', 256), 'Active'),
('Customer', 'Juan', 'Dela Cruz', 'juan@example.com', '09171234567', SHA2('password123', 256), 'Active'),
('Customer', 'Maria', 'Santos', 'maria@example.com', '09181234567', SHA2('password123', 256), 'Active');

-- Insert test vehicle
INSERT INTO D2_Vehicle_Inventory (Owner_ID, Make_Model_Year, Asking_Price, Vehicle_Status, Description, Mileage, Transmission, Fuel_Type, Color, Plate_Number)
VALUES 
(3, '2019 Mitsubishi Montero Sport', 1200000, 'Available', 'Well-maintained SUV', 85000, 'Automatic', 'Diesel', 'Black', 'TEST-1234');

-- Insert test appointment
INSERT INTO D3_Master_Calendar (User_ID, Target_Vehicle_ID, Appt_Type, Schedule_DateTime, Appt_Status)
VALUES 
(4, 1, 'Viewing', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Scheduled');

-- =====================================================
-- Stored Procedures for Common Operations
-- =====================================================

-- Procedure: Release expired holds
DELIMITER //
CREATE PROCEDURE sp_release_expired_holds()
BEGIN
    UPDATE D2_Vehicle_Inventory 
    SET Vehicle_Status = 'Available', Hold_Expiry = NULL 
    WHERE Vehicle_Status = 'On_Hold' AND Hold_Expiry < NOW();
END //
DELIMITER ;

-- Procedure: Get available vehicles
DELIMITER //
CREATE PROCEDURE sp_get_available_vehicles()
BEGIN
    SELECT * FROM D2_Vehicle_Inventory 
    WHERE Vehicle_Status = 'Available' 
    ORDER BY Created_At DESC;
END //
DELIMITER ;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View: Available vehicles with owner info
CREATE VIEW v_available_vehicles AS
SELECT 
    vi.Vehicle_ID,
    vi.Make_Model_Year,
    vi.Asking_Price,
    vi.Mileage,
    vi.Fuel_Type,
    vi.Color,
    ua.First_Name AS Seller_First_Name,
    ua.Last_Name AS Seller_Last_Name,
    ua.Phone_Number AS Seller_Phone,
    ss.Slot_ID,
    vi.Created_At
FROM D2_Vehicle_Inventory vi
JOIN D1_Unified_Accounts ua ON vi.Owner_ID = ua.User_ID
LEFT JOIN D5_Slot_Storage ss ON vi.Assigned_Slot_ID = ss.Slot_ID
WHERE vi.Vehicle_Status = 'Available';

-- View: Upcoming appointments
CREATE VIEW v_upcoming_appointments AS
SELECT 
    da.Appointment_ID,
    da.Schedule_DateTime,
    ua.First_Name,
    ua.Last_Name,
    ua.Phone_Number,
    vi.Make_Model_Year,
    vi.Vehicle_ID,
    da.Appt_Type,
    da.Appt_Status
FROM D3_Master_Calendar da
JOIN D1_Unified_Accounts ua ON da.User_ID = ua.User_ID
JOIN D2_Vehicle_Inventory vi ON da.Target_Vehicle_ID = vi.Vehicle_ID
WHERE da.Schedule_DateTime > NOW() AND da.Appt_Status IN ('Scheduled', 'OTW_Confirmed');

-- =====================================================
-- End of Schema
-- =====================================================