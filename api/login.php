<?php
session_start();
header('Content-Type: application/json');

// Dummy login
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (($username === 'admin' && $password === 'adminkita') || ($username === 'user' && $password === 'user123')) {
  $_SESSION['username'] = $username;
  $_SESSION['role'] = ($username === 'admin') ? 'admin' : 'user';
  $_SESSION['user_id'] = $username; // ✅ Tambahan penting

  echo json_encode(['success' => true]);
} else {
  echo json_encode(['success' => false, 'message' => 'Login gagal']);
}
