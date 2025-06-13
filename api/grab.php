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
  $stmt = $pdo->query("SELECT * FROM grab ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  exit;
}

if ($method === 'POST') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $approve = isset($query['approve']);

  if ($approve && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $kode = $input['kode'] ?? '';

    if (!$kode) {
      echo json_encode(['success' => false, 'message' => 'Kode Grab wajib diisi']);
      exit;
    }

    $stmt = $pdo->prepare("UPDATE grab SET approval = 1, kode = ? WHERE id = ?");
    $stmt->execute([$kode, $id]);
    echo json_encode(['success' => true, 'message' => 'Pemesanan Grab disetujui']);
    exit;
  }

  $data = json_decode(file_get_contents('php://input'), true);
  $stmt = $pdo->prepare("INSERT INTO grab (npp, nama, tanggal, jam, tujuan, keterangan) VALUES (?, ?, ?, ?, ?, ?)");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['tanggal'], $data['jam'], $data['tujuan'], $data['keterangan']
  ]);
  echo json_encode(['success' => true, 'message' => 'Pemesanan Grab berhasil ditambahkan']);
  exit;
}

if ($method === 'PUT') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $data = json_decode(file_get_contents('php://input'), true);

  $stmt = $pdo->prepare("UPDATE grab SET npp=?, nama=?, tanggal=?, jam=?, tujuan=?, keterangan=? WHERE id=?");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['tanggal'], $data['jam'], $data['tujuan'], $data['keterangan'], $id
  ]);
  echo json_encode(['success' => true, 'message' => 'Data Grab berhasil diperbarui']);
  exit;
}

if ($method === 'DELETE') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM grab WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['success' => true, 'message' => 'Data Grab berhasil dihapus']);
  exit;
}

echo json_encode(['success' => false, 'message' => 'Metode tidak didukung']);
