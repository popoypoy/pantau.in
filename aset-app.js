const API_BASE = 'api';
let isAdmin = false;

// ======================== SESSION ==========================
async function checkSession() {
  try {
    const res = await fetch('api/session.php', { credentials: 'include' });
    const session = await res.json();
    console.log('🧾 Session response:', session);

    if (!session.isLoggedIn) {
      window.location.href = 'login.html';
      return false;
    }

    isAdmin = session.role === 'admin';
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
      const jam = new Date().getHours();
      let waktu = 'selamat malam';
      if (jam >= 4 && jam < 12) waktu = 'selamat pagi';
      else if (jam >= 12 && jam < 15) waktu = 'selamat siang';
      else if (jam >= 15 && jam < 18) waktu = 'selamat sore';
      greetingEl.textContent = `Halo, ${waktu}, Anda login sebagai ${isAdmin ? 'admin' : 'user'}.`;
    }

    if (isAdmin) {
      document.getElementById('admin-dashboard')?.classList.remove('hidden');
      document.getElementById('btn-tambah-inventaris')?.classList.remove('hidden');
      document.getElementById('reset-data-link')?.classList.remove('hidden');
    }

    return true;
  } catch (err) {
    console.error('❗ Gagal ambil session', err);
    window.location.href = 'login.html';
    return false;
  }
}

async function updateStatistik() {
  const inv = await fetchData('inventaris');
  const mutasi = await fetchData('mutasi');
  const pinjam = await fetchData('peminjaman');
  const zoom = await fetchData('zoom');
  const grab = await fetchData('grab');

  document.getElementById('statInventaris').textContent = inv.length;
  document.getElementById('count-mutasi-pending').textContent = mutasi.filter((item) => !item.approval).length;
  document.getElementById('count-peminjaman-pending').textContent = pinjam.filter((item) => !item.approval).length;
  document.getElementById('count-zoom-pending').textContent = zoom.filter((item) => !item.approval).length;
  document.getElementById('count-grab-pending').textContent = grab.filter((item) => !item.approval).length;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  const isOpen = !sidebar.classList.contains('-translate-x-full');

  if (isOpen) {
    // Tutup sidebar
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  } else {
    // Buka sidebar
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  }
}

function logout() {
  fetch(`${API_BASE}/logout.php`, {
    method: 'POST',
    credentials: 'include',
  }).then(() => {
    window.location.href = 'login.html';
  });
}

// ============= NAVIGASI =============
function setupNavigation() {
  console.log('setupNavigation aktif');
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      console.log(`Navigasi ke: ${target}`);
      if (target) showSection(target);
      document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('bg-gray-200'));
      link.classList.add('bg-gray-200');
      if (window.innerWidth < 768) toggleSidebar();
    });
  });
}

function showSection(id) {
  // Sembunyikan semua section
  document.querySelectorAll('.page-section').forEach((sec) => {
    sec.classList.add('hidden');
  });

  // Tampilkan section yang sesuai ID
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove('hidden');
  } else {
    console.warn(`Section dengan ID ${id} tidak ditemukan.`);
  }

  // Tampilkan dashboard admin jika di home
  const dashboard = document.getElementById('admin-dashboard');
  if (id === 'home' && isAdmin && dashboard) {
    dashboard.classList.remove('hidden');
  } else if (dashboard) {
    dashboard.classList.add('hidden');
  }
}

// ============== FETCH UTILS ==============
async function fetchData(endpoint) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}.php`, {
      credentials: 'include',
    });
    return await res.json();
  } catch (e) {
    showToast(`Gagal ambil data ${endpoint}`, 'error');
    return [];
  }
}

async function postData(endpoint, data) {
  return fetch(`${API_BASE}/${endpoint}.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
}

