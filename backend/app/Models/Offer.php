<?php

namespace App\Models;

/**
 * Offer Model
 */
class Offer extends BaseModel
{
    protected $table = 'D4_Blind_Offers';

    public function getOffersByVehicle($vehicleId)
    {
        $query = "SELECT o.*, b.First_Name as buyer_name, b.Email as buyer_email,
                         v.Make, v.Model, v.Asking_Price
                  FROM {$this->table} o
                  LEFT JOIN D1_Users b ON o.Buyer_ID = b.ID
                  LEFT JOIN D2_Vehicle_Inventory v ON o.Vehicle_ID = v.ID
                  WHERE o.Vehicle_ID = :vehicle_id
                  ORDER BY o.Offer_Date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':vehicle_id' => $vehicleId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getOffersByBuyer($buyerId)
    {
        $query = "SELECT o.*, v.Make, v.Model, v.Asking_Price,
                         s.First_Name as seller_name, s.Email as seller_email
                  FROM {$this->table} o
                  LEFT JOIN D2_Vehicle_Inventory v ON o.Vehicle_ID = v.ID
                  LEFT JOIN D1_Users s ON v.Seller_ID = s.ID
                  WHERE o.Buyer_ID = :buyer_id
                  ORDER BY o.Offer_Date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':buyer_id' => $buyerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getOffersBySeller($sellerId)
    {
        $query = "SELECT o.*, v.Make, v.Model, v.Asking_Price,
                         b.First_Name as buyer_name, b.Email as buyer_email
                  FROM {$this->table} o
                  LEFT JOIN D2_Vehicle_Inventory v ON o.Vehicle_ID = v.ID
                  LEFT JOIN D1_Users b ON o.Buyer_ID = b.ID
                  WHERE v.Seller_ID = :seller_id
                  ORDER BY o.Offer_Date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':seller_id' => $sellerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function countPendingOffers($sellerId)
    {
        $query = "SELECT COUNT(*) as total FROM {$this->table} o
                  LEFT JOIN D2_Vehicle_Inventory v ON o.Vehicle_ID = v.ID
                  WHERE v.Seller_ID = :seller_id
                  AND o.Status = 'Pending'";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':seller_id' => $sellerId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result['total'] ?? 0;
    }
}
