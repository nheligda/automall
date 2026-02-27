<?php

namespace App\Models;

/**
 * User Model
 */
class User extends BaseModel
{
    protected $table = 'D1_Users';

    public function findByEmail($email)
    {
        return $this->findBy(['Email' => $email])[0] ?? null;
    }

    public function findByPhone($phone)
    {
        return $this->findBy(['Phone_Number' => $phone])[0] ?? null;
    }

    public function getUsersByRole($role, $limit = 10, $offset = 0)
    {
        $query = "SELECT * FROM {$this->table} WHERE Role = :role LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':role', $role);
        $stmt->bindValue(':limit', (int)$limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function countByRole($role)
    {
        return $this->count(['Role' => $role]);
    }
}