async function putData(endpoint, id, data) {
  return fetch(`${API_BASE}/${endpoint}.php?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
}

async function deleteData(endpoint, id) {
  return fetch(`${API_BASE}/${endpoint}.php?id=${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

// ======================== HAPUS ALL ========================
function resetAllData() {
  if (!confirm('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan.')) return;

  fetch('api/reset.php', {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        showToast('Semua data berhasil dihapus.', 'green');
        renderAllTables(); // Render ulang semua tabel kosong
        updateStatistik(); // Reset statistik ke 0
      } else {
        showToast('Gagal menghapus data.', 'red');
      }
    })
    .catch((err) => {
      console.error('Reset error:', err);
      showToast('Terjadi kesalahan saat reset data.', 'red');
    });
}

// ======================== EXPORT TO EXCEL ==========================
function exportTableToExcel(tableId, filename = '') {
  const table = document.getElementById(tableId);
  const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ======================== TOAST ==========================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-5 right-5 z-50 px-4 py-3 rounded shadow-lg text-white text-sm animate-fade-in-out ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ======================== INVENTARIS ==========================
async function renderInventarisTable() {
  const data = await fetchData('inventaris');
  const tbody = document.querySelector('#inventarisTable tbody');
  tbody.innerHTML = '';

  const namaFilter = document.getElementById('filterKodeNama').value.toLowerCase();
  const lokasiFilter = document.getElementById('filterLokasi').value;
  const kondisiFilter = document.getElementById('filterKondisi').value;

  const filtered = data.filter(
    (item) => (!namaFilter || item.kode.toLowerCase().includes(namaFilter) || item.nama.toLowerCase().includes(namaFilter)) && (!lokasiFilter || item.lokasi === lokasiFilter) && (!kondisiFilter || item.kondisi === kondisiFilter)
  );

  for (const item of filtered) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border px-2 py-1">${item.kode}</td>
      <td class="border px-2 py-1">${item.nama}</td>
      <td class="border px-2 py-1">${item.lokasi}</td>
      <td class="border px-2 py-1">${item.kondisi}</td>
      <td class="border px-2 py-1"><img src="${item.foto || 'default.png'}" alt="foto" class="w-12 h-12 object-cover"></td>
      <td class="border px-2 py-1">
        ${
          isAdmin
            ? `
          <button onclick="editInventaris('${item.id}')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded mr-1">Edit</button>
          <button onclick="hapusInventaris('${item.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
        `
            : '-'
        }
      </td>
    `;
    tbody.appendChild(row);
  }
}

function showFormInventaris() {
  document.getElementById('form-inventaris').classList.remove('hidden');
  document.getElementById('inv-kode').value = '';
  document.getElementById('inv-nama').value = '';
  document.getElementById('inv-lokasi').value = '';
  document.getElementById('inv-kondisi').value = '';
  document.getElementById('inv-foto').value = '';
  document.getElementById('form-inventaris').dataset.editing = '';
}

function batalFormInventaris() {
  document.getElementById('form-inventaris').classList.add('hidden');
  document.getElementById('form-inventaris').reset();
}

async function submitFormInventaris(e) {
  e.preventDefault();
  const kode = document.getElementById('inv-kode').value.trim();
  const nama = document.getElementById('inv-nama').value.trim();
  const lokasi = document.getElementById('inv-lokasi').value;
  const kondisi = document.getElementById('inv-kondisi').value;
  const fotoInput = document.getElementById('inv-foto');
  const editingId = document.getElementById('form-inventaris').dataset.editing;

  const formData = new FormData();
  formData.append('kode', kode);
  formData.append('nama', nama);
  formData.append('lokasi', lokasi);
  formData.append('kondisi', kondisi);
  if (fotoInput.files[0]) formData.append('foto', fotoInput.files[0]);

  const url = editingId ? `${API_BASE}/inventaris.php?id=${editingId}` : `${API_BASE}/inventaris.php`;
  const method = editingId ? 'POST' : 'POST';

  const response = await fetch(url, {
    method,
    body: formData,
    credentials: 'include',
  });

  const result = await response.json();
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    batalFormInventaris();
    renderInventarisTable();
  }
}

async function editInventaris(id) {
  const data = await fetchData('inventaris');
  const item = data.find((d) => d.id === id);
  if (!item) return;

  document.getElementById('form-inventaris').classList.remove('hidden');
  document.getElementById('inv-kode').value = item.kode;
  document.getElementById('inv-nama').value = item.nama;
  document.getElementById('inv-lokasi').value = item.lokasi;
  document.getElementById('inv-kondisi').value = item.kondisi;
  document.getElementById('form-inventaris').dataset.editing = item.id;
}

async function hapusInventaris(id) {
  if (!confirm('Yakin ingin menghapus item ini?')) return;
  const res = await deleteData('inventaris', id);
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderInventarisTable();
}

// Filter live
document.getElementById('filterKodeNama').addEventListener('input', renderInventarisTable);
document.getElementById('filterLokasi').addEventListener('change', renderInventarisTable);
document.getElementById('filterKondisi').addEventListener('change', renderInventarisTable);

// ======================== MUTASI ==========================
async function renderMutasiTable() {
  const data = await fetchData('mutasi');
  const tbody = document.querySelector('#mutasiTable tbody');
  tbody.innerHTML = '';

  const namaFilter = document.getElementById('filterMutasiNama').value.toLowerCase();
  const bagianFilter = document.getElementById('filterMutasiBagian').value;

  const filtered = data.filter((item) => (!namaFilter || item.nama.toLowerCase().includes(namaFilter)) && (!bagianFilter || item.bagian === bagianFilter));

  for (const item of filtered) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border px-2">${item.npp}</td>
      <td class="border px-2">${item.nama}</td>
      <td class="border px-2">${item.bagian}</td>
      <td class="border px-2">${item.tanggal}</td>
      <td class="border px-2">${item.jam_pinjam}</td>
      <td class="border px-2">${item.jam_selesai}</td>
      <td class="border px-2">${item.kendaraan}</td>
      <td class="border px-2">${item.driver}</td>
      <td class="border px-2">${item.tujuan}</td>
      <td class="border px-2">${item.keterangan}</td>
      <td class="border px-2">${item.approval ? '✅Disetujui' : isAdmin ? `<button onclick="approveMutasi('${item.id}')" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded">Setujui</button>` : '⏳Menunggu'}</td>
      <td class="border px-2">
        ${
          isAdmin
            ? `
          <button onclick="editMutasi('${item.id}')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded mr-1">Edit</button>
          <button onclick="hapusMutasi('${item.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
        `
            : '-'
        }
      </td>
    `;
    tbody.appendChild(row);
  }
}

function showFormMutasi() {
  document.getElementById('form-mutasi').classList.remove('hidden');
  document.getElementById('form-mutasi').dataset.editing = '';
  document.querySelectorAll('#form-mutasi input, #form-mutasi select, #form-mutasi textarea').forEach((el) => (el.value = ''));
}

function batalFormMutasi() {
  document.getElementById('form-mutasi').classList.add('hidden');
  document.getElementById('form-mutasi').dataset.editing = '';
}

async function submitFormMutasi(e) {
  e.preventDefault();
  const id = document.getElementById('form-mutasi').dataset.editing;
  const data = {
    npp: document.getElementById('mutasi-npp').value.trim(),
    nama: document.getElementById('mutasi-nama').value.trim(),
    bagian: document.getElementById('mutasi-bagian').value,
    tanggal: document.getElementById('mutasi-tanggal').value,
    jam_pinjam: document.getElementById('mutasi-jamPinjam').value,
    jam_selesai: document.getElementById('mutasi-jamSelesai').value,
    kendaraan: document.getElementById('mutasi-kendaraan').value,
    driver: document.getElementById('mutasi-driver').value,
    tujuan: document.getElementById('mutasi-tujuan').value,
    keterangan: document.getElementById('mutasi-keterangan').value,
  };

  const res = id ? await putData('mutasi', id, data) : await postData('mutasi', data);
  const result = await res.json();

  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    batalFormMutasi();
    renderMutasiTable();
  }
}

async function editMutasi(id) {
  const data = await fetchData('mutasi');
  const item = data.find((i) => i.id === id);
  if (!item) return;

  document.getElementById('form-mutasi').classList.remove('hidden');
  document.getElementById('form-mutasi').dataset.editing = id;

  document.getElementById('mutasi-npp').value = item.npp;
  document.getElementById('mutasi-nama').value = item.nama;
  document.getElementById('mutasi-bagian').value = item.bagian;
  document.getElementById('mutasi-tanggal').value = item.tanggal;
  document.getElementById('mutasi-jamPinjam').value = item.jam_pinjam;
  document.getElementById('mutasi-jamSelesai').value = item.jam_selesai;
  document.getElementById('mutasi-kendaraan').value = item.kendaraan;
  document.getElementById('mutasi-driver').value = item.driver;
  document.getElementById('mutasi-tujuan').value = item.tujuan;
  document.getElementById('mutasi-keterangan').value = item.keterangan;
}

async function hapusMutasi(id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  const res = await deleteData('mutasi', id);
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderMutasiTable();
}

async function approveMutasi(id) {
  const res = await fetch(`${API_BASE}/mutasi.php?id=${id}&approve=true`, {
    method: 'POST',
    credentials: 'include',
  });
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderMutasiTable();
}

// Filter
document.getElementById('filterMutasiNama').addEventListener('input', renderMutasiTable);
document.getElementById('filterMutasiBagian').addEventListener('change', renderMutasiTable);

// ======================== PEMINJAMAN ==========================
async function renderPeminjamanTable() {
  const data = await fetchData('peminjaman');
  const tbody = document.querySelector('#peminjamanTable tbody');
  tbody.innerHTML = '';

  const namaFilter = document.getElementById('filterPeminjamanNama').value.toLowerCase();
  const ruangFilter = document.getElementById('filterPeminjamanRuangan').value;

  const filtered = data.filter((item) => (!namaFilter || item.nama.toLowerCase().includes(namaFilter)) && (!ruangFilter || item.ruangan === ruangFilter));

  for (const item of filtered) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border px-2">${item.npp}</td>
      <td class="border px-2">${item.nama}</td>
      <td class="border px-2">${item.bagian}</td>
      <td class="border px-2">${item.tanggal}</td>
      <td class="border px-2">${item.waktu}</td>
      <td class="border px-2">${item.keterangan}</td>
      <td class="border px-2">${item.ruangan}</td>
      <td class="border px-2">${item.approval ? '✅Disetujui' : isAdmin ? `<button onclick="approvePeminjaman('${item.id}')" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded">Setujui</button>` : '⏳Menunggu'}</td>
      <td class="border px-2">
        ${
          isAdmin
            ? `
          <button onclick="editPeminjaman('${item.id}')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded mr-1">Edit</button>
          <button onclick="hapusPeminjaman('${item.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
        `
            : '-'
        }
      </td>
    `;
    tbody.appendChild(row);
  }
}

function showFormPeminjaman() {
  document.getElementById('form-peminjaman').classList.remove('hidden');
  document.getElementById('form-peminjaman').dataset.editing = '';
  document.querySelectorAll('#form-peminjaman input, #form-peminjaman select, #form-peminjaman textarea').forEach((el) => (el.value = ''));
}

function batalFormPeminjaman() {
  document.getElementById('form-peminjaman').classList.add('hidden');
  document.getElementById('form-peminjaman').dataset.editing = '';
}

async function submitFormPeminjaman(e) {
  e.preventDefault();
  const id = document.getElementById('form-peminjaman').dataset.editing;
  const data = {
    npp: document.getElementById('pinjam-npp').value.trim(),
    nama: document.getElementById('pinjam-nama').value.trim(),
    bagian: document.getElementById('pinjam-bagian').value,
    tanggal: document.getElementById('pinjam-tanggal').value,
    waktu: document.getElementById('pinjam-waktu').value,
    keterangan: document.getElementById('pinjam-keterangan').value,
    ruangan: document.getElementById('pinjam-ruangan').value,
  };

  const res = id ? await putData('peminjaman', id, data) : await postData('peminjaman', data);
  const result = await res.json();

  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    batalFormPeminjaman();
    renderPeminjamanTable();
  }
}

async function editPeminjaman(id) {
  const data = await fetchData('peminjaman');
  const item = data.find((i) => i.id === id);
  if (!item) return;

  document.getElementById('form-peminjaman').classList.remove('hidden');
  document.getElementById('form-peminjaman').dataset.editing = id;

  document.getElementById('pinjam-npp').value = item.npp;
  document.getElementById('pinjam-nama').value = item.nama;
  document.getElementById('pinjam-bagian').value = item.bagian;
  document.getElementById('pinjam-tanggal').value = item.tanggal;
  document.getElementById('pinjam-waktu').value = item.waktu;
  document.getElementById('pinjam-keterangan').value = item.keterangan;
  document.getElementById('pinjam-ruangan').value = item.ruangan;
}

async function hapusPeminjaman(id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  const res = await deleteData('peminjaman', id);
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderPeminjamanTable();
}

async function approvePeminjaman(id) {
  const res = await fetch(`${API_BASE}/peminjaman.php?id=${id}&approve=true`, {
    method: 'POST',
    credentials: 'include',
  });
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderPeminjamanTable();
}

// Filter
document.getElementById('filterPeminjamanNama').addEventListener('input', renderPeminjamanTable);
document.getElementById('filterPeminjamanRuangan').addEventListener('change', renderPeminjamanTable);

// ======================== ZOOM ==========================
async function renderZoomTable() {
  const data = await fetchData('zoom');
  const tbody = document.querySelector('#zoomTable tbody');
  tbody.innerHTML = '';

  const namaFilter = document.getElementById('filterZoomNama').value.toLowerCase();

  const filtered = data.filter((item) => !namaFilter || item.nama.toLowerCase().includes(namaFilter));

  for (const item of filtered) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border px-2">${item.npp}</td>
      <td class="border px-2">${item.nama}</td>
      <td class="border px-2">${item.bagian}</td>
      <td class="border px-2">${item.tanggal}</td>
      <td class="border px-2">${item.waktu}</td>
      <td class="border px-2">${item.kegiatan}</td>
      <td class="border px-2">${item.akun || '-'}</td>
      <td class="border px-2">
        ${
          item.approval
            ? '✅Disetujui'
            : isAdmin
            ? `<input class="border text-xs w-28" placeholder="Akun Zoom" 
                    onchange="setAkunZoom('${item.id}', this.value)" 
                    value="${akunZoomMap[item.id] || ''}">
                <button onclick="approveZoom('${item.id}')" class="ml-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded">✔</button>`
            : '⏳Menunggu'
        }
      </td>
      <td class="border px-2">
        ${
          isAdmin
            ? `
          <button onclick="editZoom('${item.id}')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded mr-1">Edit</button>
          <button onclick="hapusZoom('${item.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
        `
            : '-'
        }
      </td>
    `;
    tbody.appendChild(row);
  }
}

function showFormZoom() {
  document.getElementById('form-zoom').classList.remove('hidden');
  document.getElementById('form-zoom').dataset.editing = '';
  document.querySelectorAll('#form-zoom input, #form-zoom select').forEach((el) => (el.value = ''));
}

function batalFormZoom() {
  document.getElementById('form-zoom').classList.add('hidden');
  document.getElementById('form-zoom').dataset.editing = '';
}

async function submitFormZoom(e) {
  e.preventDefault();
  const id = document.getElementById('form-zoom').dataset.editing;
  const data = {
    npp: document.getElementById('zoom-npp').value.trim(),
    nama: document.getElementById('zoom-nama').value.trim(),
    bagian: document.getElementById('zoom-bagian').value,
    tanggal: document.getElementById('zoom-tanggal').value,
    waktu: document.getElementById('zoom-waktu').value,
    kegiatan: document.getElementById('zoom-kegiatan').value,
  };

  const res = id ? await putData('zoom', id, data) : await postData('zoom', data);
  const result = await res.json();

  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    batalFormZoom();
    renderZoomTable();
  }
}

async function editZoom(id) {
  const data = await fetchData('zoom');
  const item = data.find((i) => i.id === id);
  if (!item) return;

  document.getElementById('form-zoom').classList.remove('hidden');
  document.getElementById('form-zoom').dataset.editing = id;

  document.getElementById('zoom-npp').value = item.npp;
  document.getElementById('zoom-nama').value = item.nama;
  document.getElementById('zoom-bagian').value = item.bagian;
  document.getElementById('zoom-tanggal').value = item.tanggal;
  document.getElementById('zoom-waktu').value = item.waktu;
  document.getElementById('zoom-kegiatan').value = item.kegiatan;
}

async function hapusZoom(id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  const res = await deleteData('zoom', id);
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderZoomTable();
}

const akunZoomMap = {};

function setAkunZoom(id, value) {
  akunZoomMap[id] = value;
}

async function approveZoom(id) {
  const akun = (akunZoomMap[id] || '').trim();
  if (!akun) {
    showToast('Akun Zoom harus diisi sebelum menyetujui.', 'error');
    return;
  }

  const res = await fetch(`${API_BASE}/zoom.php?id=${id}&approve=true`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ akun }),
  });

  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderZoomTable();
}

