/**
 * Formatted Excel (.xls/.xlsx) export utility for PT Cemindo Gemilang Tbk - Plant Batam
 * Complies with Tahap 11 Specifications:
 * Columns:
 * 1. Nomor Registrasi
 * 2. Nama Tamu
 * 3. Perusahaan
 * 4. Nomor WhatsApp
 * 5. Department
 * 6. Nama PIC
 * 7. Keperluan Kunjungan
 * 8. Tanggal Kunjungan
 * 9. Waktu Check-in
 * 10. Waktu Check-out
 * 11. Durasi Kunjungan
 * 12. Nama Security Check-in
 * 13. Nama Security Check-out
 * 14. Status Kunjungan
 */
export function exportToExcel(visits, filename = 'Laporan_Kunjungan_VMS_Plant_Batam') {
  if (!visits || visits.length === 0) {
    alert('Tidak ada data kunjungan untuk diekspor ke Excel.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan Kunjungan Tamu</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        .company-header { font-size: 16pt; font-weight: bold; color: #b91c1c; }
        .sub-header { font-size: 12pt; font-weight: bold; color: #1e293b; }
        .meta-info { font-size: 9pt; color: #64748b; }
        th { background-color: #991b1b; color: #ffffff; font-weight: bold; text-align: center; vertical-align: middle; padding: 10px 8px; border: 1px solid #7f1d1d; }
        td { padding: 7px 10px; border: 1px solid #cbd5e1; vertical-align: middle; }
        .text-center { text-align: center; }
        .font-mono { font-family: Consolas, monospace; }
        .bold { font-weight: bold; }
        .status-checkedin { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
        .status-checkedout { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
        .status-approved { background-color: #dbeafe; color: #1d4ed8; font-weight: bold; text-align: center; }
        .status-pending { background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center; }
        .status-rejected { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
        .status-cancelled { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="15" class="company-header">PT CEMINDO GEMILANG TBK – PLANT BATAM</td>
        </tr>
        <tr>
          <td colspan="15" class="sub-header">LAPORAN REKAPITULASI KUNJUNGAN TAMU (VISITOR MANAGEMENT SYSTEM)</td>
        </tr>
        <tr>
          <td colspan="15" class="meta-info">Tanggal Ekspor: ${dateStr} pk ${timeStr} WIB | Total Catatan: ${visits.length} Kunjungan</td>
        </tr>
        <tr><td colspan="15"></td></tr>
        <thead>
          <tr>
            <th>No</th>
            <th>Nomor Registrasi</th>
            <th>Nama Tamu</th>
            <th>Perusahaan</th>
            <th>Nomor WhatsApp</th>
            <th>Department</th>
            <th>Nama PIC</th>
            <th>Keperluan Kunjungan</th>
            <th>Jenis Kunjungan</th>
            <th>Tanggal Kunjungan</th>
            <th>Waktu Check-In</th>
            <th>Waktu Check-Out</th>
            <th>Durasi Kunjungan</th>
            <th>Security Check-In</th>
            <th>Security Check-Out</th>
            <th>Status Kunjungan</th>
          </tr>
        </thead>
        <tbody>
  `;

  visits.forEach((v, idx) => {
    // Format times and calculate duration
    const expDate = v.expectedDate ? new Date(v.expectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
    const inTime = v.checkInTime ? new Date(v.checkInTime).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const outTime = v.checkOutTime ? new Date(v.checkOutTime).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

    let duration = v.durationFormatted || '-';
    if (v.checkInTime) {
      const start = new Date(v.checkInTime);
      const end = v.checkOutTime ? new Date(v.checkOutTime) : (v.status === 'CHECKED_IN' ? new Date() : null);
      if (end) {
        const diffMs = Math.max(0, end - start);
        const mins = Math.floor(diffMs / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        duration = `${h}j ${m}m ${v.status === 'CHECKED_IN' ? '(On-Site)' : ''}`;
      }
    }

    const statusClass = (v.status || '').toLowerCase().replace(/_/g, '');

    tableHtml += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="font-mono bold text-center">${v.visitCode || '-'}</td>
        <td class="bold">${v.fullName || '-'}</td>
        <td>${v.company || '-'}</td>
        <td style="mso-number-format:'\\@';">${v.phoneNumber || '-'}</td>
        <td>${v.destinationDepartment?.name || '-'}</td>
        <td>${v.hostNameManual || v.host?.name || '-'}</td>
        <td>${v.purpose || '-'}</td>
        <td class="text-center">${v.visitType === 'WALK_IN' ? 'Walk-In' : 'Pre-Registered'}</td>
        <td class="text-center">${expDate}</td>
        <td class="text-center">${inTime}</td>
        <td class="text-center">${outTime}</td>
        <td class="text-center">${duration}</td>
        <td>${v.securityCheckInBy?.name || '-'}</td>
        <td>${v.securityCheckOutBy?.name || '-'}</td>
        <td class="status-${statusClass}">${v.status || '-'}</td>
      </tr>
    `;
  });

  tableHtml += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

