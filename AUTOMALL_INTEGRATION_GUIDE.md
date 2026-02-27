/**
 * AUTOMALL - Integration Guide
 * How to integrate AUTOMALL components into your React app
 */

// ============================================
// 1. IMPORT REQUIRED COMPONENTS
// ============================================

import { BuyerDashboard } from '@/components/buyer/BuyerDashboard';
import { VehicleMarketplace } from '@/components/buyer/VehicleMarketplace';
import { OTWConfirmationModal } from '@/components/buyer/OTWConfirmationModal';

// ============================================
// 2. SETUP ENVIRONMENT VARIABLES
// ============================================

// Create or update .env.local file:
// VITE_API_BASE=http://localhost/automall proj/backend/api
// VITE_SHOP_PHONE=+639091234567

// ============================================
// 3. CREATE BUYER PAGE / ROUTE
// ============================================

import { useState } from 'react';
import { BuyerDashboard } from '@/components/buyer/BuyerDashboard';

export function BuyerPage() {
  // Get userId from authentication context/session
  const userId = 4; // Example: Maria Santos
  const userName = 'Maria Santos';
  const userPhone = '09181234567';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <BuyerDashboard
        userId={userId}
        userName={userName}
        userPhone={userPhone}
      />
    </div>
  );
}

// ============================================
// 4. INTEGRATE WITH MARKETPLACE
// ============================================

import { useState } from 'react';
import { VehicleMarketplace } from '@/components/buyer/VehicleMarketplace';

export function MarketplacePage() {
  const userId = 4;

  const handleVehicleSelect = (vehicle) => {
    console.log('Vehicle selected:', vehicle);
    
    // Navigate to booking/schedule viewing
    // Or open a modal to schedule appointment
    // Example: navigate(`/schedule-viewing/${vehicle.vehicle_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <VehicleMarketplace
        userId={userId}
        onVehicleSelect={handleVehicleSelect}
      />
    </div>
  );
}

// ============================================
// 5. SETUP API HELPERS IN YOUR APP
// ============================================

// Create a custom hook to manage authentication:

import { useAuth } from '@/hooks/useAuth'; // Your auth hook
import { BuyerDashboard } from '@/components/buyer/BuyerDashboard';

export function ProtectedBuyerDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'Customer') {
    return <div>Access Denied</div>;
  }

  return (
    <BuyerDashboard
      userId={user.id}
      userName={user.name}
      userPhone={user.phone}
    />
  );
}

// ============================================
// 6. HANDLE OTW NOTIFICATIONS (OPTIONAL)
// ============================================

import { useEffect, useState } from 'react';
import { toast } from 'sonner'; // Using sonner for toasts

export function OTWNotificationHandler({ userId }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const checkAppointments = async () => {
      try {
        const response = await fetch(
          `http://localhost/automall proj/backend/api/get_buyer_appointments.php?user_id=${userId}`
        );
        const data = await response.json();

        if (data.success) {
          data.data.scheduled.forEach((apt) => {
            const appointmentTime = new Date(apt.schedule_datetime).getTime();
            const now = new Date().getTime();
            const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);

            // Show notification if 2 hours away
            if (hoursUntil <= 2 && hoursUntil > 1.95) {
              toast.info(
                `Reminder: Your viewing for ${apt.make_model_year} is in 2 hours!`
              );
            }
          });
        }
      } catch (error) {
        console.error('Error checking appointments:', error);
      }
    };

    const interval = setInterval(checkAppointments, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId]);

  return null;
}

// Usage in your main app:
// <OTWNotificationHandler userId={userId} />

// ============================================
// 7. SETUP CRON JOB FOR AUTO-RELEASE
// ============================================

// Option 1: Using Node.js (node-cron)
import cron from 'node-cron';

cron.schedule('*/5 * * * *', async () => {
  try {
    const response = await fetch(
      'http://localhost/automall proj/backend/api/release_expired_holds.php',
      { method: 'POST' }
    );
    const data = await response.json();
    console.log('Released holds:', data.data.released_count);
  } catch (error) {
    console.error('Error releasing holds:', error);
  }
});

// Option 2: Using Windows Task Scheduler
// Create a .bat file:
/*
@echo off
cd C:\xampp\htdocs\automall proj
curl -X POST http://localhost/automall proj/backend/api/release_expired_holds.php
*/
// Schedule it to run every 5 minutes in Task Scheduler

// ============================================
// 8. TYPES/INTERFACES
// ============================================

interface Appointment {
  appointment_id: number;
  schedule_datetime: string;
  appt_status: 'Scheduled' | 'OTW_Confirmed' | 'Completed' | 'Cancelled' | 'No_Show';
  vehicle_id: number;
  make_model_year: string;
  asking_price: number;
  color: string;
  has_trade_in: boolean;
  hold_expiry?: string;
}

interface Vehicle {
  vehicle_id: number;
  make_model_year: string;
  asking_price: number;
  mileage: number;
  fuel_type: string;
  color: string;
  description: string;
  seller_first_name: string;
  seller_last_name: string;
  seller_phone: string;
  slot_id: number;
  created_at: string;
}

interface OTWHoldRequest {
  user_id: number;
  vehicle_id: number;
  appointment_id: number;
}

interface OTWHoldResponse {
  success: boolean;
  message: string;
  data: {
    vehicle_id: number;
    vehicle_status: string;
    hold_expiry: string;
    message: string;
  };
}

// ============================================
// 9. ERROR BOUNDARY (OPTIONAL)
// ============================================

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class BuyerErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Buyer component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-900">Something went wrong</h2>
          <p className="mt-2 text-red-800">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage:
// <BuyerErrorBoundary>
//   <BuyerDashboard {...props} />
// </BuyerErrorBoundary>

// ============================================
// 10. QUICK TROUBLESHOOTING
// ============================================

/*
ISSUE: "CORS error" when calling API
FIX: Update config.php CORS_ORIGIN to match your frontend URL
    define('CORS_ORIGIN', 'http://localhost:5173');

ISSUE: "Vehicle no longer available" error
FIX: Make sure release_expired_holds.php is running as CRON
    Check that Hold_Expiry times are set correctly

ISSUE: "Database connection failed"
FIX: Ensure XAMPP MySQL is running
    Check config.php credentials match phpMyAdmin
    Verify automall_db exists

ISSUE: OTW modal not showing
FIX: Check that appointment is within 2 hours
    Verify Appt_Status is "Scheduled"
    Check browser console for errors

ISSUE: Frontend can't reach backend
FIX: Verify Apache is running in XAMPP
    Check VITE_API_BASE in .env.local
    Test: curl http://localhost/automall proj/backend/api/get_available_vehicles.php
*/

// ============================================
// COMPLETE - Your AUTOMALL integration is ready!
// ============================================
