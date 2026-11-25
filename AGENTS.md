# Antigravity Agent Guidelines for VMS (Visitor Management System)

## Standard Post-Task Workflow
Setiap kali selesai mengerjakan atau memodifikasi fitur/bugfix pada proyek ini:

1. **Verifikasi & Build Lokal**:
   - Uji perubahan dan build lokal (`npm run build` untuk frontend / verifikasi route backend).
   - Rebuild dan verifikasi kontainer local Docker jika diperlukan (`docker compose up -d --build backend app`).

2. **Commit & Push ke GitHub**:
   - Stage berkas terkait (`git add <files>`).
   - Buat pesan commit deskriptif dengan format Conventional Commits (`feat:`, `fix:`, dll).
   - Lakukan `git push origin main` ke repositori `https://github.com/bmbngfriadi/vms.git`.

3. **Panduan Update di Server**:
   - Di akhir setiap respon pengerjaan tugas, selalu sertakan panduan perintah untuk menarik update di server:
     ```bash
     git pull origin main && docker compose up -d --build backend app
     ```
   - Sertakan catatan khusus bila terdapat penyesuaian file `.env`, dependensi baru, atau migrasi database (`npx prisma db push`).
