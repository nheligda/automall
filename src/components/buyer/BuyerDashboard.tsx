/**
 * AUTOMALL - Buyer Dashboard
 * Main component for buyers to view appointments and manage vehicle holds
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { OTWConfirmationModal } from './OTWConfirmationModal';
import { getBuyerAppointments } from '@/lib/api';
import { Calendar, MapPin, PhoneCall, Clock, AlertCircle } from 'lucide-react';

interface Appointment {
  appointment_id: number;
  schedule_datetime: string;
  appt_status: string;
  vehicle_id: number;
  make_model_year: string;
  asking_price: number;
  color: string;
  has_trade_in: boolean;
  hold_expiry?: string;
}

interface BuyerDashboardProps {
  userId: number;
  userName: string;
  userPhone: string;
}

export function BuyerDashboard({
  userId,
  userName,
  userPhone,
}: BuyerDashboardProps) {
  const [scheduledAppointments, setScheduledAppointments] = useState<
    Appointment[]
  >([]);
  const [completedAppointments, setCompletedAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOTWModal, setShowOTWModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-refresh appointments every 30 seconds to check for OTW prompts
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const data = await getBuyerAppointments(userId);

        if (data.success) {
          setScheduledAppointments(data.data.scheduled);
          setCompletedAppointments(data.data.completed);
          setError(null);
        } else {
          setError(data.error || 'Failed to load appointments');
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred while loading appointments'
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
    const interval = setInterval(loadAppointments, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId, refreshTrigger]);

  const handleOTWClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowOTWModal(true);
  };

  const handleOTWSuccess = (holdExpiry: string) => {
    // Refresh appointments after successful OTW confirmation
    setRefreshTrigger((prev) => prev + 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'OTW_Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'No_Show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const shouldShowOTWPrompt = (appointment: Appointment) => {
    if (appointment.appt_status !== 'Scheduled') return false;

    const appointmentTime = new Date(
      appointment.schedule_datetime
    ).getTime();
    const now = new Date().getTime();
    const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);

    return hoursUntil <= 2 && hoursUntil > 0;
  };

  if (loading && scheduledAppointments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {userName}! 👋
        </h1>
        <p className="mt-2 text-gray-700">
          Manage your vehicle viewing appointments and track your reservations.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming{' '}
            {scheduledAppointments.length > 0 &&
              `(${scheduledAppointments.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">
            History
            {completedAppointments.length > 0 &&
              `(${completedAppointments.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {scheduledAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">
                  No upcoming appointments
                </p>
                <p className="text-sm text-gray-600">
                  Browse available vehicles and schedule a viewing.
                </p>
              </CardContent>
            </Card>
          ) : (
            scheduledAppointments.map((appointment) => {
              const showOTWPrompt = shouldShowOTWPrompt(appointment);

              return (
                <Card
                  key={appointment.appointment_id}
                  className={`transition-all ${
                    showOTWPrompt ? 'border-orange-400 bg-orange-50' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {appointment.make_model_year}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {appointment.color} • ₱
                          {appointment.asking_price.toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(appointment.appt_status)}>
                        {getStatusLabel(appointment.appt_status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Appointment Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-1 h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            SCHEDULED DATE
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(appointment.schedule_datetime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="mt-1 h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600">
                            LOCATION
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            AUTOMALL Showroom
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trade-In Info */}
                    {appointment.has_trade_in && (
                      <div className="rounded-lg bg-blue-100 p-3">
                        <p className="text-sm font-medium text-blue-900">
                          📦 Trade-In Included
                        </p>
                        <p className="text-xs text-blue-800">
                          You're planning to trade in a vehicle
                        </p>
                      </div>
                    )}

                    {/* OTW Hold Status */}
                    {appointment.appt_status === 'OTW_Confirmed' && (
                      <div className="rounded-lg border-l-4 border-green-600 bg-green-50 p-3">
                        <p className="text-sm font-medium text-green-900">
                          ✓ Vehicle On Hold
                        </p>
                        <p className="text-xs text-green-800">
                          Hold expires at:{' '}
                          {new Date(appointment.hold_expiry!).toLocaleTimeString(
                            'en-PH'
                          )}
                        </p>
                      </div>
                    )}

                    {/* OTW Prompt Alert */}
                    {showOTWPrompt && appointment.appt_status === 'Scheduled' && (
                      <div className="rounded-lg border-l-4 border-orange-600 bg-orange-100 p-3">
                        <p className="text-sm font-bold text-orange-900">
                          ⏰ Time to Head Out!
                        </p>
                        <p className="text-xs text-orange-800">
                          Your appointment is in less than 2 hours. Confirm that
                          you're on the way to reserve the vehicle.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {showOTWPrompt && (
                        <Button
                          onClick={() => handleOTWClick(appointment)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Confirm I'm On The Way
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // Navigate to call or contact seller
                          window.location.href = `tel:${import.meta.env.VITE_SHOP_PHONE || '+639091234567'}`;
                        }}
                      >
                        <PhoneCall className="mr-2 h-4 w-4" />
                        Call Showroom
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {completedAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">
                  No appointment history
                </p>
              </CardContent>
            </Card>
          ) : (
            completedAppointments.map((appointment) => (
              <Card key={appointment.appointment_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {appointment.make_model_year}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        ₱{appointment.asking_price.toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.appt_status)}>
                      {getStatusLabel(appointment.appt_status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {formatDate(appointment.schedule_datetime)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* OTW Confirmation Modal */}
      {selectedAppointment && (
        <OTWConfirmationModal
          isOpen={showOTWModal}
          onClose={() => setShowOTWModal(false)}
          appointment={selectedAppointment}
          userId={userId}
          onSuccess={handleOTWSuccess}
        />
      )}
    </div>
  );
}
