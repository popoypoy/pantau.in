<?php
require 'db.php';
session_start();
header('Content-Type: application/json');

// Pastikan user login (opsional bisa ditambah cek role === 'admin')
if (!isset($_SESSION['username'])) {
  echo json_encode(['success' => false, 'message' => 'Unauthorized']);
  exit;
}

try {
  $pdo->beginTransaction();
  $pdo->exec("DELETE FROM inventaris");
  $pdo->exec("DELETE FROM mutasi");
  $pdo->exec("DELETE FROM peminjaman");
  $pdo->exec("DELETE FROM zoom");
  $pdo->exec("DELETE FROM grab");
  $pdo->commit();

  echo json_encode(['success' => true, 'message' => 'Semua data berhasil dihapus']);
} catch (Exception $e) {
  $pdo->rollBack();
  echo json_encode(['success' => false, 'message' => 'Reset gagal']);
}
