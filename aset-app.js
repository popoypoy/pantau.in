// aset-app.js (versi final dengan render dan approval tersimpan)

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  if (!role) {
    window.location.href = "login.html";
    return;
  }

  const isAdmin = role === "admin";
  renderInventaris();
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
    const item = data[index];

    // ✅ Validasi khusus untuk Zoom
    if (key === "zoom" && (!item.akun || item.akun === "-")) {
      Swal.fire({
        icon: "warning",
        title: "Akun Zoom belum diisi",
        text: "Silakan isi akun Zoom terlebih dahulu sebelum menyetujui.",
      });
      return;
    }

    // ✅ Validasi khusus untuk Grab
    if (key === "grab" && (!item.kode || item.kode === "-")) {
      Swal.fire({
        icon: "warning",
        title: "Kode Grab belum diisi",
        text: "Silakan isi kode Grab terlebih dahulu sebelum menyetujui.",
      });
      return;
    }

    item.approval = true;
    localStorage.setItem(key, JSON.stringify(data));
    showToast("Permintaan disetujui!", "success");

    if (key === "mutasi") renderMutasi();
    else if (key === "peminjaman") renderPeminjaman();
    else if (key === "zoom") renderZoom();
    else if (key === "grab") renderGrab();
  };

  window.hapusData = function (key, index) {
    Swal.fire({
      title: "Tenane meh dihapus?",
      text: "Rak bakal iso balikan loh!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3342f",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        data.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(data));
        showToast("Data berhasil dihapus!", "success");

        if (key === "inventaris") renderInventaris();
        else if (key === "mutasi") renderMutasi();
        else if (key === "peminjaman") renderPeminjaman();
        else if (key === "zoom") renderZoom();
        else if (key === "grab") renderGrab();
      }
    });
  };

  function bukaFormBaru(formId, prefix) {
    window.currentEditKey = null;
    window.currentEditIndex = null;
    if (typeof resetForm === "function") resetForm(prefix);
    if (typeof showForm === "function") showForm(formId);
  }

  function batalInput(prefix, modul) {
    resetForm(prefix);
    window.currentEditKey = null;
    window.currentEditIndex = null;
    showForm(modul);
  }

  window.resetSeluruhData = function () {
    if (getUserRole() !== "admin") {
      showToast("Hanya admin yang dapat menghapus semua data.");
      return;
    }

    // 🔍 Cek apakah ada data Zoom yang belum isi akun
    const zoomData = JSON.parse(localStorage.getItem("zoom") || "[]");
    const zoomBelumIsi = zoomData.some(
      (item) => !item.akun || item.akun === "-"
    );

    // 🔍 Cek apakah ada data Grab yang belum isi kode
    const grabData = JSON.parse(localStorage.getItem("grab") || "[]");
    const grabBelumIsi = grabData.some(
      (item) => !item.kode || item.kode === "-"
    );

    if (zoomBelumIsi || grabBelumIsi) {
      Swal.fire({
        icon: "warning",
        title: "Data belum lengkap",
        html: `
        ${
          zoomBelumIsi
            ? "Masih ada peminjaman Zoom yang belum mengisi akun Zoom.<br>"
            : ""
        }
        ${
          grabBelumIsi
            ? "Masih ada pemesanan Grab yang belum mengisi kode Grab.<br>"
            : ""
        }
        Silakan lengkapi data terlebih dahulu sebelum mereset semua data.
      `,
      });
      return;
    }

    // Konfirmasi penghapusan
    Swal.fire({
      title: "Tenane meh dihapus kabeh?",
      text: "Ibarate koyo mantan, yen wis ilang ora bakal iso mbalik lo!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3342f",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus semua!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        showToast("Semua data berhasil dihapus!");
        location.reload();
      }
    });
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
    const kode = document.getElementById("inv-kode").value.trim();
    const nama = document.getElementById("inv-nama").value.trim();
    const lokasi = document.getElementById("inv-lokasi").value;
    const kondisi = document.getElementById("inv-kondisi").value;
    const fotoInput = document.getElementById("inv-foto");

    // Validasi field kosong
    if (!kode) return showToast("Kode aset kudune diisi!", "error");
    if (!nama) return showToast("Nama aset diisi sik to ya!", "error");
    if (!lokasi) return showToast("Lokasi asete ning ndi bolo?", "error");
    if (!kondisi) return showToast("Kondisie pi jal?", "error");

    // Validasi upload foto hanya saat tambah data baru
    const isEdit =
      window.currentEditKey === "inventaris" &&
      window.currentEditIndex !== undefined;
    if (!isEdit && fotoInput.files.length === 0)
      return showToast("PAP Sik", "error");

    // Untuk edit: ambil data lama dan update
    if (isEdit) {
      const data = JSON.parse(localStorage.getItem("inventaris") || "[]");
      const item = data[window.currentEditIndex];
      item.kode = kode;
      item.nama = nama;
      item.lokasi = lokasi;
      item.kondisi = kondisi;

      if (all.some((item) => item.kode === kode)) {
        return showToast("Kode aset sudah digunakan!", "error");
      }

      // Jika admin upload ulang foto saat edit
      if (fotoInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = () => {
          item.foto = reader.result;
          localStorage.setItem("inventaris", JSON.stringify(data));
          showToast("Data inventaris diperbarui!");
          renderInventaris();
          showForm("inventaris");
          window.currentEditKey = null;
          window.currentEditIndex = null;
        };
        reader.readAsDataURL(fotoInput.files[0]);
      } else {
        localStorage.setItem("inventaris", JSON.stringify(data));
        showToast("Data inventaris diperbarui!");
        renderInventaris();
        showForm("inventaris");
        window.currentEditKey = null;
        window.currentEditIndex = null;
      }
      return;
    }

    // Tambah data baru
    const reader = new FileReader();
    reader.onload = () => {
      const newData = { kode, nama, lokasi, kondisi, foto: reader.result };
      simpanData("inventaris", newData);
      showToast("Data inventaris disimpan!");
      renderInventaris();
      showForm("inventaris");
      resetForm("inv"); // Memanggil fungsi reset yang sudah ada
    };
    reader.readAsDataURL(fotoInput.files[0]);
  };

  window.submitFormMutasi = function () {
    const oldSubmitMutasi = window.submitFormMutasi;
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

    // Validasi field kosong
    if (fieldKosong(data, Object.keys(data))) return;

    const isEdit =
      window.currentEditKey === "mutasi" &&
      window.currentEditIndex !== undefined;

    if (isEdit) {
      const allData = JSON.parse(localStorage.getItem("mutasi") || "[]");
      allData[window.currentEditIndex] = { ...data, approval: false };
      localStorage.setItem("mutasi", JSON.stringify(allData));
      showToast("Data mutasi diperbarui!");
      renderMutasi();
      showForm("mutasi");
      window.currentEditKey = null;
      window.currentEditIndex = null;
      resetForm("mutasi");
      return;
    }

    // Tambah data baru
    data.approval = false;
    simpanData("mutasi", data);
    showToast("Data mutasi disimpan!");
    renderMutasi();
    showForm("mutasi");
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

    if (fieldKosong(data, Object.keys(data))) return;

    const isEdit =
      window.currentEditKey === "peminjaman" &&
      window.currentEditIndex !== undefined;
    if (isEdit) {
      const all = JSON.parse(localStorage.getItem("peminjaman") || "[]");
      all[window.currentEditIndex] = { ...data, approval: false };
      localStorage.setItem("peminjaman", JSON.stringify(all));
      showToast("Data peminjaman diperbarui!");
      renderPeminjaman();
      showForm("peminjaman");
      resetForm("pinjam");
      window.currentEditKey = null;
      window.currentEditIndex = null;
      return;
    }

    data.approval = false;
    simpanData("peminjaman", data);
    showToast("Data peminjaman disimpan!");
    renderPeminjaman();
    showForm("peminjaman");
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

    if (fieldKosong(data, Object.keys(data))) return;

    const isEdit =
      window.currentEditKey === "zoom" && window.currentEditIndex !== undefined;
    if (isEdit) {
      const all = JSON.parse(localStorage.getItem("zoom") || "[]");
      data.akun = all[window.currentEditIndex].akun || "";
      all[window.currentEditIndex] = { ...data, approval: false };
      localStorage.setItem("zoom", JSON.stringify(all));
      showToast("Data Zoom diperbarui!");
      renderZoom();
      showForm("peminjaman-zoom");
      resetForm("zoom");
      style.display = "none";
      window.currentEditKey = null;
      window.currentEditIndex = null;
      return;
    }

    data.akun = "";
    data.approval = false;
    simpanData("zoom", data);
    showToast("Data Zoom disimpan!");
    renderZoom();
    showForm("peminjaman-zoom");
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

    if (fieldKosong(data, Object.keys(data))) return;

    const isEdit =
      window.currentEditKey === "grab" && window.currentEditIndex !== undefined;
    if (isEdit) {
      const all = JSON.parse(localStorage.getItem("grab") || "[]");
      data.kode = all[window.currentEditIndex].kode || "";
      all[window.currentEditIndex] = { ...data, approval: false };
      localStorage.setItem("grab", JSON.stringify(all));
      showToast("Data Grab diperbarui!");
      renderGrab();
      showForm("pemesanan-grab");
      resetForm("grab");
      style.display = "none";
      window.currentEditKey = null;
      window.currentEditIndex = null;
      return;
    }

    data.kode = "";
    data.approval = false;
    simpanData("grab", data);
    showToast("Data Grab disimpan!");
    renderGrab();
    showForm("pemesanan-grab");
    resetForm("grab");
  };

  window.editData = function (key, index) {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    const item = data[index];
    if (!item) return;

    window.currentEditKey = key;
    window.currentEditIndex = index;

    const role = localStorage.getItem("role");

    // 👇 TAMBAHKAN BAGIAN INI UNTUK INVENTARIS
    if (key === "inventaris") {
      document.getElementById("inv-kode").value = item.kode;
      document.getElementById("inv-nama").value = item.nama;
      document.getElementById("inv-lokasi").value = item.lokasi;
      document.getElementById("inv-kondisi").value = item.kondisi;
      showForm("form-inventaris");
      return;
    }

    if (key === "mutasi") {
      document.getElementById("mutasi-npp").value = item["mutasi-npp"];
      document.getElementById("mutasi-nama").value = item["mutasi-nama"];
      document.getElementById("mutasi-bagian").value = item["mutasi-bagian"];
      document.getElementById("mutasi-tanggal").value = item["mutasi-tanggal"];
      document.getElementById("mutasi-jamPinjam").value =
        item["mutasi-jamPinjam"];
      document.getElementById("mutasi-jamSelesai").value =
        item["mutasi-jamSelesai"];
      document.getElementById("mutasi-kendaraan").value =
        item["mutasi-kendaraan"];
      document.getElementById("mutasi-driver").value = item["mutasi-driver"];
      document.getElementById("mutasi-tujuan").value = item["mutasi-tujuan"];
      document.getElementById("mutasi-keterangan").value =
        item["mutasi-keterangan"];
      showForm("form-mutasi");
      return;
    }

    const prefix = key === "peminjaman" ? "pinjam" : key;

    for (let field in item) {
      const fieldKey = `${prefix}-${field.split("-")[1] || field}`;
      const el = document.getElementById(fieldKey);
      if (el && el.type !== "file") {
        el.value = item[field];

        // Tampilkan field kode (grab) jika admin dan belum disetujui
        if (key === "grab") {
          const wrap = document.getElementById("wrap-grab-kode");
          const input = document.getElementById("grab-kode");
          const btn = document.getElementById("edit-kode-btn");

          if (role === "admin" && wrap && input && btn) {
            wrap.style.display = "flex";
            input.value = item.kode || "";
            input.readOnly = true;
            btn.style.display = !item.approval ? "inline-block" : "none";
          }
        }

        if (key === "zoom") {
          const wrap = document.getElementById("wrap-zoom-akun");
          const input = document.getElementById("zoom-akun");
          const btn = document.getElementById("edit-akun-btn");

          if (role === "admin" && wrap && input && btn) {
            wrap.style.display = "flex";
            input.value = item.akun || "";
            input.readOnly = true;
            btn.style.display = !item.approval ? "inline-block" : "none";
          }
        }

        // Tampilkan field akun (zoom) jika admin dan belum disetujui
        if (key === "zoom" && field === "akun") {
          el.readOnly = !(role === "admin" && item.approval === false);
          el.parentElement.style.display = "block";
          const editBtn = document.getElementById("edit-akun-btn");
          if (editBtn)
            editBtn.style.display =
              role === "admin" && item.approval === false
                ? "inline-block"
                : "none";
        }
      }
    }

    showForm(`form-${key}`);
  };

  function aksiColumn(key, index) {
    const role = localStorage.getItem("role");
    if (role !== "admin") return "-";

    const data = JSON.parse(localStorage.getItem(key) || "[]");
    const item = data[index];

    const approveButton = item.approval
      ? ""
      : `<button onclick="setujuData('${key}', ${index})" class="px-2 py-1 bg-green-500 text-white rounded text-sm">Approve</button>`;

    return `
    <div class="flex gap-2">
      ${approveButton}
      <button onclick="editData('${key}', ${index})" class="px-2 py-1 bg-blue-500 text-white rounded text-sm">Edit</button>
      <button onclick="hapusData('${key}', ${index})" class="px-2 py-1 bg-red-500 text-white rounded text-sm">Hapus</button>
    </div>
  `;
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
    const wrapKode = document.getElementById("wrap-grab-kode");
    if (wrapKode) wrapKode.style.display = role === "admin" ? "flex" : "none";
  };

  function fieldKosong(data, fields = []) {
    const labelMap = {
      // Inventaris
      "inv-kode": "Kode aset kudune diisi!",
      "inv-nama": "Nama aset diisi sik to ya!",
      "inv-lokasi": "Lokasi asete ning ndi bolo?",
      "inv-kondisi": "Kondisie pi jal?",
      "inv-foto": "PAP Sik",

      // Mutasi
      "mutasi-npp": "NPP kudu diisi, sapa seng numpak mobil?",
      "mutasi-nama": "Jenenge sopo kui kuduu jelas, ojo kosong!",
      "mutasi-bagian": "Bagiane opo ik? Diisi sik ya!",
      "mutasi-tanggal": "Tanggal e lali diisi bolo!",
      "mutasi-jamPinjam": "Jam mulai nyelang mobil durung diisi!",
      "mutasi-jamSelesai": "Jam selesai e nang kapan? Isen sik ya!",
      "mutasi-kendaraan": "Nganggo mobil opo bro?",
      "mutasi-driver": "Driver e durung dipilih lho!",
      "mutasi-tujuan": "Tujuane arep neng endi?",
      "mutasi-keterangan": "Keterangane dikasih lah, ben ngerti tujuanmu!",

      // ==== PEMINJAMAN RUANG ====
      "pinjam-npp": "NPP peminjam kudu diisi!",
      "pinjam-nama": "Nama peminjam kudu jelas!",
      "pinjam-bagian": "Bagiane kerja ning ngendi bolo?",
      "pinjam-tanggal": "Tanggal pinjam durung diisi!",
      "pinjam-waktu": "Waktune pinjam ruangan durung diisi!",
      "pinjam-keterangan": "Keterangane durung ditulis!",
      "pinjam-ruangan": "Ruangan e durung dipilih, ojo lali!",

      // ==== ZOOM ====
      "zoom-npp": "NPP kudu diisi sek, ben valid!",
      "zoom-nama": "Jenenge sopo seng minjem Zoom?",
      "zoom-bagian": "Bagian kerja peminjam kudu jelas!",
      "zoom-tanggal": "Tanggal peminjaman Zoom durung diisi!",
      "zoom-waktu": "Jam e kapan, durung diisi iki!",
      "zoom-kegiatan": "Topik/kegiatan kudu ditulis ben ngerti gunane!",

      // ==== GRAB ====
      "grab-npp": "NPP pemesan Grab kudu diisi!",
      "grab-nama": "Jenenge seng pesen Grab durung diisi!",
      "grab-tanggal": "Tanggal pesenan e lali diisi!",
      "grab-jam": "Jam berangkat kudu jelas!",
      "grab-tujuan": "Tujuan e neng endi? Isen sik!",
      "grab-keterangan": "Keterangane durung ditulis bolo!",
    };

    const kosong = fields.find((key) => !data[key] || data[key].trim() === "");
    if (kosong) {
      showToast(labelMap[kosong] || `Field '${kosong}' durung diisi!`, "error");
      return true;
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
    const data = JSON.parse(localStorage.getItem("mutasi") || "[]");
    const tbody = document.querySelector("#mutasiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item["mutasi-npp"]}</td>
        <td>${item["mutasi-nama"]}</td>
        <td>${item["mutasi-bagian"]}</td>
        <td>${item["mutasi-tanggal"]}</td>
        <td>${item["mutasi-jamPinjam"]}</td>
        <td>${item["mutasi-jamSelesai"]}</td>
        <td>${item["mutasi-kendaraan"]}</td>
        <td>${item["mutasi-driver"]}</td>
        <td>${item["mutasi-tujuan"]}</td>
        <td>${item["mutasi-keterangan"]}</td>
        <td>${item.approval ? "✅ Disetujui" : "⏳Menunggu"}</td>
        ${
          isAdmin
            ? `<td>
        <button onclick="editData('mutasi', ${index})" class="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
        <button onclick="hapusData('mutasi', ${index})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
        ${
          !item.approval
            ? `<button onclick="setujuData('mutasi', ${index})" class="bg-green-500 text-white px-2 py-1 rounded ml-1">Approve</button>`
            : ""
        }
      </td>`
            : ""
        }
      `;
      tbody.appendChild(row);
    });
  }

  function renderPeminjaman() {
    const data = JSON.parse(localStorage.getItem("peminjaman") || "[]");
    const tbody = document.querySelector("#peminjamanTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${item["pinjam-npp"]}</td>
      <td>${item["pinjam-nama"]}</td>
      <td>${item["pinjam-bagian"]}</td>
      <td>${item["pinjam-tanggal"]}</td>
      <td>${item["pinjam-waktu"]}</td>
      <td>${item["pinjam-keterangan"]}</td>
      <td>${item["pinjam-ruangan"]}</td>
      <td>${item.approval ? "✅ Disetujui" : "⏳Menunggu"}</td>
      ${
        isAdmin
          ? `<td>
        <button onclick="editData('peminjaman', ${index})" class="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
        <button onclick="hapusData('peminjaman', ${index})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
        ${
          !item.approval
            ? `<button onclick="setujuData('peminjaman', ${index})" class="bg-green-500 text-white px-2 py-1 rounded ml-1">Approve</button>`
            : ""
        }
      </td>`
          : ""
      }
    `;
      tbody.appendChild(row);
    });
  }

  function renderInventaris() {
    const isAdmin = localStorage.getItem("role") === "admin";
    const tbody = document.querySelector("#inventarisTable tbody");
    const data = JSON.parse(localStorage.getItem("inventaris") || "[]");
    const role = localStorage.getItem("role");

    tbody.innerHTML = data
      .map(
        (item, index) => `
      <tr>
        <td class="px-4 py-2">${item.kode}</td>
        <td class="px-4 py-2">${item.nama}</td>
        <td class="px-4 py-2">${item.lokasi}</td>
        <td class="px-4 py-2">${item.kondisi}</td>
        <td class="px-4 py-2"><img src="${
          item.foto
        }" class="h-16 w-12 object-cover rounded"></td>
        ${
          isAdmin
            ? `<td class="px-4 py-2">
                <button onclick="editData('inventaris', ${index})" class="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                <button onclick="hapusData('inventaris', ${index})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
              </td>`
            : ""
        }
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
      showToast(`${field} diperbarui.`);
      renderAllTables();
    }
  };

  // Modifikasi fungsi render Zoom & Grab
  function renderZoom() {
    const data = JSON.parse(localStorage.getItem("zoom") || "[]");
    const tbody = document.querySelector("#zoomTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${item["zoom-npp"]}</td>
      <td>${item["zoom-nama"]}</td>
      <td>${item["zoom-bagian"]}</td>
      <td>${item["zoom-tanggal"]}</td>
      <td>${item["zoom-waktu"]}</td>
      <td>${item["zoom-kegiatan"]}</td>
      <td>
      ${item.akun || "-"} ${
        isAdmin && !item.approval
          ? `<button onclick="editField('zoom', ${index}, 'akun')" class="ml-2 text-sm text-blue-600 underline">Edit</button>`
          : ""
      }</td>
      <td>${item.approval ? "✅ Disetujui" : "⏳Menunggu"}</td>
      ${
        isAdmin
          ? `<td>
        <button onclick="editData('zoom', ${index})" class="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
        <button onclick="hapusData('zoom', ${index})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
        ${
          !item.approval
            ? `<button onclick="setujuData('zoom', ${index})" class="bg-green-500 text-white px-2 py-1 rounded ml-1">Approve</button>`
            : ""
        }
      </td>`
          : ""
      }
    `;
      tbody.appendChild(row);
    });
  }

  function renderGrab() {
    const data = JSON.parse(localStorage.getItem("grab") || "[]");
    const tbody = document.querySelector("#grabTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${item["grab-npp"]}</td>
      <td>${item["grab-nama"]}</td>
      <td>${item["grab-tanggal"]}</td>
      <td>${item["grab-jam"]}</td>
      <td>${item["grab-tujuan"]}</td>
      <td>${item["grab-keterangan"]}</td>
      <td> ${item.kode || "-"}${
        isAdmin && !item.approval
          ? `<button onclick="editField('grab', ${index}, 'kode')" class="ml-2 text-sm text-blue-600 underline">Edit</button>`
          : ""
      }</td>
      <td>${item.approval ? "✅ Disetujui" : "⏳Menunggu"}</td>
      ${
        isAdmin
          ? `<td>
        <button onclick="editData('grab', ${index})" class="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
        <button onclick="hapusData('grab', ${index})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
        ${
          !item.approval
            ? `<button onclick="setujuData('grab', ${index})" class="bg-green-500 text-white px-2 py-1 rounded ml-1">Approve</button>`
            : ""
        }
      </td>`
          : ""
      }
    `;
      tbody.appendChild(row);
    });
  }

  function renderAllTables() {
    renderMutasi();
    renderPeminjaman();
    renderZoom();
    renderGrab();
    renderInventaris();
  }

  renderAllTables();
});

const kodeBtn = document.getElementById("edit-kode-btn");
if (kodeBtn) {
  kodeBtn.addEventListener("click", () => {
    const input = document.getElementById("grab-kode");
    if (input) input.readOnly = false;
  });
}

const akunBtn = document.getElementById("edit-akun-btn");
if (akunBtn) {
  akunBtn.addEventListener("click", () => {
    const input = document.getElementById("zoom-akun");
    if (input) input.readOnly = false;
  });
}

function resetForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((el) => {
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = false;
    } else if (el.type === "file") {
      el.value = null;
    } else {
      el.value = "";
    }
  });
}
