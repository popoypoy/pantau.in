<?php
session_start();
header('Content-Type: application/json');

echo json_encode([
  'raw_session' => $_SESSION,
  'isLoggedIn' => isset($_SESSION['user_id']),
  'role' => $_SESSION['role'] ?? null
]);
?>
