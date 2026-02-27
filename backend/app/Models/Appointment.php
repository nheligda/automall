<?php

namespace App\Models;

/**
 * Appointment Model
 */
class Appointment extends BaseModel
{
    protected $table = 'D3_Viewing_Appointment';

    public function getAppointmentsByBuyer($buyerId)
    {
        $query = "SELECT a.*, v.Make, v.Model, v.Asking_Price, v.Image_URL
                  FROM {$this->table} a
                  LEFT JOIN D2_Vehicle_Inventory v ON a.Vehicle_ID = v.ID
                  WHERE a.Buyer_ID = :buyer_id
                  ORDER BY a.Appointment_Date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':buyer_id' => $buyerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getUpcomingAppointments($buyerId)
    {
        $query = "SELECT a.*, v.Make, v.Model, v.Asking_Price, v.Image_URL
                  FROM {$this->table} a
                  LEFT JOIN D2_Vehicle_Inventory v ON a.Vehicle_ID = v.ID
                  WHERE a.Buyer_ID = :buyer_id
                  AND a.Status IN ('Scheduled', 'OTW_Confirmed')
                  AND a.Appointment_Date >= NOW()
                  ORDER BY a.Appointment_Date ASC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':buyer_id' => $buyerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findByBuyerAndVehicle($buyerId, $vehicleId)
    {
        return $this->findBy([
            'Buyer_ID' => $buyerId,
            'Vehicle_ID' => $vehicleId
        ])[0] ?? null;
    }

    public function hasActiveAppointment($buyerId, $vehicleId)
    {
        $query = "SELECT COUNT(*) as count FROM {$this->table}
                  WHERE Buyer_ID = :buyer_id
                  AND Vehicle_ID = :vehicle_id
                  AND Status IN ('Scheduled', 'OTW_Confirmed')";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':buyer_id' => $buyerId,
            ':vehicle_id' => $vehicleId
        ]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return ($result['count'] ?? 0) > 0;
    }
}
