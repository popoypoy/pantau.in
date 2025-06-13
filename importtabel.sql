-- Database: db_aset

CREATE TABLE IF NOT EXISTS inventaris (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(50) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  lokasi VARCHAR(100),
  kondisi VARCHAR(50),
  foto VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mutasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  npp VARCHAR(20),
  nama VARCHAR(100),
  bagian VARCHAR(50),
  tanggal DATE,
  jam_pinjam TIME,
  jam_selesai TIME,
  kendaraan VARCHAR(100),
  driver VARCHAR(100),
  tujuan TEXT,
  keterangan TEXT,
  approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  npp VARCHAR(20),
  nama VARCHAR(100),
  bagian VARCHAR(50),
  tanggal DATE,
  waktu TIME,
  keterangan TEXT,
  ruangan VARCHAR(100),
  approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zoom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  npp VARCHAR(20),
  nama VARCHAR(100),
  bagian VARCHAR(50),
  tanggal DATE,
  waktu TIME,
  kegiatan TEXT,
  akun VARCHAR(100), -- kolom ini bisa digunakan admin untuk menandai akun Zoom
  approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grab (
  id INT AUTO_INCREMENT PRIMARY KEY,
  npp VARCHAR(20),
  nama VARCHAR(100),
  tanggal DATE,
  jam TIME,
  tujuan TEXT,
  keterangan TEXT,
  kode VARCHAR(50), -- akan digenerate saat disetujui
  approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
