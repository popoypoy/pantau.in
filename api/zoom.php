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
  $stmt = $pdo->query("SELECT * FROM zoom ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  exit;
}

if ($method === 'POST') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $approve = isset($query['approve']);

  if ($approve && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $akun = $input['akun'] ?? '';
    if (!$akun) {
      echo json_encode(['success' => false, 'message' => 'Akun Zoom wajib diisi']);
      exit;
    }

    $stmt = $pdo->prepare("UPDATE zoom SET approval = 1, akun = ? WHERE id = ?");
    $stmt->execute([$akun, $id]);
    echo json_encode(['success' => true, 'message' => 'Zoom disetujui']);
    exit;
  }

  $data = json_decode(file_get_contents('php://input'), true);
  $stmt = $pdo->prepare("INSERT INTO zoom (npp, nama, bagian, tanggal, waktu, kegiatan) VALUES (?, ?, ?, ?, ?, ?)");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['bagian'], $data['tanggal'], $data['waktu'], $data['kegiatan']
  ]);
  echo json_encode(['success' => true, 'message' => 'Peminjaman Zoom berhasil ditambahkan']);
  exit;
}

if ($method === 'PUT') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? null;
  $data = json_decode(file_get_contents('php://input'), true);

  $stmt = $pdo->prepare("UPDATE zoom SET npp=?, nama=?, bagian=?, tanggal=?, waktu=?, kegiatan=? WHERE id=?");
  $stmt->execute([
    $data['npp'], $data['nama'], $data['bagian'], $data['tanggal'],
    $data['waktu'], $data['kegiatan'], $id
  ]);
  echo json_encode(['success' => true, 'message' => 'Data Zoom berhasil diperbarui']);
  exit;
}

if ($method === 'DELETE') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM zoom WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['success' => true, 'message' => 'Data Zoom berhasil dihapus']);
  exit;
}

echo json_encode(['success' => false, 'message' => 'Metode tidak didukung']);
