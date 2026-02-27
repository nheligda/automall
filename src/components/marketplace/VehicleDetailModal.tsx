import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, DollarSign, CheckCircle, ShieldCheck, MapPin, Gauge, Fuel, Info, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { submitOffer, scheduleAppointment, getVehicleImages, resolveBackendUploadUrl } from '../../lib/api';

interface VehicleDetailModalProps {
  vehicle: {
    Vehicle_ID: number;
    Make_Model_Year: string;
    Asking_Price: number;
    Mileage: number;
    Fuel_Type: string;
    Color: string;
    Description: string;
    Plate_Number?: string;
    Seller_First_Name: string;
    Seller_Last_Name: string;
    Seller_Phone: string;
    Slot_ID: number | null;
  };
  onClose: () => void;
}

export function VehicleDetailModal({ vehicle, onClose }: VehicleDetailModalProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { openLogin } = useAuthModal();

  const [view, setView] = useState<'details' | 'offer' | 'viewing'>('details');
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [viewingDate, setViewingDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<{ filename: string; url: string }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_id) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const amount = Number(offerAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Please enter a valid offer amount');
        setIsSubmitting(false);
        return;
      }

      await submitOffer({
        buyer_id: user.user_id,
        vehicle_id: vehicle.Vehicle_ID,
        offer_amount: amount,
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit offer'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load public car photos for this vehicle (OR/CR is stored separately and never exposed here)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingImages(true);
        setImagesError(null);
        const data = await getVehicleImages(vehicle.Vehicle_ID);
        if (!cancelled && data?.success && data.data?.images) {
          setImages(data.data.images);
          setCurrentImageIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setImagesError(
            err instanceof Error ? err.message : 'Failed to load photos'
          );
        }
      } finally {
        if (!cancelled) setLoadingImages(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [vehicle.Vehicle_ID]);

  const handleSubmitViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (!viewingDate) {
        setError('Please select a date and time');
        setIsSubmitting(false);
        return;
      }

      await scheduleAppointment({
        user_id: user.user_id,
        vehicle_id: vehicle.Vehicle_ID,
        schedule_datetime: viewingDate,
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to schedule appointment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header Image / Gallery */}
        <div className="relative h-64 bg-slate-900 shrink-0 overflow-hidden">
          {images.length > 0 ? (
            <div className="w-full h-full bg-black/80 flex items-center justify-center relative">
              <img
                src={resolveBackendUploadUrl(images[currentImageIndex]?.url)}
                alt={`${vehicle.Make_Model_Year} photo ${currentImageIndex + 1}`}
                className="h-full w-full object-cover"
              />

              {images.length > 1 && (
                <div className="absolute top-3 left-4 bg-black/60 rounded-xl px-2 py-1 flex items-center gap-2">
                  <div className="flex gap-1">
                    {images.slice(0, 4).map((thumb, index) => (
                      <button
                        key={thumb.url + index}
                        type="button"
                        className={`h-8 w-8 overflow-hidden rounded border transition-colors ${
                          index === currentImageIndex
                            ? 'border-white'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`View photo ${index + 1}`}
                      >
                        <img
                          src={resolveBackendUploadUrl(thumb.url)}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] text-white whitespace-nowrap">
                      Photos {currentImageIndex + 1} / {images.length}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] text-blue-200 hover:text-white underline-offset-2 hover:underline"
                      onClick={() => {
                        if (images.length) {
                          setShowLightbox(true);
                        }
                      }}
                    >
                      View full photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-200 text-xs">
              {loadingImages
                ? 'Loading photos...'
                : imagesError
                ? 'Photos unavailable'
                : 'Vehicle Photo'}
            </div>
          )}
          <button 
            onClick={onClose}
            aria-label="Close vehicle details"
            title="Close"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
             <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Verified Listing
                </span>
                 <span className="text-slate-300 text-xs flex items-center gap-1">
                   <MapPin className="w-3 h-3" /> Slot #{vehicle.Slot_ID ?? 'N/A'}
                </span>
             </div>
               <div className="space-y-1">
                 <h2 className="text-3xl font-bold text-white">{vehicle.Make_Model_Year}</h2>
                 {vehicle.Plate_Number && (
                   <p className="text-xs text-slate-200 tracking-widest">
                     Plate: {vehicle.Plate_Number}
                   </p>
                 )}
               </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex-1">
          {submitted ? (
            <div className="text-center py-10">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
               <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                 {view === 'offer' 
                   ? "Your blind offer has been securely forwarded to the seller. You'll be notified if they accept or counter."
                   : "Our staff will confirm your viewing appointment shortly via the dashboard."}
               </p>
               <button 
                 onClick={onClose}
                 className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
               >
                 Return to Showroom
               </button>
            </div>
          ) : view === 'details' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-4">
                <div>
                   <p className="text-sm text-slate-500 mb-1">Listing Price</p>
                   <p className="text-3xl font-bold text-slate-900">₱{vehicle.Asking_Price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <Gauge className="w-4 h-4" /> {vehicle.Mileage.toLocaleString()} km
                   </div>
                   <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                      <Fuel className="w-4 h-4" /> {vehicle.Fuel_Type}
                   </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
                 <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                 <div>
                    <h4 className="font-bold text-blue-900 text-sm">Safe & Managed Transaction</h4>
                    <p className="text-blue-700 text-xs mt-1">
                      All viewings and offers are facilitated by our professional staff. No direct contact with sellers ensures privacy and security.
                    </p>
                 </div>
              </div>

              {isAuthenticated ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setView('offer')}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all transform active:scale-95"
                  >
                    <DollarSign className="w-5 h-5" />
                    Make an Offer
                  </button>
                  <button
                    onClick={() => setView('viewing')}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-700 hover:text-slate-900 py-3.5 rounded-xl font-bold transition-all"
                  >
                    <Calendar className="w-5 h-5" />
                    Request Viewing
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center text-center gap-3">
                  <p className="text-sm text-slate-600 max-w-sm">
                    Please log in to make a blind offer or request a showroom viewing for this vehicle.
                  </p>
                  <button
                    type="button"
                    onClick={openLogin}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          ) : view === 'offer' ? (
            <form onSubmit={handleSubmitOffer} className="space-y-6">
               <button 
                 type="button" 
                 onClick={() => setView('details')}
                 className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
               >
                 ← Back to Details
               </button>
               <div>
                 <h3 className="text-2xl font-bold text-slate-900">Make a Blind Offer</h3>
                 <p className="text-slate-500 text-sm mt-1">
                   Enter your best price. The seller will only see the amount, not your identity, until a deal is agreed upon.
                 </p>
               </div>

               {error && (
                 <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                   <AlertCircle className="h-4 w-4 mt-0.5" />
                   <span>{error}</span>
                 </div>
               )}

               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Offer Amount (₱)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="number" 
                      required
                      min={1000}
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      placeholder="e.g. 750000"
                      className="w-full pl-12 pr-4 py-4 text-lg font-bold rounded-xl border-slate-300 focus:border-orange-500 focus:ring-orange-500 shadow-sm"
                    />
                  </div>
                  <div className="mt-4 flex gap-2 text-xs text-slate-500">
                      <Info className="w-4 h-4" />
                    <span>Listing Price: <span className="font-semibold text-slate-900">₱{vehicle.Asking_Price.toLocaleString()}</span></span>
                  </div>
               </div>

               <button 
                 type="submit"
                 disabled={isSubmitting || !offerAmount}
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
               >
                 {isSubmitting ? 'Submitting...' : 'Submit Official Offer'}
               </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitViewing} className="space-y-6">
               <button 
                 type="button" 
                 onClick={() => setView('details')}
                 className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2"
               >
                 ← Back to Details
               </button>
               <div>
                 <h3 className="text-2xl font-bold text-slate-900">Schedule Shop Viewing</h3>
                 <p className="text-slate-500 text-sm mt-1">
                   Visit our showroom at Slot #{vehicle.Slot_ID ?? 'N/A'} to inspect the vehicle personally. Our staff will assist you.
                 </p>
               </div>

               {error && (
                 <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                   <AlertCircle className="h-4 w-4 mt-0.5" />
                   <span>{error}</span>
                 </div>
               )}

               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label htmlFor="viewing-datetime" className="block text-sm font-medium text-slate-700 mb-2">Preferred Date & Time</label>
                  <div className="relative">
                    <input 
                      id="viewing-datetime"
                      type="datetime-local" 
                      required
                      placeholder="Select preferred viewing schedule"
                      title="Preferred viewing date and time"
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    * Viewing hours are 9:00 AM - 6:00 PM daily.
                  </p>
               </div>

               <button 
                 type="submit"
                 disabled={isSubmitting || !viewingDate}
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? 'Scheduling...' : 'Confirm Appointment'}
               </button>
            </form>
          )}
        </div>
      </motion.div>

      {/* Full-screen photo lightbox */}
      {showLightbox && images.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img
              src={resolveBackendUploadUrl(images[currentImageIndex]?.url)}
              alt={`${vehicle.Make_Model_Year} full photo ${currentImageIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              aria-label="Close full photo view"
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full"
                  onClick={() =>
                    setCurrentImageIndex(prev =>
                      prev === 0 ? images.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full"
                  onClick={() =>
                    setCurrentImageIndex(prev =>
                      prev === images.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-200 bg-black/70 px-3 py-1 rounded-full">
              Photo {currentImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
