# Dora Foodventure: Misi Bekal Sihat

Prototaip PWA Bahasa Melayu Tahun 3 dengan:
- 5 misi interaktif
- audio Bahasa Melayu (suara sistem sebagai sandaran)
- sokongan fail audio MP3/WAV melalui `audioUrl`
- rakaman suara murid menggunakan mikrofon
- Mod Mesra Saya
- Mod Guru tanpa coding
- import / eksport JSON
- offline cache asas melalui service worker

## Jalankan secara tempatan
Jangan buka `index.html` terus melalui `file://` kerana `fetch`, service worker dan mikrofon mungkin disekat.

Cara mudah:
```bash
python -m http.server 8000
```
Kemudian buka:
`http://localhost:8000`

## Deploy ke GitHub Pages
1. Muat naik semua fail dalam folder ini ke repository GitHub.
2. Settings > Pages.
3. Source: Deploy from a branch.
4. Branch: `main`, folder `/root`.
5. Save.
6. Buka URL GitHub Pages yang diberikan.

## Audio Bahasa Melayu standard
Untuk hasil paling konsisten, rakam atau sediakan fail MP3/WAV dengan sebutan Bahasa Melayu standard.
Letakkan fail contohnya:
`assets/audio/misi1.mp3`

Kemudian dalam Mod Guru, isi `Fail audio (URL/path)` dengan:
`assets/audio/misi1.mp3`

Jika tiada fail audio, aplikasi menggunakan `SpeechSynthesis` dengan `ms-MY` jika suara tersebut tersedia pada peranti.

## Nota hak cipta
Jika projek hendak diterbitkan secara terbuka atau dikomersialkan, gunakan watak pengembara asli dan aset yang anda miliki/berlesen, bukan aset rasmi Dora.
