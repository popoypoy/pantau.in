// aset-app.js (versi final dengan render dan approval tersimpan)

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  if (!role) {
    window.location.href = "login.html";
    return;
  }

  const isAdmin = role === "admin";
  const categories = ["inventaris", "mutasi", "peminjaman", "zoom", "grab"];
  categories.forEach((key) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, "[]");
  });

  function simpanData(key, newData) {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    data.push(newData);
    localStorage.setItem(key, JSON.stringify(data));
  }

  window.setujuData = function (key, index) {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    if (data[index]) {
      data[index].approval = true;
      localStorage.setItem(key, JSON.stringify(data));
      alert("Data berhasil disetujui.");
      renderAllTables();
    }
  };

  window.resetSeluruhData = function () {
    if (getUserRole() !== "admin") {
      alert("Hanya admin yang dapat menghapus semua data.");
      return;
    }
    if (
      confirm(
        "Yakin ingin menghapus semua data? Ini akan menghapus semua inventaris, mutasi, peminjaman, zoom, dan grab."
      )
    ) {
      localStorage.clear();
      alert("Semua data berhasil dihapus!");
      location.reload();
    }
  };

  function ambilNilaiForm(ids) {
    const hasil = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      hasil[id] = el ? el.value : "";
    });
    return hasil;
  }

  // ==================== FORM SUBMIT ==================== //

  window.submitFormInventaris = function () {
    const kode = document.getElementById("inv-kode").value;
    const nama = document.getElementById("inv-nama").value;
    const lokasi = document.getElementById("inv-lokasi").value;
    const kondisi = document.getElementById("inv-kondisi").value;
    const fotoInput = document.getElementById("inv-foto");

    if (fotoInput.files.length === 0) return alert("Foto harus diunggah!");

    const reader = new FileReader();
    reader.onload = () => {
      const newData = { kode, nama, lokasi, kondisi, foto: reader.result };
      simpanData("inventaris", newData);
      alert("Data inventaris disimpan!");
      renderInventaris();
    };
    reader.readAsDataURL(fotoInput.files[0]);
  };

  window.submitFormMutasi = function () {
    const data = ambilNilaiForm([
      "mutasi-npp",
      "mutasi-nama",
      "mutasi-bagian",
      "mutasi-tanggal",
      "mutasi-jamPinjam",
      "mutasi-jamSelesai",
      "mutasi-kendaraan",
      "mutasi-driver",
      "mutasi-tujuan",
      "mutasi-keterangan",
    ]);
    data.approval = false;
    simpanData("mutasi", data);
    alert("Data mutasi disimpan!");
    renderMutasi();
  };
  const oldSubmitMutasi = window.submitFormMutasi;
  window.submitFormMutasi = function () {
    const data = ambilNilaiForm([
      "mutasi-npp",
      "mutasi-nama",
      "mutasi-bagian",
      "mutasi-tanggal",
      "mutasi-jamPinjam",
      "mutasi-jamSelesai",
      "mutasi-kendaraan",
      "mutasi-driver",
      "mutasi-tujuan",
      "mutasi-keterangan",
    ]);

    if (fieldKosong(data, Object.keys(data))) return;
    oldSubmitMutasi();
    resetForm("mutasi");
  };

  window.submitFormPeminjaman = function () {
    const data = ambilNilaiForm([
      "pinjam-npp",
      "pinjam-nama",
      "pinjam-bagian",
      "pinjam-tanggal",
      "pinjam-waktu",
      "pinjam-keterangan",
      "pinjam-ruangan",
    ]);
    data.approval = false;
    simpanData("peminjaman", data);
    alert("Data peminjaman disimpan!");
    renderPeminjaman();
  };
  const oldSubmitPeminjaman = window.submitFormPeminjaman;
  window.submitFormPeminjaman = function () {
    const data = ambilNilaiForm([
      "pinjam-npp",
      "pinjam-nama",
      "pinjam-bagian",
      "pinjam-tanggal",
      "pinjam-waktu",
      "pinjam-keterangan",
      "pinjam-ruangan",
    ]);

    if (fieldKosong(data, Object.keys(data))) return;
    oldSubmitPeminjaman();
    resetForm("pinjam");
  };

  window.submitFormZoom = function () {
    const data = ambilNilaiForm([
      "zoom-npp",
      "zoom-nama",
      "zoom-bagian",
      "zoom-tanggal",
      "zoom-waktu",
      "zoom-kegiatan",
    ]);
    data.approval = false;
    simpanData("zoom", data);
    alert("Data Zoom disimpan!");
    renderZoom();
  };
  const oldSubmitZoom = window.submitFormZoom;
  window.submitFormZoom = function () {
    const data = ambilNilaiForm([
      "zoom-npp",
      "zoom-nama",
      "zoom-bagian",
      "zoom-tanggal",
      "zoom-waktu",
      "zoom-kegiatan",
    ]);

    if (fieldKosong(data, Object.keys(data))) return;
    oldSubmitZoom();
    resetForm("zoom");
  };

  window.submitFormGrab = function () {
    const data = ambilNilaiForm([
      "grab-npp",
      "grab-nama",
      "grab-tanggal",
      "grab-jam",
      "grab-tujuan",
      "grab-keterangan",
    ]);
    data.kode = Math.random().toString(36).substring(2, 8);
    data.approval = false;
    simpanData("grab", data);
    alert("Data Grab disimpan!");
    renderGrab();
  };
  function resetForm(prefix) {
    const inputs = document.querySelectorAll(`[id^='${prefix}-']`);
    inputs.forEach((el) => {
      if (el.type === "file") el.value = null;
      else el.value = "";
    });
  }
  const oldSubmitGrab = window.submitFormGrab;
  window.submitFormGrab = function () {
    const data = ambilNilaiForm([
      "grab-npp",
      "grab-nama",
      "grab-tanggal",
      "grab-jam",
      "grab-tujuan",
      "grab-keterangan",
    ]);

    if (fieldKosong(data, Object.keys(data))) return;
    oldSubmitGrab();
    resetForm("grab");
  };

  function fieldKosong(data, fields = []) {
    for (let key of fields) {
      if (!data[key] || data[key].trim() === "") {
        alert("Field '" + key + "' harus diisi.");
        return true;
      }
    }
    return false;
  }

  // ============== RENDER TABLES ============== //

  function renderAllTables() {
    renderMutasi();
    renderPeminjaman();
    renderZoom();
    renderGrab();
    renderInventaris();
  }

  function renderMutasi() {
    const tbody = document.querySelector("#mutasiTable tbody");
    const data = JSON.parse(localStorage.getItem("mutasi") || "[]");
    tbody.innerHTML = data
      .map(
        (item, i) => `
      <tr>
        <td class="px-4 py-2">${item["mutasi-npp"]}</td>
        <td class="px-4 py-2">${item["mutasi-nama"]}</td>
        <td class="px-4 py-2">${item["mutasi-bagian"]}</td>
        <td class="px-4 py-2">${item["mutasi-tanggal"]}</td>
        <td class="px-4 py-2">${item["mutasi-jamPinjam"]}</td>
        <td class="px-4 py-2">${item["mutasi-jamSelesai"]}</td>
        <td class="px-4 py-2">${item["mutasi-kendaraan"]}</td>
        <td class="px-4 py-2">${item["mutasi-driver"]}</td>
        <td class="px-4 py-2">${item["mutasi-tujuan"]}</td>
        <td class="px-4 py-2">${item["mutasi-keterangan"]}</td>
        <td class="px-4 py-2">
          ${
            item.approval
              ? "✅ Disetujui"
              : isAdmin
              ? `<button class="btn-approval bg-green-500 text-white px-2 py-1 rounded" onclick="setujuData('mutasi', ${i})">Approve</button>`
              : "⏳ Menunggu"
          }
        </td>
      </tr>
    `
      )
      .join("");
  }

  function renderPeminjaman() {
    const tbody = document.querySelector("#peminjamanTable tbody");
    const data = JSON.parse(localStorage.getItem("peminjaman") || "[]");
    tbody.innerHTML = data
      .map(
        (item, i) => `
      <tr>
        <td class="px-4 py-2">${item["pinjam-npp"]}</td>
        <td class="px-4 py-2">${item["pinjam-nama"]}</td>
        <td class="px-4 py-2">${item["pinjam-bagian"]}</td>
        <td class="px-4 py-2">${item["pinjam-tanggal"]}</td>
        <td class="px-4 py-2">${item["pinjam-waktu"]}</td>
        <td class="px-4 py-2">${item["pinjam-keterangan"]}</td>
        <td class="px-4 py-2">${item["pinjam-ruangan"]}</td>
        <td class="px-4 py-2">
          ${
            item.approval
              ? "✅ Disetujui"
              : isAdmin
              ? `<button class="btn-approval bg-green-500 text-white px-2 py-1 rounded" onclick="setujuData('peminjaman', ${i})">Approve</button>`
              : "⏳ Menunggu"
          }
        </td>
      </tr>
    `
      )
      .join("");
  }

  function renderInventaris() {
    const tbody = document.querySelector("#inventarisTable tbody");
    const data = JSON.parse(localStorage.getItem("inventaris") || "[]");
    tbody.innerHTML = data
      .map(
        (item) => `
      <tr>
        <td class="px-4 py-2">${item.kode}</td>
        <td class="px-4 py-2">${item.nama}</td>
        <td class="px-4 py-2">${item.lokasi}</td>
        <td class="px-4 py-2">${item.kondisi}</td>
        <td class="px-4 py-2"><img src="${item.foto}" class="h-16 w-12 object-cover rounded"></td>
      </tr>
    `
      )
      .join("");
  }

  // Fungsi edit akun Zoom dan kode Grab (hanya admin)
  window.editField = function (key, index, field) {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    const value = prompt(`Edit ${field}:`, data[index][field] || "");
    if (value !== null) {
      data[index][field] = value;
      localStorage.setItem(key, JSON.stringify(data));
      alert(`${field} diperbarui.`);
      renderAllTables();
    }
  };

  // Modifikasi fungsi render Zoom & Grab
  function renderZoom(dataOverride) {
    const tbody = document.querySelector("#zoomTable tbody");
    const data =
      dataOverride || JSON.parse(localStorage.getItem("zoom") || "[]");
    tbody.innerHTML = data
      .map(
        (item, i) => `
    <tr>
      <td class="px-4 py-2">${item["zoom-npp"]}</td>
      <td class="px-4 py-2">${item["zoom-nama"]}</td>
      <td class="px-4 py-2">${item["zoom-bagian"]}</td>
      <td class="px-4 py-2">${item["zoom-tanggal"]}</td>
      <td class="px-4 py-2">${item["zoom-waktu"]}</td>
      <td class="px-4 py-2">${item["zoom-kegiatan"]}</td>
      <td class="px-4 py-2">
        ${
          item.approval
            ? item.akun
            : isAdmin
            ? item.akun || "(belum diisi)"
            : "-"
        }
        ${
          isAdmin && !item.approval
            ? `<button onclick="editField('zoom', ${i}, 'akun')" class="ml-2 text-blue-600">Edit</button>`
            : ""
        }
      </td>
      <td class="px-4 py-2">
        ${
          item.approval
            ? "✅ Disetujui"
            : isAdmin
            ? `<button class="btn-approval bg-green-500 text-white px-2 py-1 rounded" onclick="setujuData('zoom', ${i})">Approve</button>`
            : "⏳ Menunggu"
        }
      </td>
    </tr>
  `
      )
      .join("");
  }

  function renderGrab(dataOverride) {
    const tbody = document.querySelector("#grabTable tbody");
    const data =
      dataOverride || JSON.parse(localStorage.getItem("grab") || "[]");
    tbody.innerHTML = data
      .map(
        (item, i) => `
    <tr>
      <td class="px-4 py-2">${item["grab-npp"]}</td>
      <td class="px-4 py-2">${item["grab-nama"]}</td>
      <td class="px-4 py-2">${item["grab-tanggal"]}</td>
      <td class="px-4 py-2">${item["grab-jam"]}</td>
      <td class="px-4 py-2">${item["grab-tujuan"]}</td>
      <td class="px-4 py-2">${item["grab-keterangan"]}</td>
      <td class="px-4 py-2">
        ${
          item.approval
            ? item.kode
            : isAdmin
            ? item.kode || "(belum diisi)"
            : "-"
        }
        ${
          isAdmin && !item.approval
            ? `<button onclick="editField('grab', ${i}, 'kode')" class="ml-2 text-blue-600">Edit</button>`
            : ""
        }
      </td>
      <td class="px-4 py-2">
        ${
          item.approval
            ? "✅ Disetujui"
            : isAdmin
            ? `<button class="btn-approval bg-green-500 text-white px-2 py-1 rounded" onclick="setujuData('grab', ${i})">Approve</button>`
            : "⏳ Menunggu"
        }
      </td>
    </tr>
  `
      )
      .join("");
  }

  renderAllTables();
});
