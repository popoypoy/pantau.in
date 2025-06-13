<?php
require 'db.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Unauthorized']);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $stmt = $pdo->query("SELECT * FROM mutasi ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  exit;
}

if ($method === 'POST') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $approve = isset($query['approve']);

  if ($approve && $id) {
    $stmt = $pdo->prepare("UPDATE mutasi SET approval = 1 WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Mutasi disetujui']);
    exit;
  }

  // tambah baru
  $data = json_decode(file_get_contents('php://input'), true);
  $stmt = $pdo->prepare("INSERT INTO mutasi (npp, nama, bagian, tanggal, jam_pinjam, jam_selesai, kendaraan, driver, tujuan, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['bagian'], $data['tanggal'], $data['jam_pinjam'],
    $data['jam_selesai'], $data['kendaraan'], $data['driver'], $data['tujuan'], $data['keterangan']
  ]);
  echo json_encode(['success' => true, 'message' => 'Mutasi berhasil ditambahkan']);
  exit;
}

if ($method === 'PUT') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $data = json_decode(file_get_contents('php://input'), true);

  $stmt = $pdo->prepare("UPDATE mutasi SET npp=?, nama=?, bagian=?, tanggal=?, jam_pinjam=?, jam_selesai=?, kendaraan=?, driver=?, tujuan=?, keterangan=? WHERE id=?");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['bagian'], $data['tanggal'], $data['jam_pinjam'],
    $data['jam_selesai'], $data['kendaraan'], $data['driver'], $data['tujuan'], $data['keterangan'], $id
  ]);
  echo json_encode(['success' => true, 'message' => 'Mutasi berhasil diperbarui']);
  exit;
}

if ($method === 'DELETE') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM mutasi WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['success' => true, 'message' => 'Mutasi berhasil dihapus']);
  exit;
}

echo json_encode(['success' => false, 'message' => 'Metode tidak didukung']);
