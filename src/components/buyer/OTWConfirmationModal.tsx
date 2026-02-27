/**
 * AUTOMALL - OTW Hold Confirmation Modal
 * Shown 2 hours before appointment to let buyer confirm they're on the way
 */

import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Button } from '@/app/components/ui/button';
import { applyOTWHold } from '@/lib/api';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OTWConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    appointment_id: number;
    schedule_datetime: string;
    vehicle: {
      vehicle_id: number;
      make_model_year: string;
      asking_price: number;
    };
  };
  userId: number;
  onSuccess: (holdExpiry: string) => void;
}

export function OTWConfirmationModal({
  isOpen,
  onClose,
  appointment,
  userId,
  onSuccess,
}: OTWConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!isOpen || success) return;

    // Calculate time until appointment
    const appointmentTime = new Date(appointment.schedule_datetime).getTime();
    const now = new Date().getTime();
    const diff = appointmentTime - now;

    if (diff <= 0) {
      setTimeRemaining('Appointment time has passed');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    setTimeRemaining(`${hours}h ${minutes}m`);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = appointmentTime - now;

      if (diff <= 0) {
        setTimeRemaining('Appointment time has passed');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, appointment.schedule_datetime, success]);

  const handleConfirmOTW = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await applyOTWHold(
        userId,
        appointment.vehicle.vehicle_id,
        appointment.appointment_id
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(response.data.hold_expiry);
          handleClose();
        }, 2000);
      } else {
        setError(response.error || 'Failed to confirm OTW status');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while confirming OTW'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        {!success ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Confirm You're On The Way
              </AlertDialogTitle>
            </AlertDialogHeader>

            <AlertDialogDescription className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="font-semibold text-gray-900">
                  {appointment.vehicle.make_model_year}
                </p>
                <p className="text-sm text-gray-600">
                  Price: ₱{appointment.vehicle.asking_price.toLocaleString()}
                </p>
              </div>

              <div className="border-l-4 border-orange-400 bg-orange-50 p-3">
                <p className="text-sm font-medium text-orange-900">
                  ⏱️ Appointment in {timeRemaining}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  What happens next:
                </p>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Vehicle will be locked and reserved for 2 hours</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      Auto-released if you don't arrive within 2 hours
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Call {import.meta.env.VITE_SHOP_PHONE} if delayed</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm text-red-800">
                    <AlertCircle className="mb-1 inline h-4 w-4" /> {error}
                  </p>
                </div>
              )}
            </AlertDialogDescription>

            <div className="flex gap-3">
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmOTW}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Confirming...' : 'Yes, I\'m On The Way'}
              </AlertDialogAction>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <AlertDialogHeader>
              <AlertDialogTitle>
                Vehicle Reserved Successfully!
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              <p className="text-sm text-gray-700">
                Your vehicle is now on hold for 2 hours. Please drive to the
                showroom as soon as possible.
              </p>
            </AlertDialogDescription>
            <AlertDialogAction onClick={handleClose}>
              Got it!
            </AlertDialogAction>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
