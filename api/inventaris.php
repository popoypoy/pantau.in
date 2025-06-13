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
  $stmt = $pdo->query("SELECT * FROM inventaris ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  exit;
}

if ($method === 'POST') {
  $id = $_GET['id'] ?? null;

  $kode = $_POST['kode'] ?? '';
  $nama = $_POST['nama'] ?? '';
  $lokasi = $_POST['lokasi'] ?? '';
  $kondisi = $_POST['kondisi'] ?? '';
  $foto = '';

  // Handle file upload
  if (!empty($_FILES['foto']['name'])) {
    $uploadDir = '../foto/';
    $filename = uniqid() . '_' . basename($_FILES['foto']['name']);
    $target = $uploadDir . $filename;
    if (move_uploaded_file($_FILES['foto']['tmp_name'], $target)) {
      $foto = 'foto/' . $filename;
    }
  }

  if ($id) {
    $stmt = $pdo->prepare("UPDATE inventaris SET kode=?, nama=?, lokasi=?, kondisi=? " . ($foto ? ", foto=? " : "") . "WHERE id=?");
    $params = [$kode, $nama, $lokasi, $kondisi];
    if ($foto) $params[] = $foto;
    $params[] = $id;
    $stmt->execute($params);
    echo json_encode(['success' => true, 'message' => 'Inventaris berhasil diperbarui']);
  } else {
    $stmt = $pdo->prepare("INSERT INTO inventaris (kode, nama, lokasi, kondisi, foto) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$kode, $nama, $lokasi, $kondisi, $foto]);
    echo json_encode(['success' => true, 'message' => 'Inventaris berhasil ditambahkan']);
  }
  exit;
}

if ($method === 'DELETE') {
  parse_str($_SERVER['QUERY_STRING'], $query);
  $id = $query['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM inventaris WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['success' => true, 'message' => 'Inventaris berhasil dihapus']);
  exit;
}

echo json_encode(['success' => false, 'message' => 'Metode tidak didukung']);
