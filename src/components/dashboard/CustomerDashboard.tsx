import React, { useEffect, useState } from 'react';
import { getUserVehicles, getSellerOffers, getAdminDashboard, respondToOffer, uploadVehicle, uploadVehicleImages, uploadVehicleDocument, getVehicleImages, resolveBackendUploadUrl, getBillingHistory, recordPayment } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Bell, DollarSign, Calendar, CheckCircle, XCircle, Clock, ArrowRight, UserCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type StaffNotification = {
  id: string | number;
  type: 'info' | 'warning' | 'success';
  message: string;
  date: string;
  read?: boolean;
};

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'garage' | 'offers' | 'billing' | 'notifications'>('garage');
  const { user } = useAuth();

  const [myCars, setMyCars] = useState<any[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [carsError, setCarsError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ slots_available: number; slots_occupied: number } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [vehicleImages, setVehicleImages] = useState<Record<number, string | null>>({});
  const [showOrcrModal, setShowOrcrModal] = useState(false);
  const [orcrVehicleId, setOrcrVehicleId] = useState<number | null>(null);
  const [orcrUploading, setOrcrUploading] = useState(false);
  const [orcrError, setOrcrError] = useState<string | null>(null);

  const [billing, setBilling] = useState<any[] | null>(null);
  const [billingSummary, setBillingSummary] = useState<any | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.user_id) {
      setMyCars([]);
      return;
    }

    const load = async () => {
      try {
        setLoadingCars(true);
        setCarsError(null);
        const data = await getUserVehicles({ page: 1, limit: 50 });

        if (data?.success && data.data?.vehicles) {
          setMyCars(data.data.vehicles);
        } else {
          setCarsError(data?.error || 'Failed to load your vehicles');
          setMyCars([]);
        }
      } catch (err) {
        setCarsError(
          err instanceof Error ? err.message : 'Failed to load your vehicles'
        );
        setMyCars([]);
      } finally {
        setLoadingCars(false);
      }
    };

    load();
  }, [user?.user_id]);

  // Load live offers for this seller
  useEffect(() => {
    if (!user?.user_id) {
      setOffers([]);
      return;
    }

    const loadOffers = async () => {
      try {
        setLoadingOffers(true);
        setOffersError(null);
        const data = await getSellerOffers(user.user_id);

        if (data?.success && data.data?.all_offers) {
          setOffers(data.data.all_offers);
        } else {
          setOffersError(data?.error || 'Failed to load your offers');
          setOffers([]);
        }
      } catch (err) {
        setOffersError(
          err instanceof Error ? err.message : 'Failed to load your offers'
        );
        setOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    };

    loadOffers();
  }, [user?.user_id]);

  // Load global showroom availability stats (live)
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setLoadingAvailability(true);
        setAvailabilityError(null);
        const data = await getAdminDashboard();

        if (data?.success && data.data?.stats) {
          setAvailability({
            slots_available: data.data.stats.slots_available,
            slots_occupied: data.data.stats.slots_occupied,
          });
        } else {
          setAvailabilityError(data?.error || 'Failed to load showroom status');
          setAvailability(null);
        }
      } catch (err) {
        setAvailabilityError(
          err instanceof Error ? err.message : 'Failed to load showroom status'
        );
        setAvailability(null);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, []);

  // Load billing history for this seller (slot rentals)
  useEffect(() => {
    const loadBilling = async () => {
      if (!user?.user_id) {
        setBilling(null);
        setBillingSummary(null);
        return;
      }
      try {
        setBillingLoading(true);
        setBillingError(null);
        const data = await getBillingHistory(user.user_id);
        if (data?.success && data.data) {
          setBilling(data.data.billing_records || []);
          setBillingSummary(data.data.summary || null);
        } else {
          setBillingError(data?.error || 'Failed to load billing history');
          setBilling(null);
          setBillingSummary(null);
        }
      } catch (err) {
        setBillingError(
          err instanceof Error ? err.message : 'Failed to load billing history'
        );
        setBilling(null);
        setBillingSummary(null);
      } finally {
        setBillingLoading(false);
      }
    };

    loadBilling();
  }, [user?.user_id]);

  // Load a primary photo for each vehicle card (if available)
  useEffect(() => {
    const loadImages = async () => {
      const ids = myCars
        .map(car => Number(car.Vehicle_ID))
        .filter(id => Number.isFinite(id) && id > 0);

      const missing = ids.filter(id => vehicleImages[id] === undefined);
      if (missing.length === 0) return;

      await Promise.all(
        missing.map(async id => {
          try {
            const data = await getVehicleImages(id);
            const first =
              data?.success && data.data?.images && data.data.images.length
                ? data.data.images[0].url
                : null;
            setVehicleImages(prev => ({ ...prev, [id]: first }));
          } catch {
            setVehicleImages(prev => ({ ...prev, [id]: null }));
          }
        })
      );
    };

    if (myCars.length > 0) {
      loadImages();
    }
  }, [myCars, vehicleImages]);

  const totalSlots = (availability?.slots_available ?? 0) + (availability?.slots_occupied ?? 0);
  const occupiedSlots = availability?.slots_occupied ?? 0;
  const availabilityPercentage = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;
  const availableSlots = availability?.slots_available ?? 0;

  const availabilityFillWidthClass =
    availabilityPercentage >= 90
      ? 'w-full'
      : availabilityPercentage >= 75
      ? 'w-3/4'
      : availabilityPercentage >= 50
      ? 'w-1/2'
      : availabilityPercentage > 0
      ? 'w-1/4'
      : 'w-0';

  // Derive simple staff-style notifications from live offers
  const myNotifications: StaffNotification[] = offers.map((offer: any): StaffNotification => ({
    id: offer.Inquiry_ID,
    type: offer.Inquiry_Status === 'Pending_Seller' ? 'warning' : 'info',
    message:
      offer.Inquiry_Status === 'Pending_Seller'
        ? `Pending blind offer from ${offer.First_Name} ${offer.Last_Name} on ${offer.Make_Model_Year}`
        : `Offer ${String(offer.Inquiry_Status).replace('_', ' ')} for ${offer.Make_Model_Year}`,
    date: offer.Created_At,
    read: offer.Inquiry_Status !== 'Pending_Seller',
  }));

  const myOffers = offers;

  const handleOfferAction = async (
    inquiryId: number,
    action: 'accept' | 'reject' | 'counter',
    counterAmount?: number
  ) => {
    try {
      setOffersError(null);
      await respondToOffer({
        inquiry_id: inquiryId,
        action,
        ...(action === 'counter' && typeof counterAmount === 'number'
          ? { counter_amount: counterAmount }
          : {}),
      });

      setOffers(prev =>
        prev.map(offer =>
          offer.Inquiry_ID === inquiryId
            ? {
                ...offer,
                Inquiry_Status:
                  action === 'accept'
                    ? 'Accepted'
                    : action === 'reject'
                    ? 'Rejected'
                    : 'Countered',
                Counter_Offer:
                  action === 'counter' && typeof counterAmount === 'number'
                    ? counterAmount
                    : offer.Counter_Offer,
              }
            : offer
        )
      );
    } catch (err) {
      setOffersError(
        err instanceof Error ? err.message : 'Failed to update offer'
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">My Garage & Activity</h1>
          <p className="text-slate-500">Manage your vehicles, review offers, and track staff updates.</p>
        </div>
        
        {/* Availability Widget */}
        <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent z-0" />
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Showroom Status</p>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-bold text-white">
                 {loadingAvailability && !availability ? '—' : availableSlots}
               </span>
               <span className="text-sm text-slate-300">
                 {availabilityError
                   ? 'status unavailable'
                   : 'slots available'}
               </span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 w-32">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${availabilityPercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'} ${availabilityFillWidthClass}`}
              />
            </div>
          </div>
          <div className="relative z-10">
               <button
               type="button"
               aria-label="Add new vehicle listing"
               className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
             >
               <Plus className="w-5 h-5 text-blue-300" />
             </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('garage')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'garage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            My Vehicles
          </div>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'billing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Billing
          </div>
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'offers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Active Offers
            {myOffers.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{myOffers.length}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Staff Updates
            {myNotifications.some(n => !n.read) && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'garage' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carsError && (
                <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {carsError}
                </div>
              )}

              {loadingCars && !carsError && (
                <div className="col-span-full flex items-center justify-center py-8 text-slate-500 text-sm">
                  Loading your vehicles...
                </div>
              )}

              {!loadingCars && !carsError && myCars.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm">
                  You don&apos;t have any vehicles listed yet.
                </div>
              )}

              {myCars.map(car => (
                <div key={car.Vehicle_ID} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-slate-100 relative">
                    {vehicleImages[car.Vehicle_ID]
                      ? (
                        <img
                          src={resolveBackendUploadUrl(vehicleImages[car.Vehicle_ID] as string)}
                          alt={car.Make_Model_Year}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          Vehicle Photo
                        </div>
                      )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase bg-white/90 backdrop-blur-sm shadow-sm ${
                        car.Vehicle_Status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {car.Vehicle_Status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900">{car.Make_Model_Year}</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Listed at{' '}
                      <span className="font-bold text-slate-900">
                        ₱{Number(car.Asking_Price).toLocaleString()}
                      </span>
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
                       <span className="text-xs text-slate-400">
                         {car.Assigned_Slot_ID ? `Slot #${car.Assigned_Slot_ID}` : 'No slot assigned yet'}
                       </span>
                       <div className="flex items-center gap-2">
                         <button
                           type="button"
                           onClick={() => {
                             setOrcrVehicleId(car.Vehicle_ID);
                             setOrcrError(null);
                             setShowOrcrModal(true);
                           }}
                           className="text-xs font-medium text-slate-700 border border-slate-300 rounded-lg px-3 py-1 hover:bg-slate-50"
                         >
                           Upload OR/CR
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowNewVehicleModal(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all min-h-[300px]"
              >
                 <Plus className="w-8 h-8 mb-2" />
                 <span className="font-medium">List a Vehicle</span>
              </button>
           </div>
        )}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            {billingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {billingError}
              </div>
            )}
            {billingLoading && !billingError && (
              <div className="py-6 text-sm text-slate-500">Loading billing history...</div>
            )}
            {!billingLoading && !billingError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total Bills</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {billingSummary?.total_bills ?? 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Paid</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                      ₱{Number(billingSummary?.paid_amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Pending / Overdue</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">
                      ₱{Number((billingSummary?.pending_amount ?? 0) + (billingSummary?.overdue_amount ?? 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-2">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Billing ID</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Rent Amount</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Paid On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billing && billing.length > 0 ? (
                        billing.map((row: any) => (
                          <tr key={row.Billing_ID}>
                            <td className="px-4 py-2 text-xs font-mono text-slate-400">#{row.Billing_ID}</td>
                            <td className="px-4 py-2 text-xs">{row.Make_Model_Year ?? `#${row.Vehicle_ID}`}</td>
                            <td className="px-4 py-2 text-xs">₱{Number(row.Rent_Amount).toLocaleString()}</td>
                            <td className="px-4 py-2 text-xs">{row.Rent_Due_Date}</td>
                            <td className="px-4 py-2 text-xs">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                row.Payment_Status === 'Paid'
                                  ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                                  : row.Payment_Status === 'Overdue'
                                  ? 'text-red-700 border-red-200 bg-red-50'
                                  : 'text-amber-700 border-amber-200 bg-amber-50'
                              }`}>
                                {row.Payment_Status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs">{row.Payment_Date ?? '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                            No billing records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

          {activeTab === 'offers' && (
            <ActiveOffersView
              offers={myOffers}
              loading={loadingOffers}
              error={offersError}
              onOfferAction={handleOfferAction}
            />
          )}
        
        {activeTab === 'notifications' && <StaffNotificationsView notifications={myNotifications} />}
      </div>

      <NewVehicleModal
        open={showNewVehicleModal}
        onClose={() => {
          if (creatingVehicle) return;
          setShowNewVehicleModal(false);
          setCreateError(null);
        }}
        creating={creatingVehicle}
        error={createError}
        onCreate={async fields => {
          if (!user?.user_id) return;
          try {
            setCreatingVehicle(true);
            setCreateError(null);

            const askingPrice = Number(fields.askingPrice);
            const mileage = fields.mileage ? Number(fields.mileage) : 0;

            if (!fields.makeModelYear.trim()) {
              setCreateError('Please enter the Make / Model / Year');
              setCreatingVehicle(false);
              return;
            }
            if (!fields.plateNumber?.trim()) {
              setCreateError('Please enter the plate number of the vehicle');
              setCreatingVehicle(false);
              return;
            }
            if (!fields.engineNumber?.trim()) {
              setCreateError('Please enter the engine number of the vehicle');
              setCreatingVehicle(false);
              return;
            }
            if (!fields.chassisNumber?.trim()) {
              setCreateError('Please enter the chassis number of the vehicle');
              setCreatingVehicle(false);
              return;
            }
            if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
              setCreateError('Please enter a valid asking price');
              setCreatingVehicle(false);
              return;
            }

            if (!fields.photoFiles || fields.photoFiles.length === 0) {
              setCreateError('Please upload at least one clear photo of the vehicle');
              setCreatingVehicle(false);
              return;
            }

            const vehicleDraft = await uploadVehicle({
              user_id: user.user_id,
              make_model_year: fields.makeModelYear.trim(),
              asking_price: askingPrice,
              mileage: Number.isFinite(mileage) && mileage > 0 ? mileage : 0,
              plate_number: fields.plateNumber.trim(),
              engine_number: fields.engineNumber.trim(),
              chassis_number: fields.chassisNumber.trim(),
              fuel_type: fields.fuelType || 'Gasoline',
              color: fields.color || 'Unknown',
              description: fields.description || undefined,
            });

            // Upload any selected car photos and attach to this vehicle
            if (fields.photoFiles && fields.photoFiles.length > 0) {
              try {
                // Use returned vehicle_id if available; otherwise fall back
                // to latest vehicle lookup for backward compatibility.
                let vehicleId: number | null = null;
                if (vehicleDraft?.success && vehicleDraft.data?.vehicle_id) {
                  vehicleId = Number(vehicleDraft.data.vehicle_id);
                } else {
                  const latest = await getUserVehicles({ page: 1, limit: 1 });
                  const latestVehicle =
                    latest?.success && latest.data?.vehicles?.length
                      ? latest.data.vehicles[0]
                      : null;
                  if (latestVehicle?.Vehicle_ID) {
                    vehicleId = Number(latestVehicle.Vehicle_ID);
                  }
                }

                if (vehicleId) {
                  await uploadVehicleImages(vehicleId, fields.photoFiles);
                }
              } catch (photoErr) {
                console.error(photoErr);
                setCreateError(
                  'Vehicle saved, but one or more photo uploads failed. You can try again later.'
                );
              }
            }

            // Refresh vehicles after successful creation
            try {
              setLoadingCars(true);
              const data = await getUserVehicles({ page: 1, limit: 50 });
              if (data?.success && data.data?.vehicles) {
                setMyCars(data.data.vehicles);
                setCarsError(null);
              }
            } finally {
              setLoadingCars(false);
            }

            setShowNewVehicleModal(false);
          } catch (err) {
            setCreateError(
              err instanceof Error ? err.message : 'Failed to create vehicle'
            );
          } finally {
            setCreatingVehicle(false);
          }
        }}
      />

      <OrcrUploadModal
        open={showOrcrModal && !!orcrVehicleId}
        onClose={() => {
          if (orcrUploading) return;
          setShowOrcrModal(false);
          setOrcrVehicleId(null);
          setOrcrError(null);
        }}
        uploading={orcrUploading}
        error={orcrError}
        onUpload={async file => {
          if (!user?.user_id || !orcrVehicleId) return;
          try {
            setOrcrUploading(true);
            setOrcrError(null);
            await uploadVehicleDocument(orcrVehicleId, file);

            // Refresh vehicles to reflect updated status
            setLoadingCars(true);
            const data = await getUserVehicles({ page: 1, limit: 50 });
            if (data?.success && data.data?.vehicles) {
              setMyCars(data.data.vehicles);
              setCarsError(null);
            }

            setShowOrcrModal(false);
            setOrcrVehicleId(null);
          } catch (err) {
            setOrcrError(
              err instanceof Error ? err.message : 'Failed to upload OR/CR document'
            );
          } finally {
            setOrcrUploading(false);
            setLoadingCars(false);
          }
        }}
      />
    </div>
  );
}

  function ActiveOffersView({
    offers,
    loading,
    error,
    onOfferAction,
  }: {
    offers: any[];
    loading: boolean;
    error: string | null;
    onOfferAction: (
      inquiryId: number,
      action: 'accept' | 'reject' | 'counter',
      counterAmount?: number
    ) => Promise<void>;
  }) {
    const handleAccept = (id: number) => onOfferAction(id, 'accept');
    const handleReject = (id: number) => onOfferAction(id, 'reject');
    const handleCounter = (id: number) => {
      const input = window.prompt('Enter counter offer amount (₱):');
      if (!input) return;
      const value = Number(input.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(value) || value <= 0) return;
      return onOfferAction(id, 'counter', value);
    };

  return (
    <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-6 text-slate-500 text-sm">
            Loading offers...
          </div>
        )}

        {!loading && !error && offers.length > 0 ? (
          offers.map(offer => {
            return (
              <div key={offer.Inquiry_ID} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="w-full md:w-auto flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                       offer.Inquiry_Status === 'Pending_Seller'
                         ? 'bg-orange-100 text-orange-700'
                         : offer.Inquiry_Status === 'Accepted'
                         ? 'bg-emerald-100 text-emerald-700'
                         : 'bg-slate-100 text-slate-600'
                   }`}>
                       {offer.Inquiry_Status.replace('_', ' ')}
                   </span>
                     <span className="text-xs text-slate-400">{offer.Created_At}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    Offer Received: <span className="text-orange-600">₱{Number(offer.Offer_Amount).toLocaleString()}</span>
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                    For your{' '}
                    <span className="font-semibold">{offer.Make_Model_Year}</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                   <UserCircle className="w-3 h-3" />
                     <span>
                       {offer.First_Name} {offer.Last_Name}
                     </span>
                </div>
              </div>

                {offer.Inquiry_Status === 'Pending_Seller' && (
                <div className="flex gap-3 w-full md:w-auto">
                     <button
                       onClick={() => handleAccept(offer.Inquiry_ID)}
                       className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                     >
                     Accept
                   </button>
                     <button
                       onClick={() => handleCounter(offer.Inquiry_ID)}
                       className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                     >
                     Counter
                   </button>
                     <button
                       onClick={() => handleReject(offer.Inquiry_ID)}
                       className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                     >
                     Reject
                   </button>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No active offers at the moment.</p>
        </div>
      )}
    </div>
  );
}

function StaffNotificationsView({
  notifications,
}: {
  notifications: StaffNotification[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
       {notifications.length > 0 ? (
         notifications.map(notification => (
           <div key={notification.id} className={`p-4 flex gap-4 ${notification.read ? 'bg-white' : 'bg-blue-50/30'}`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
               notification.type === 'info' ? 'bg-blue-100 text-blue-600' :
               notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
               'bg-emerald-100 text-emerald-600'
             }`}>
               {notification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
             </div>
             <div className="flex-1">
               <p className="text-slate-900 text-sm font-medium">{notification.message}</p>
               <p className="text-slate-400 text-xs mt-1">{notification.date}</p>
             </div>
             {!notification.read && (
               <div className="flex items-center">
                 <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
               </div>
             )}
           </div>
         ))
       ) : (
         <div className="text-center py-20">
           <p className="text-slate-500">No new updates from staff.</p>
         </div>
       )}
    </div>
  );
}

type NewVehicleFields = {
  makeModelYear: string;
  askingPrice: string;
  mileage: string;
  fuelType: string;
  color: string;
  description: string;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  photoFiles?: File[];
};

function NewVehicleModal({
  open,
  onClose,
  creating,
  error,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  creating: boolean;
  error: string | null;
  onCreate: (fields: NewVehicleFields) => Promise<void>;
}) {
  const [fields, setFields] = useState<NewVehicleFields>({
    makeModelYear: '',
    askingPrice: '',
    mileage: '',
    fuelType: 'Gasoline',
    color: '',
    description: '',
    plateNumber: '',
    engineNumber: '',
    chassisNumber: '',
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  if (!open) return null;

  const handleChange = (
    key: keyof NewVehicleFields,
    value: string
  ) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    await onCreate({ ...fields, photoFiles });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">List a Vehicle</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={creating}
            aria-label="Close new vehicle form"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="new-vehicle-make-model" className="mb-1 block font-medium text-slate-700">
              Make / Model / Year
            </label>
            <input
              type="text"
              id="new-vehicle-make-model"
              value={fields.makeModelYear}
              onChange={e => handleChange('makeModelYear', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 2019 Toyota Vios 1.3 E"
            />
          </div>

          <div>
            <label htmlFor="new-vehicle-plate" className="mb-1 block font-medium text-slate-700">
              Plate Number
            </label>
            <input
              type="text"
              id="new-vehicle-plate"
              value={fields.plateNumber}
              onChange={e => handleChange('plateNumber', e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-wider uppercase"
              placeholder="e.g. ABC 1234"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-vehicle-engine" className="mb-1 block font-medium text-slate-700">
                Engine Number
              </label>
              <input
                type="text"
                id="new-vehicle-engine"
                value={fields.engineNumber}
                onChange={e => handleChange('engineNumber', e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-wider uppercase"
                placeholder="Engine serial (kept private)"
              />
            </div>
            <div>
              <label htmlFor="new-vehicle-chassis" className="mb-1 block font-medium text-slate-700">
                Chassis Number
              </label>
              <input
                type="text"
                id="new-vehicle-chassis"
                value={fields.chassisNumber}
                onChange={e => handleChange('chassisNumber', e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-wider uppercase"
                placeholder="Chassis / VIN (kept private)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-vehicle-asking-price" className="mb-1 block font-medium text-slate-700">
                Asking Price (₱)
              </label>
              <input
                type="number"
                min="0"
                id="new-vehicle-asking-price"
                value={fields.askingPrice}
                onChange={e => handleChange('askingPrice', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="new-vehicle-mileage" className="mb-1 block font-medium text-slate-700">
                Mileage (km)
              </label>
              <input
                type="number"
                min="0"
                id="new-vehicle-mileage"
                value={fields.mileage}
                onChange={e => handleChange('mileage', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-vehicle-fuel-type" className="mb-1 block font-medium text-slate-700">
                Fuel Type
              </label>
              <select
                id="new-vehicle-fuel-type"
                value={fields.fuelType}
                onChange={e => handleChange('fuelType', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-vehicle-color" className="mb-1 block font-medium text-slate-700">
                Color
              </label>
              <input
                type="text"
                id="new-vehicle-color"
                value={fields.color}
                onChange={e => handleChange('color', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Silver"
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-vehicle-description" className="mb-1 block font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              id="new-vehicle-description"
              value={fields.description}
              onChange={e => handleChange('description', e.target.value)}
              className="min-h-[80px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Key features, condition, and notes for staff."
            />
          </div>

          <div>
            <label htmlFor="new-vehicle-photo" className="mb-1 block font-medium text-slate-700">
              Vehicle Photos <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              id="new-vehicle-photo"
              multiple
              onChange={e => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setPhotoFiles(files);
              }}
              className="block w-full text-xs text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
            />
            {photoFiles.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="mb-2 grid grid-cols-3 gap-2">
                  {photoFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative h-20 overflow-hidden rounded-md border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
                  <span>{photoFiles.length} photo{photoFiles.length > 1 ? 's' : ''} selected</span>
                  <button
                    type="button"
                    onClick={() => setPhotoFiles([])}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-24 space-y-1 overflow-auto pr-1 text-[11px] text-slate-700">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <span className="truncate" title={file.name}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoFiles(prev => prev.filter((_, i) => i !== index))
                        }
                        className="shrink-0 text-[10px] text-slate-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              JPG/PNG up to 5MB each. At least one clear exterior photo is
              required. These photos are shown to buyers on your public
              vehicle listing. OR/CR documents are stored separately and are
              only visible to staff.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || photoFiles.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrcrUploadModal({
  open,
  onClose,
  uploading,
  error,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || !file) return;
    await onUpload(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Upload OR/CR Document</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={uploading}
            aria-label="Close OR/CR upload"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="orcr-file" className="mb-1 block font-medium text-slate-700">
              OR/CR File
            </label>
            <input
              id="orcr-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={e => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
              className="block w-full text-xs text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Upload a clear photo or PDF of the vehicle&apos;s OR/CR. This
              document is only visible to staff and is not shown to buyers.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload OR/CR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