// Filter
document.getElementById('filterZoomNama').addEventListener('input', renderZoomTable);

// ======================== GRAB ==========================
async function renderGrabTable() {
  const data = await fetchData('grab');
  const tbody = document.querySelector('#grabTable tbody');
  tbody.innerHTML = '';

  const namaFilter = document.getElementById('filterGrabNama').value.toLowerCase();

  const filtered = data.filter((item) => !namaFilter || item.nama.toLowerCase().includes(namaFilter));

  for (const item of filtered) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border px-2">${item.npp}</td>
      <td class="border px-2">${item.nama}</td>
      <td class="border px-2">${item.tanggal}</td>
      <td class="border px-2">${item.jam}</td>
      <td class="border px-2">${item.tujuan}</td>
      <td class="border px-2">${item.keterangan}</td>
      <td class="border px-2">${item.kode || '-'}</td>
      <td class="border px-2">
        ${
          item.kode ||
          (isAdmin && !item.approval
            ? `
            <input class="border text-xs px-1 w-28" placeholder="Kode Grab" 
            onchange="setKodeGrab('${item.id}', this.value)" 
            value="${kodeGrabMap[item.id] || ''}">`
            : '-')
        }
      </td>
      <td class="border px-2">
        ${
          item.approval
            ? '✅Disetujui'
            : isAdmin
            ? `
            <button onclick="approveGrab('${item.id}')" class="ml-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded">✔</button>
        `
            : '⏳Menunggu'
        }
      </td>
      <td class="border px-2">
        ${
          isAdmin
            ? `
          <button onclick="editGrab('${item.id}')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded mr-1">Edit</button>
          <button onclick="hapusGrab('${item.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
        `
            : '-'
        }
      </td>
    `;
    tbody.appendChild(row);
  }
}

function showFormGrab() {
  document.getElementById('form-grab').classList.remove('hidden');
  document.getElementById('form-grab').dataset.editing = '';
  document.querySelectorAll('#form-grab input, #form-grab textarea').forEach((el) => (el.value = ''));
}

function batalFormGrab() {
  document.getElementById('form-grab').classList.add('hidden');
  document.getElementById('form-grab').dataset.editing = '';
}

async function submitFormGrab(e) {
  e.preventDefault();
  const id = document.getElementById('form-grab').dataset.editing;
  const data = {
    npp: document.getElementById('grab-npp').value.trim(),
    nama: document.getElementById('grab-nama').value.trim(),
    tanggal: document.getElementById('grab-tanggal').value,
    jam: document.getElementById('grab-jam').value,
    tujuan: document.getElementById('grab-tujuan').value,
    keterangan: document.getElementById('grab-keterangan').value,
  };

  const res = id ? await putData('grab', id, data) : await postData('grab', data);
  const result = await res.json();

  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    batalFormGrab();
    renderGrabTable();
  }
}

async function editGrab(id) {
  const data = await fetchData('grab');
  const item = data.find((i) => i.id === id);
  if (!item) return;

  document.getElementById('form-grab').classList.remove('hidden');
  document.getElementById('form-grab').dataset.editing = id;

  document.getElementById('grab-npp').value = item.npp;
  document.getElementById('grab-nama').value = item.nama;
  document.getElementById('grab-tanggal').value = item.tanggal;
  document.getElementById('grab-jam').value = item.jam;
  document.getElementById('grab-tujuan').value = item.tujuan;
  document.getElementById('grab-keterangan').value = item.keterangan;
}

async function hapusGrab(id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  const res = await deleteData('grab', id);
  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderGrabTable();
}

const kodeGrabMap = {};

function setKodeGrab(id, kode) {
  kodeGrabMap[id] = kode;
}

async function approveGrab(id) {
  const kode = (kodeGrabMap[id] || '').trim();
  if (!kode) {
    showToast('Isi kode Grab terlebih dahulu sebelum menyetujui.', 'error');
    return;
  }

  const res = await fetch(`${API_BASE}/grab.php?id=${id}&approve=true`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kode }),
  });

  const result = await res.json();
  showToast(result.message, result.success ? 'success' : 'error');
  renderGrabTable();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('api/session.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (result.success) {
      alert('Login berhasil!');
      window.location.href = 'index.html';
    } else {
      alert('Login gagal: ' + result.message);
    }
  } catch (err) {
    alert('Server tidak dapat dihubungi.');
    console.error(err);
  }
});

// Filter
document.getElementById('filterGrabNama').addEventListener('input', renderGrabTable);

// Init dan Render Semua
function renderAllTables() {
  renderInventarisTable();
  renderMutasiTable();
  renderPeminjamanTable();
  renderZoomTable();
  renderGrabTable();
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📦 DOM loaded');
  const isLoggedIn = await checkSession();
  if (!isLoggedIn) return;

  setupNavigation();
  renderAllTables();
  updateStatistik();
  showSection('home');
});
