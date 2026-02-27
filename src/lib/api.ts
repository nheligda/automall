/**
 * AUTOMALL - useAPI Custom Hook
 * Handles all API calls to PHP backend
 */

import { useState, useCallback } from 'react';

// Base URL for backend API (shared with AuthContext)
// - In dev, override with VITE_API_BASE (e.g. http://localhost/automall%20proj/backend/api)
// - In production under XAMPP, the relative path resolves to /automall%20proj/backend/api
const API_BASE = import.meta.env.VITE_API_BASE || '/automall%20proj/backend/api';

// Helper: resolve a relative upload path (e.g. "uploads/user_5/cars/...png")
// into a full URL that works both in dev (Vite) and in XAMPP production.
// This mirrors the backend API base, replacing the trailing /api with /.
export const resolveBackendUploadUrl = (relativePath: string) => {
  const base = API_BASE.replace(/\/api\/?$/, '/');
  const cleanRel = relativePath.replace(/^\/+/, '');
  return `${base}${cleanRel}`;
};

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE}/${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'API error');
        }

        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { call, loading, error };
};

/**
 * Helper: Apply OTW Hold
 */
export const applyOTWHold = async (
  userId: number,
  vehicleId: number,
  appointmentId: number
) => {
  const response = await fetch(
    `${API_BASE}/apply_otw_hold.php`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        vehicle_id: vehicleId,
        appointment_id: appointmentId,
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to apply OTW hold');
  return data;
};

/**
 * Helper: Get Available Vehicles
 * Supports optional search and price filters.
 */
export const getAvailableVehicles = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  min_price?: string | number;
  max_price?: string | number;
  fuel_type?: string;
  min_mileage?: string | number;
  max_mileage?: string | number;
  color?: string;
} = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    min_price,
    max_price,
    fuel_type,
    min_mileage,
    max_mileage,
    color,
  } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (search) query.set('search', search);
  if (min_price !== undefined && min_price !== '') query.set('min_price', String(min_price));
  if (max_price !== undefined && max_price !== '') query.set('max_price', String(max_price));
  if (fuel_type) query.set('fuel_type', fuel_type);
    if (min_mileage !== undefined && min_mileage !== '') query.set('min_mileage', String(min_mileage));
    if (max_mileage !== undefined && max_mileage !== '') query.set('max_mileage', String(max_mileage));
    if (color) query.set('color', color);

  const response = await fetch(
    `${API_BASE}/get_available_vehicles.php?${query.toString()}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch vehicles');
  return data;
};

/**
 * Helper: Get Vehicle Details
 */
export const getVehicleDetail = async (vehicleId: number) => {
  const response = await fetch(
    `${API_BASE}/get_vehicle_detail.php?vehicle_id=${vehicleId}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch vehicle');
  return data;
};

/**
 * Helper: Get Buyer Appointments
 */
export const getBuyerAppointments = async (userId: number) => {
  const response = await fetch(
    `${API_BASE}/get_buyer_appointments.php?user_id=${userId}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch appointments');
  return data;
};

/**
 * Helper: Schedule Viewing Appointment
 */
export const scheduleAppointment = async (payload: {
  user_id: number;
  vehicle_id: number;
  schedule_datetime: string;
}) => {
  const response = await fetch(`${API_BASE}/schedule_appointment.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to schedule appointment');
  return data;
};

/**
 * Helper: Get Vehicles for Current User / Admin View
 * - Uses JWT from localStorage (same shape as AuthContext)
 * - Customers see only their own vehicles
 * - Staff/Admin can see all vehicles, optionally filtered by owner_id
 */
export const getUserVehicles = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerId?: number; // Admin/Staff only
} = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    ownerId,
  } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));

  if (search) query.set('search', search);
  if (status) query.set('status', status);
  if (typeof ownerId === 'number') query.set('owner_id', String(ownerId));

  const stored = localStorage.getItem('automall_user');
  const token = stored ? (() => {
    try {
      const parsed = JSON.parse(stored);
      return parsed?.token as string | undefined;
    } catch {
      return undefined;
    }
  })() : undefined;

  const response = await fetch(
    `${API_BASE}/get_user_vehicles.php?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch user vehicles');
  return data;
};

/**
 * Helper: Seller Dashboard Summary
 */
export const getSellerDashboard = async (userId: number) => {
  const response = await fetch(
    `${API_BASE}/seller/dashboard.php?user_id=${userId}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch seller dashboard');
  return data;
};

/**
 * Helper: Upload Vehicle (Seller/Customer)
 * Backend expects `user_id` matching D1_Unified_Accounts.User_ID.
 */
