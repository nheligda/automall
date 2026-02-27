<?php

namespace App\Models;

/**
 * Transaction Model
 */
class Transaction extends BaseModel
{
    protected $table = 'D7_Sales_Transaction';

    public function getTransactionsByBuyer($buyerId)
    {
        $query = "SELECT t.*, v.Make, v.Model, v.Asking_Price,
                         b.First_Name as buyer_name, s.First_Name as seller_name
                  FROM {$this->table} t
                  LEFT JOIN D2_Vehicle_Inventory v ON t.Vehicle_ID = v.ID
                  LEFT JOIN D1_Users b ON t.Buyer_ID = b.ID
                  LEFT JOIN D1_Users s ON v.Seller_ID = s.ID
                  WHERE t.Buyer_ID = :buyer_id
                  ORDER BY t.Sale_Date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':buyer_id' => $buyerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getTransactionsBySeller($sellerId)
    {
        $query = "SELECT t.*, v.Make, v.Model, v.Asking_Price,
                         b.First_Name as buyer_name
                  FROM {$this->table} t
                  LEFT JOIN D2_Vehicle_Inventory v ON t.Vehicle_ID = v.ID
                  LEFT JOIN D1_Users b ON t.Buyer_ID = b.ID
                  WHERE v.Seller_ID = :seller_id
                  ORDER BY t.Sale_Date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':seller_id' => $sellerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getTotalRevenue($sellerId)
    {
        $query = "SELECT SUM(t.Final_Price) as total FROM {$this->table} t
                  LEFT JOIN D2_Vehicle_Inventory v ON t.Vehicle_ID = v.ID
                  WHERE v.Seller_ID = :seller_id
                  AND t.Status = 'Completed'";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':seller_id' => $sellerId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return (float)($result['total'] ?? 0);
    }

    public function countTransactions($sellerId)
    {
        $query = "SELECT COUNT(*) as total FROM {$this->table} t
                  LEFT JOIN D2_Vehicle_Inventory v ON t.Vehicle_ID = v.ID
                  WHERE v.Seller_ID = :seller_id
                  AND t.Status = 'Completed'";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':seller_id' => $sellerId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result['total'] ?? 0;
    }
}
