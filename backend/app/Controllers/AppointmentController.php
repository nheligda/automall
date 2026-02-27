<?php

namespace App\Controllers;

use App\Services\OTWService;
use App\Models\Appointment;

/**
 * AppointmentController - Handle appointment-related endpoints
 */
class AppointmentController extends BaseController
{
    private $otwService;
    private $appointmentModel;

    public function __construct($db)
    {
        parent::__construct($db);
        $this->otwService = new OTWService($db);
        $this->appointmentModel = new Appointment($db);
    }

    /**
     * Schedule appointment
     */
    public function schedule()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $this->validateRequired($data, ['vehicleId', 'appointmentDate']);

            $token = $this->getBearerToken();
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            // Create appointment
            $appointmentData = [
                'Buyer_ID' => $data['buyerId'],
                'Vehicle_ID' => $data['vehicleId'],
                'Appointment_Date' => $data['appointmentDate'],
                'Status' => 'Scheduled',
                'Appointment_Created_Date' => date('Y-m-d H:i:s')
            ];

            $appointmentId = $this->appointmentModel->create($appointmentData);

            if (!$appointmentId) {
                return $this->errorResponse('Failed to schedule appointment', 500);
            }

            return $this->successResponse([
                'appointment_id' => $appointmentId
            ], 'Appointment scheduled successfully', 201);
        } catch (\Exception $e) {
            error_log("Schedule Appointment Error: " . $e->getMessage());
            return $this->errorResponse('Failed to schedule appointment', 500);
        }
    }

    /**
     * Get buyer appointments
     */
    public function getBuyerAppointments()
    {
        try {
            $token = $this->getBearerToken();
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            $buyerId = isset($_GET['buyer_id']) ? (int)$_GET['buyer_id'] : null;
            
            if (!$buyerId) {
                return $this->errorResponse('Buyer ID required', 400);
            }

            $appointments = $this->appointmentModel->getAppointmentsByBuyer($buyerId);

            return $this->successResponse([
                'appointments' => $appointments,
                'total' => count($appointments)
            ], 'Appointments retrieved successfully', 200);
        } catch (\Exception $e) {
            error_log("Get Buyer Appointments Error: " . $e->getMessage());
            return $this->errorResponse('Failed to retrieve appointments', 500);
        }
    }

    /**
     * Get upcoming appointments
     */
    public function getUpcoming()
    {
        try {
            $token = $this->getBearerToken();
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            $buyerId = isset($_GET['buyer_id']) ? (int)$_GET['buyer_id'] : null;
            
            if (!$buyerId) {
                return $this->errorResponse('Buyer ID required', 400);
            }

            $appointments = $this->appointmentModel->getUpcomingAppointments($buyerId);

            return $this->successResponse([
                'appointments' => $appointments,
                'total' => count($appointments)
            ], 'Upcoming appointments retrieved successfully', 200);
        } catch (\Exception $e) {
            error_log("Get Upcoming Appointments Error: " . $e->getMessage());
            return $this->errorResponse('Failed to retrieve upcoming appointments', 500);
        }
    }

    /**
     * Apply OTW hold
     */
    public function applyOTWHold()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $this->validateRequired($data, ['appointmentId', 'vehicleId']);

            $token = $this->getBearerToken();
            if (!$token) {
                return $this->errorResponse('Unauthorized', 401);
            }

            $buyerId = $data['buyerId'] ?? null;
            if (!$buyerId) {
                return $this->errorResponse('Buyer ID required', 400);
            }

            // Check eligibility
            if (!$this->otwService->isEligibleForOTW($data['appointmentId'], $buyerId)) {
                return $this->errorResponse('Not eligible for OTW hold', 400);
            }

            $result = $this->otwService->applyOTWHold(
                $data['appointmentId'],
                $buyerId,
                $data['vehicleId']
            );

            if ($result['success']) {
                return $this->successResponse([
                    'hold_expiry' => $result['hold_expiry']
                ], $result['message'], 200);
            } else {
                return $this->errorResponse($result['message'], 400);
            }
        } catch (\Exception $e) {
            error_log("Apply OTW Hold Error: " . $e->getMessage());
            return $this->errorResponse('Failed to apply OTW hold', 500);
        }
    }

    /**
     * Release expired holds (CRON endpoint)
     */
    public function releaseExpiredHolds()
    {
        try {
            // Verify CRON secret (optional)
            $cronSecret = isset($_GET['secret']) ? $_GET['secret'] : '';
            $expected = getenv('CRON_SECRET') ?: 'default_cron_secret';

            if ($cronSecret !== $expected) {
                return $this->errorResponse('Unauthorized', 401);
            }

            $result = $this->otwService->releaseExpiredHolds();

            return $this->successResponse([
                'released_count' => $result['released_count']
            ], $result['message'], 200);
        } catch (\Exception $e) {
            error_log("Release Expired Holds Error: " . $e->getMessage());
            return $this->errorResponse('Failed to release expired holds', 500);
        }
    }
}
