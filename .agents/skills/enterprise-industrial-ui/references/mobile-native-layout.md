# Mobile Native Layout & Card List Patterns

Panduan arsitektur dan pola kode untuk menyulap web application menjadi **100% Native Mobile App Experience** di perangkat smartphone tanpa perlu membuat aplikasi terpisah.

---

## 1. Prinsip Utama Tampilan Mobile Native

1. **HAPUS SIDEBAR DRAWER SLIDER DI MOBILE**:
   - Sidebar samping (*drawer navigation*) sering memotong tampilan dan terasa seperti web jadul di HP.
   - Di mobile view (`< lg`), sidebar desktop disembunyikan total (`hidden lg:flex`).
   - Tidak ada lagi tombol hamburger toggle di mobile header.

2. **ENLARGED TOP BAR HEADER (`h-16` / 64px)**:
   - Header atas dibuat lebih tinggi dan lega (`h-16` di mobile, `h-14` di desktop).
   - Teks nama brand perusahaan tidak boleh terpotong (*truncate*), posisikan logo dan subjudul dengan rapi.
   - Sisi kanan header memuat tombol quick actions:
     - Toggle Bahasa (ID / EN) dengan padding `px-2.5 py-2` (`min-h-[38px]`).
     - Toggle Mode Terang/Gelap (`min-h-[38px] min-w-[38px]`).
     - Avatar Profil (`w-8 h-8 rounded-full`).
   - Tombol aksi header di halaman (misal: Dashboard) pada layar smartphone ditata proporsional 2 kolom sejajar (`grid grid-cols-2 gap-2.5 w-full sm:w-auto`), jangan biarkan ada tombol ganjil yang melompat sendirian ke bawah.

3. **ENLARGED BOTTOM NAVIGATION BAR (`h-[68px]`)**:
   - Bar navigasi bawah bergaya native app melayang di bagian paling bawah layar smartphone (`fixed bottom-0 inset-x-0 z-30`).
   - Tinggi bar: `68px` dengan latar kaca tembus pandang (*backdrop-blur-md*).
   - Icon navigasi berukuran besar (`size={21}` - `{22}` strokeWidth={2.2}).
   - **Label teks navigasi WAJIB satu kata singkat** (contoh: *Home*, *Kunjungan*, *Laporan*, *Profil*, *Menu*). Hindari frasa 2 kata seperti "Data Kunjungan" yang akan pecah menjadi 2 baris canggung di layar smartphone.
   - Area sentuhan per tombol: `min-h-[50px]` dengan transisi `active:scale-95`.
   - Konten halaman (`main`) wajib memiliki padding bawah `pb-32 lg:pb-6` agar bagian bawah konten dan grafik tidak terhalang oleh Floating Button dan Bottom Bar.

4. **MICRO-ANIMATIONS RINGAN (NATIVE FEEL)**:
   - **Page Transition**: Transisi masuk halaman GPU-accelerated yang ringan (`.animate-page-enter`: `translateY(5px)` + `fade-in` 200ms).
   - **Touch Feedback**: `active:scale-95` atau `active:scale-[0.98]` pada setiap tombol & kartu navigasi.
   - **Live Status Pulse**: Dot status aktif (*Di Dalam Pabrik*) dilengkapi animasi radar kedip lembut (`animate-ping` / `animate-pulse`).
   - **Data Chart Rise**: Batang diagram statistik naik perlahan dengan `transition-all duration-500 ease-out`.

5. **NATIVE BOTTOM SHEET MODAL (PENGGANTI SIDEBAR)**:
   - Tombol ke-5 di Bottom Bar bernama **"Menu"** (ikon `MoreHorizontal`).
   - Ketika ditekan, membuka **Action Sheet / Bottom Sheet** yang meluncur halus dari bawah layar:
     - Indikator tarikan jari (*drag bar*: `w-12 h-1.5 rounded-full mx-auto mb-3`).
     - Kartu identitas pengguna (Avatar, Nama, Role, Departemen).
     - Daftar menu operasional sekunder & administrasi (Master Data, Gateway, Form Tamu Publik, dll).
     - Tombol ganti bahasa & mode gelap/terang.
     - Tombol keluar sistem (*Logout*) bergaya merah kontras.

6. **FLOATING ACTION BUTTON (FAB)**:
   - Tombol aksi utama (misal: Scan Barcode, Transaksi Baru) dibuat melayang melingkar di atas bottom bar:
     - Posisi: `fixed bottom-[82px] right-4 sm:right-6 z-40 lg:hidden flex flex-col items-center`.
     - Tombol: `w-13 h-13 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-700 text-white flex items-center justify-center shadow-xl shadow-brand-600/35 ring-4 ring-white dark:ring-slate-900`.
     - Animasi: `active:scale-90 transition-all duration-150`.
     - Label: teks `"Scan"` kecil tebal di bawah tombol.
     - **Aturan**: Tombol FAB ini **hanya muncul di halaman Dashboard / Home (`/`)**, tidak ditampilkan di halaman sub-menu agar tidak menghalangi konten form/tabel.

---

## 2. Pola Universal: Tabel di Desktop, Card List di Mobile

