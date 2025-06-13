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
  $stmt = $pdo->query("SELECT * FROM peminjaman ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  exit;
}

if ($method === 'POST') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $approve = isset($query['approve']);

  if ($approve && $id) {
    $stmt = $pdo->prepare("UPDATE peminjaman SET approval = 1 WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Peminjaman disetujui']);
    exit;
  }

  $data = json_decode(file_get_contents('php://input'), true);
  $stmt = $pdo->prepare("INSERT INTO peminjaman (npp, nama, bagian, tanggal, waktu, keterangan, ruangan) VALUES (?, ?, ?, ?, ?, ?, ?)");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['bagian'],
    $data['tanggal'], $data['waktu'], $data['keterangan'], $data['ruangan']
  ]);
  echo json_encode(['success' => true, 'message' => 'Peminjaman berhasil ditambahkan']);
  exit;
}

if ($method === 'PUT') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $data = json_decode(file_get_contents('php://input'), true);

  $stmt = $pdo->prepare("UPDATE peminjaman SET npp=?, nama=?, bagian=?, tanggal=?, waktu=?, keterangan=?, ruangan=? WHERE id=?");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['bagian'], $data['tanggal'],
    $data['waktu'], $data['keterangan'], $data['ruangan'], $id
  ]);
  echo json_encode(['success' => true, 'message' => 'Peminjaman berhasil diperbarui']);
  exit;
}

if ($method === 'DELETE') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM peminjaman WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['success' => true, 'message' => 'Peminjaman berhasil dihapus']);
  exit;
}

echo json_encode(['success' => false, 'message' => 'Metode tidak didukung']);
