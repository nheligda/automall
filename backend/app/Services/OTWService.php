<?php

namespace App\Services;

use PDOException;
use DateTime;

/**
 * OTWService - Handle OTW (On-The-Way) 2-hour hold logic
 */
class OTWService
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Apply OTW hold (2-hour soft hold)
     */
    public function applyOTWHold($appointmentId, $buyerId, $vehicleId)
    {
        try {
            $this->db->beginTransaction();

            // Check if appointment exists and belongs to buyer
            $query = "SELECT * FROM D3_Viewing_Appointment 
                      WHERE ID = :appointment_id AND Buyer_ID = :buyer_id LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':appointment_id' => $appointmentId,
                ':buyer_id' => $buyerId
            ]);
            
            $appointment = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$appointment) {
                $this->db->rollBack();
                return ['success' => false, 'message' => 'Appointment not found'];
            }

            // Check if vehicle is available
            $query = "SELECT * FROM D2_Vehicle_Inventory 
                      WHERE ID = :vehicle_id AND Status = 'Available' LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':vehicle_id' => $vehicleId]);
            $vehicle = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$vehicle) {
                $this->db->rollBack();
                return ['success' => false, 'message' => 'Vehicle is not available'];
            }

            // Calculate 2-hour expiry time
            $expiryTime = (new DateTime())->modify('+2 hours')->format('Y-m-d H:i:s');

            // Update vehicle status to On_Hold
            $query = "UPDATE D2_Vehicle_Inventory SET Status = 'On_Hold', Hold_Expiry_Time = :expiry 
                      WHERE ID = :vehicle_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':expiry' => $expiryTime,
                ':vehicle_id' => $vehicleId
            ]);

            // Update appointment status to OTW_Confirmed
            $query = "UPDATE D3_Viewing_Appointment SET Status = 'OTW_Confirmed' 
                      WHERE ID = :appointment_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':appointment_id' => $appointmentId]);

            $this->db->commit();

            return [
                'success' => true,
                'message' => 'OTW hold applied successfully',
                'hold_expiry' => $expiryTime
            ];
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("OTW Hold Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to apply OTW hold'];
        }
    }

    /**
     * Release expired holds (CRON job)
     */
    public function releaseExpiredHolds()
    {
        try {
            $this->db->beginTransaction();

            // Find expired holds
            $query = "SELECT ID, Vehicle_ID FROM D3_Viewing_Appointment 
                      WHERE Status = 'OTW_Confirmed' 
                      AND Hold_Expiry_Time <= NOW()";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $expiredAppointments = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $released = 0;

            foreach ($expiredAppointments as $appointment) {
                // Update vehicle status back to Available
                $query = "UPDATE D2_Vehicle_Inventory SET Status = 'Available', Hold_Expiry_Time = NULL 
                          WHERE ID = :vehicle_id";
                
                $stmt = $this->db->prepare($query);
                $stmt->execute([':vehicle_id' => $appointment['Vehicle_ID']]);

                // Update appointment status to No_Show
                $query = "UPDATE D3_Viewing_Appointment SET Status = 'No_Show' 
                          WHERE ID = :appointment_id";
                
                $stmt = $this->db->prepare($query);
                $stmt->execute([':appointment_id' => $appointment['ID']]);

                $released++;
            }

            $this->db->commit();

            return [
                'success' => true,
                'released_count' => $released,
                'message' => "$released hold(s) released"
            ];
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Release Expired Holds Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to release expired holds'];
        }
    }

    /**
     * Check if appointment is eligible for OTW
     */
    public function isEligibleForOTW($appointmentId, $buyerId)
    {
        try {
            $query = "SELECT a.*, v.Status FROM D3_Viewing_Appointment a
                      LEFT JOIN D2_Vehicle_Inventory v ON a.Vehicle_ID = v.ID
                      WHERE a.ID = :appointment_id 
                      AND a.Buyer_ID = :buyer_id 
                      AND a.Status = 'Scheduled'
                      AND v.Status = 'Available'
                      LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':appointment_id' => $appointmentId,
                ':buyer_id' => $buyerId
            ]);
            
            $appointment = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$appointment) {
                return false;
            }

            // Check if appointment is within 2 hours
            $appointmentTime = new DateTime($appointment['Appointment_Date']);
            $now = new DateTime();
            $interval = $appointmentTime->diff($now);

            // Allow OTW if appointment is within next 2 hours
            return $interval->h <= 2 && $interval->invert === 1;
        } catch (PDOException $e) {
            error_log("Eligibility Check Error: " . $e->getMessage());
            return false;
        }
    }
}