> [!IMPORTANT]
> **DILARANG menggunakan tabel dengan scroll horizontal sempit di layar smartphone.**
> Setiap halaman yang menampilkan daftar data (Data Tamu, Laporan, Master Data Pengguna/Departemen, Riwayat Log, dll) **WAJIB menyediakan 2 mode render**:
> 1. Mobile Container: `<div className="md:hidden space-y-3">` (Card List)
> 2. Desktop Container: `<div className="hidden md:block overflow-x-auto">` (Table)

### Template Komponen Dual View (Table vs Card):

```jsx
<div className="card overflow-hidden">
  {/* Header Bagian */}
  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
      Daftar Data Kunjungan
    </h2>
    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
      {rows.length} data
    </span>
  </div>

  {/* ================= 1. CARD LIST UNTUK MOBILE (< md) ================= */}
  <div className="md:hidden p-3 space-y-3">
    {rows.length === 0 ? (
      <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
        Belum ada data tersedia.
      </div>
    ) : (
      rows.map((item) => (
        <div
          key={item.id}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5 active:scale-[0.99] transition-transform"
        >
          {/* Header Card: ID / Kode + Status Badge */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
              {item.codeNumber}
            </span>
            <StatusBadge status={item.status} />
          </div>

          {/* Judul Utama & Subjudul */}
          <div>
            <div className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight">
              {item.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {item.subtitle || 'Keterangan tambahan'}
            </div>
          </div>

          {/* Grid Informasi Detail (2 Kolom) */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px]">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                Departemen
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {item.departmentName || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                Penanggung Jawab / PIC
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {item.picName || '-'}
              </span>
            </div>
          </div>

          {/* Footer Card: Tombol Aksi Sentuh Ergonomis */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleDetail(item)}
              className="btn-ghost py-1.5 px-3 text-xs rounded-lg font-bold min-h-[34px]"
            >
              Rincian
            </button>
            <button
              type="button"
              onClick={() => handleEdit(item)}
              className="btn-ghost py-1.5 px-3 text-xs rounded-lg font-bold text-brand-600 dark:text-brand-400 min-h-[34px]"
            >
              Edit
            </button>
          </div>
        </div>
      ))
    )}
  </div>

  {/* ================= 2. TABEL UNTUK DESKTOP (≥ md) ================= */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full">
      <thead className="bg-slate-50 dark:bg-slate-800/80">
        <tr>
          <th className="th">No / Kode</th>
          <th className="th">Nama</th>
          <th className="th">Departemen</th>
          <th className="th">PIC</th>
          <th className="th">Status</th>
          <th className="th text-right">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {rows.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
            <td className="td font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
              {item.codeNumber}
            </td>
            <td className="td font-medium text-slate-900 dark:text-slate-100">{item.title}</td>
            <td className="td text-slate-600 dark:text-slate-400">{item.departmentName}</td>
            <td className="td text-slate-600 dark:text-slate-400">{item.picName}</td>
            <td className="td"><StatusBadge status={item.status} /></td>
            <td className="td text-right">
              <button onClick={() => handleEdit(item)} className="p-1 text-slate-400 hover:text-brand-600">
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 3. Checklist Kualitas Mobile Native

Setiap halaman pada proyek baru harus lulus checklist mobile berikut:
- [ ] Header top bar berukuran `h-16` di mobile dengan logo jelas dan tidak memotong judul.
- [ ] Tidak ada drawer sidebar samping yang muncul di smartphone.
- [ ] Navigasi utama menggunakan Bottom Bar `h-[68px]` dengan touch target `min-h-[50px]`.
- [ ] Menu pendukung/admin dapat dibuka melalui Native Bottom Sheet (`z-50`).
- [ ] Tombol aksi melayang (FAB) berukuran `w-15 h-15` di atas bottom bar hanya pada halaman Home (`z-40`).
- [ ] Semua data list berbentuk kartu vertikal (*Card Layout*) di layar `< md`.
- [ ] Semua tombol aksi lapangan memiliki touch target minimal 42px – 48px.
- [ ] **Modal dialog konfirmasi & alert custom WAJIB menggunakan layer tertinggi `z-[99999]`** agar tidak pernah tertimpa oleh bottom sheet, bottom nav bar, maupun modal form lainnya.
- [ ] Di layar mobile smartphone, tombol konfirmasi dialog ditata vertikal (`flex-col-reverse sm:flex-row`) dengan tinggi minimal 46px agar ergonomis bagi sentuhan satu tangan.

---

## 4. Hirarki Z-Index Bebas Tabrakan (Layering Hierarchy)

| Layer | Nilai Tailwind | Elemen UI |
|---|---|---|
| Konten Halaman | default (`z-0`) | Card, Form, List, Dashboard Grid |
| Sticky Table Header / Filter Bar | `z-10` / `z-20` | Header tabel sticky saat di-scroll |
| Mobile Bottom Bar | `z-30` | Bar navigasi bawah smartphone |
| Floating Action Button (FAB) | `z-40` | Tombol bulat scan mengambang di Home |
| Mobile Bottom Sheet / Modal Form | `z-50` | Action sheet menu, modal detail & edit form |
| Fullscreen Photo Preview | `z-[90]` | Pratinjau KTP/SIM resolusi penuh |
| **Global Confirmation / Alert Dialog** | **`z-[99999]`** | **Pop-up dialog konfirmasi, prompt alasan, pesan error/sukses** |


