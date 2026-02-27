<?php

namespace App\Models;

use PDO;
use PDOException;

/**
 * BaseModel - Abstract base class for all models
 * Provides common database operations (CRUD)
 */
abstract class BaseModel
{
    protected $db;
    protected $table;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Find by ID
     */
    public function findById($id)
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE ID = :id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find all records (with pagination)
     */
    public function findAll($limit = 10, $offset = 0)
    {
        try {
            $query = "SELECT * FROM {$this->table} LIMIT :limit OFFSET :offset";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Find by custom condition
     */
    public function findBy($conditions)
    {
        try {
            $where = [];
            $params = [];
            
            foreach ($conditions as $field => $value) {
                $where[] = "$field = :$field";
                $params[":$field"] = $value;
            }

            $query = "SELECT * FROM {$this->table} WHERE " . implode(" AND ", $where);
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create new record
     */
    public function create($data)
    {
        try {
            $this->db->beginTransaction();

            $fields = implode(", ", array_keys($data));
            $placeholders = ":" . implode(", :", array_keys($data));
            
            $query = "INSERT INTO {$this->table} ($fields) VALUES ($placeholders)";
            $stmt = $this->db->prepare($query);

            foreach ($data as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }

            $stmt->execute();
            $this->db->commit();

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Database Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update record
     */
    public function update($id, $data)
    {
        try {
            $this->db->beginTransaction();

            $fields = [];
            $params = [':id' => $id];

            foreach ($data as $key => $value) {
                $fields[] = "$key = :$key";
                $params[":$key"] = $value;
            }

            $query = "UPDATE {$this->table} SET " . implode(", ", $fields) . " WHERE ID = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Database Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete record
     */
    public function delete($id)
    {
        try {
            $this->db->beginTransaction();

            $query = "DELETE FROM {$this->table} WHERE ID = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $id]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Database Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Count records
     */
    public function count($conditions = [])
    {
        try {
            $query = "SELECT COUNT(*) as total FROM {$this->table}";
            
            if (!empty($conditions)) {
                $where = [];
                $params = [];
                
                foreach ($conditions as $field => $value) {
                    $where[] = "$field = :$field";
                    $params[":$field"] = $value;
                }

                $query .= " WHERE " . implode(" AND ", $where);
            }

            $stmt = $this->db->prepare($query);
            if (!empty($conditions)) {
                $stmt->execute($params);
            } else {
                $stmt->execute();
            }

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['total'] ?? 0;
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Execute raw query
     */
    protected function query($sql, $params = [])
    {
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database Error: " . $e->getMessage());
            return null;
        }
    }
}
