<?php

namespace App\Models;

use PDO;
use PDOException;

/**
 * Vehicle Model
 */
class Vehicle extends BaseModel
{
    protected $table = 'D2_Vehicle_Inventory';

    public function getAvailableVehicles($limit = 10, $offset = 0)
    {
        $query = "SELECT v.*, u.First_Name, u.Last_Name, u.Email, u.Phone_Number,
                         s.Slot_Number
                  FROM {$this->table} v
                  LEFT JOIN D1_Users u ON v.Seller_ID = u.ID
                  LEFT JOIN D5_Slot_Storage s ON v.ID = s.Current_Vehicle_ID
                  WHERE v.Status = 'Available'
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countAvailable()
    {
        return $this->count(['Status' => 'Available']);
    }

    public function getVehiclesBySeller($sellerId)
    {
        return $this->findBy(['Seller_ID' => $sellerId]);
    }

    public function getVehiclesByStatus($status)
    {
        return $this->findBy(['Status' => $status]);
    }

    public function searchVehicles($searchTerm, $limit = 10, $offset = 0)
    {
        try {
            $query = "SELECT v.*, u.First_Name, u.Last_Name, u.Email, u.Phone_Number
                      FROM {$this->table} v
                      LEFT JOIN D1_Users u ON v.Seller_ID = u.ID
                      WHERE (v.Make LIKE :search OR v.Model LIKE :search)
                      AND v.Status = 'Available'
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':search', '%' . $searchTerm . '%');
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return [];
        }
    }

    public function filterVehicles($filters, $limit = 10, $offset = 0)
    {
        try {
            $query = "SELECT v.*, u.First_Name, u.Last_Name, u.Email, u.Phone_Number
                      FROM {$this->table} v
                      LEFT JOIN D1_Users u ON v.Seller_ID = u.ID
                      WHERE v.Status = 'Available'";
            
            $params = [];
            
            if (isset($filters['min_price'])) {
                $query .= " AND v.Asking_Price >= :min_price";
                $params[':min_price'] = $filters['min_price'];
            }
            
            if (isset($filters['max_price'])) {
                $query .= " AND v.Asking_Price <= :max_price";
                $params[':max_price'] = $filters['max_price'];
            }
            
            if (isset($filters['fuel_type'])) {
                $query .= " AND v.Fuel_Type = :fuel_type";
                $params[':fuel_type'] = $filters['fuel_type'];
            }
            
            if (isset($filters['make'])) {
                $query .= " AND v.Make = :make";
                $params[':make'] = $filters['make'];
            }

            $query .= " LIMIT :limit OFFSET :offset";
            $params[':limit'] = (int)$limit;
            $params[':offset'] = (int)$offset;

            $stmt = $this->db->prepare($query);
            foreach ($params as $key => &$value) {
                if ($key === ':limit' || $key === ':offset') {
                    $stmt->bindValue($key, $value, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue($key, $value);
                }
            }
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return [];
        }
    }
}
