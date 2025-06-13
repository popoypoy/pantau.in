<?php
$host = 'localhost';
$db   = 'u878662213_Sibabe';
$user = 'u878662213_sibabe_db';
$pass = '4kuSiapa?';

try {
  $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Database connection failed']);
  exit;
}
?>