export const uploadVehicle = async (payload: {
  user_id: number;
  make_model_year: string;
  asking_price: number;
  mileage?: number;
  plate_number: string;
  engine_number: string;
  chassis_number: string;
  fuel_type?: string;
  color?: string;
  description?: string;
}) => {
  const response = await fetch(`${API_BASE}/seller/upload_vehicle.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to upload vehicle');
  return data;
};

/**
 * Helper: Upload OR/CR document for a vehicle (staff-only document)
 * Uses backend/api/uploads/upload_document.php
 */
export const uploadVehicleDocument = async (
  vehicleId: number,
  file: File
) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify({ vehicle_id: vehicleId }));
  formData.append('document', file);

  const response = await fetch(
    `${API_BASE}/uploads/upload_document.php`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Failed to upload OR/CR document');
  return data;
};

/**
 * Helper: Upload vehicle images (one or many files)
 * Uses backend/api/uploads/upload_vehicle_images.php
 */
export const uploadVehicleImages = async (
  vehicleId: number,
  files: File[]
) => {
  if (!files.length) return null;

  const formData = new FormData();
  // Backend expects JSON meta in `data` and files under `images` (multiple)
  formData.append('data', JSON.stringify({ vehicle_id: vehicleId }));
  files.forEach(file => {
    formData.append('images[]', file);
  });

  const response = await fetch(
    `${API_BASE}/uploads/upload_vehicle_images.php`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Failed to upload vehicle images');
  return data;
};

/**
 * Helper: Update vehicle details (admin/staff trade-in replacement)
 * Uses backend/api/admin/update_vehicle.php
 */
export const updateVehicleDetails = async (payload: {
  vehicle_id: number;
  make_model_year?: string;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  color?: string;
  description?: string;
}) => {
  const response = await fetch(`${API_BASE}/admin/update_vehicle.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Failed to update vehicle details');
  return data;
};

/**
 * Helper: Get public vehicle images (car photos only)
 */
export const getVehicleImages = async (vehicleId: number) => {
  const response = await fetch(
    `${API_BASE}/uploads/get_vehicle_images.php?vehicle_id=${vehicleId}`
  );

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Failed to load vehicle images');
  return data;
};

/**
 * Helpers: Blind Offer Flow
 */
export const submitOffer = async (payload: {
  buyer_id: number;
  vehicle_id: number;
  offer_amount: number;
  message?: string;
}) => {
  const response = await fetch(`${API_BASE}/offers/submit_offer.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to submit offer');
  return data;
};

export const getSellerOffers = async (sellerId: number) => {
  const response = await fetch(
    `${API_BASE}/offers/get_offers.php?seller_id=${sellerId}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch offers');
  return data;
};

export const respondToOffer = async (payload: {
  inquiry_id: number;
  action: 'accept' | 'reject' | 'counter';
  counter_amount?: number;
}) => {
  const response = await fetch(`${API_BASE}/offers/respond_offer.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to respond to offer');
  return data;
};

/**
 * Helpers: Admin Panel (Dashboard, Approvals, Reports, Accounts)
 */
export const getAdminDashboard = async () => {
  const response = await fetch(`${API_BASE}/admin/dashboard.php`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch admin dashboard');
  return data;
};

export const getPendingVehicles = async () => {
  const response = await fetch(`${API_BASE}/admin/pending_vehicles.php`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch pending vehicles');
  return data;
};

export const getSlotDetails = async (slotId: number) => {
  const response = await fetch(`${API_BASE}/admin/slot_details.php?slot_id=${slotId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch slot details');
  return data;
};

export const approveVehicle = async (payload: {
  vehicle_id: number;
  action: 'approve' | 'reject';
}) => {
  const response = await fetch(`${API_BASE}/admin/approve_vehicle.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to process vehicle approval');
  return data;
};

export const getAdminReports = async () => {
  const response = await fetch(`${API_BASE}/admin/reports.php`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch reports');
  return data;
};

export const getAdminAccounts = async (params: {
  role?: 'Customer' | 'Staff' | 'Admin' | 'All';
  search?: string;
} = {}) => {
  const { role = 'All', search } = params;
  const query = new URLSearchParams();
  if (role) query.set('role', role);
  if (search) query.set('search', search);

  const response = await fetch(
    `${API_BASE}/admin/accounts.php?${query.toString()}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch accounts');
  return data;
};

export const createStaffAccount = async (payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}) => {
  const response = await fetch(`${API_BASE}/admin/accounts.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Failed to create staff account');
  return data;
};

export const updateAccountStatus = async (payload: {
  user_id: number;
  status: 'Active' | 'Suspended' | 'Banned';
}) => {
  const response = await fetch(`${API_BASE}/admin/accounts.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, action: 'update_status' }),
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Failed to update account status');
  return data;
};

/**
 * Helpers: Transactions & Billing
 */
export const completeSale = async (payload: {
  vehicle_id: number;
  seller_id: number;
  facilitated_by: number; // staff ID
  final_sale_price: number;
  buyer_id?: number;
  payment_method?: string;
  notes?: string;
}) => {
  const response = await fetch(`${API_BASE}/transactions/complete_sale.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to complete sale');
  return data;
};

export const recordPayment = async (payload: {
  billing_id: number;
  payment_method: string;
}) => {
  const response = await fetch(`${API_BASE}/transactions/record_payment.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to record payment');
  return data;
};

export const getBillingHistory = async (sellerId: number) => {
  const response = await fetch(
    `${API_BASE}/transactions/get_billing.php?seller_id=${sellerId}`
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch billing history');
  return data;
};

/**
 * Helper: Record Walk-in & Trade-in (Process 15)
 */
export const recordWalkIn = async (payload: {
  staff_id: number;
  visitor_user_id?: number | null;
  vehicle_id: number;
  schedule_datetime?: string;
  role?: 'buyer' | 'seller' | 'both';
  has_trade_in?: boolean;
  trade_in_details?: string;
}) => {
  const response = await fetch(`${API_BASE}/record_walkin.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to record walk-in');
  return data;
};
