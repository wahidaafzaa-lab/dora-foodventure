# Dora Foodventure 3D V2

Versi penuh dengan visual 3D, 5 misi, Mod Guru, Mod Mesra Saya, audio ms-MY, import/eksport JSON, rakaman suara dan PWA.

## Fail utama
- index.html
- style.css
- app.js
- content.json
- manifest.json
- service-worker.js
- assets/

## Deploy GitHub Pages
1. Upload **semua fail dan folder** dalam projek ini ke root repository.
2. GitHub > Settings > Pages.
3. Source: Deploy from a branch.
4. Branch: main.
5. Folder: /(root).
6. Save dan tunggu beberapa minit.

## Penting
Jika anda menggantikan fail tetapi laman masih menunjukkan versi lama:
- buka Incognito, atau
- clear site data, atau
- ubah nama cache dalam service-worker.js.

## Audio BM standard
Aplikasi menggunakan SpeechSynthesis dengan kod `ms-MY` sebagai sandaran.
Untuk suara paling konsisten, masukkan fail rakaman MP3/WAV bagi setiap misi melalui Mod Guru.

## Mod Guru
Guru boleh ubah:
- tajuk
- ayat
- arahan
- jenis misi
- pilihan jawapan
- imej
- audio
- latar
- markah lulus
tanpa mengubah fungsi utama permainan.
