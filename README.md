<div align="center">
  <h1>🌟 CraXID Temp Mail Bot</h1>
  <p><b>Bot Telegram Penghasil Email Sementara Terintegrasi Cloudflare</b></p>

  <!-- Badges -->
  <a href="https://github.com/craxid/temailbot/stargazers"><img src="https://img.shields.io/github/stars/craxid/temailbot?style=for-the-badge&color=yellow" alt="Stars"></a>
  <a href="https://github.com/craxid/temailbot/network/members"><img src="https://img.shields.io/github/forks/craxid/temailbot?style=for-the-badge&color=blue" alt="Forks"></a>
  <a href="https://github.com/craxid/temailbot/issues"><img src="https://img.shields.io/github/issues/craxid/temailbot?style=for-the-badge&color=red" alt="Issues"></a>
  <a href="https://github.com/craxid/temailbot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/craxid/temailbot?style=for-the-badge&color=success" alt="License"></a>
</div>

<br>

Bot Telegram untuk membuat alamat email sementara (*temp mail*) secara instan dengan masa aktif 2 jam. Terintegrasi langsung dengan **Cloudflare Email Routing** dan **Cloudflare Workers**. Sangat cocok digunakan untuk mendaftar akun sosial media, verifikasi game, bypass OTP, atau sekadar mengurangi spam ke email pribadi kamu.

## 📑 Daftar Isi
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Persyaratan](#-persyaratan-prerequisites)
- [Tutorial Instalasi](#-tutorial-instalasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Cara Kerja Sistem](#-cara-kerja-sistem)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama
- ⚡ **Instan & Acak**: Buat alamat email acak secara otomatis hanya dengan satu kali klik.
- 🗑️ **Auto-Delete 2 Jam**: Bot otomatis menghapus *routing rules* di Cloudflare setelah 2 jam (menghindari penumpukan limit rules).
- 🌐 **Multi-Domain**: Mendukung banyak domain sekaligus dalam satu bot.
- 🚀 **Pesan Real-time**: Email masuk langsung diteruskan ke chat Telegram kamu dalam hitungan detik.
- 💅 **Tampilan Premium**: Format pesan masuk sudah melalui proses *HTML parsing* sehingga rapi dan mudah dibaca (mendukung HTML/Base64/Quoted-Printable).
- 🔋 **Keep-Alive Server**: Dilengkapi server *Express.js* bawaan agar bot mudah di-hosting dan tetap hidup 24/7 di platform seperti Koyeb, Render, VPS, dll.

---

## 💻 Tech Stack
Proyek ini dibangun menggunakan teknologi berikut:
- **[Node.js](https://nodejs.org/)** - *Runtime environment* utama.
- **[node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)** - Library untuk berinteraksi dengan Telegram Bot API.
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - *Serverless function* untuk menerima dan mem-parsing *raw email*.
- **[Express.js](https://expressjs.com/)** - Web server untuk *keep-alive*.
- **[Axios](https://axios-http.com/)** - HTTP Client untuk memanipulasi API Cloudflare.

---

## 📂 Struktur Folder
```text
temailbot/
├── .env.example      # Template file environment (rahasia)
├── bot.js            # Script utama bot Telegram
├── domains.json      # Konfigurasi daftar domain & Zone ID
├── worker.js         # Script Cloudflare Workers (penerima email)
├── package.json      # Dependencies NPM
└── README.md         # Dokumentasi project
```

---

## 🛠️ Persyaratan (*Prerequisites*)
Sebelum memulai instalasi, pastikan kamu telah menyiapkan:
1. **Node.js** (versi 16.x atau lebih baru) terinstal di PC / VPS.
2. Bot Telegram (Buat melalui [@BotFather](https://t.me/BotFather) dan simpan *Bot Token*-nya).
3. Akun **Cloudflare** dengan minimal 1 domain yang sudah aktif dan mengarah ke nameserver Cloudflare.
4. **Cloudflare API Token** (Pastikan token memiliki izin/permissions untuk `Zone.Zone Settings`, `Zone.Zone`, dan `Zone.Email Routing`).

---

## 🚀 Tutorial Instalasi

### 1. Clone Repository & Install Dependencies
Buka terminal/CMD, lalu jalankan perintah berikut:
```bash
git clone https://github.com/craxid/temailbot.git
cd temailbot
npm install
```

### 2. Setup Konfigurasi `.env`
Keamanan adalah yang utama. Jangan pernah menaruh token langsung di dalam kode. Copy file `.env.example` yang sudah disediakan dan ubah namanya menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` tersebut dan isi dengan data rahasia kamu:
```env
PORT=3000
BOT_TOKEN=ISI_DENGAN_TOKEN_BOT_KAMU
CF_TOKEN=ISI_DENGAN_API_TOKEN_CLOUDFLARE_KAMU
```

### 3. Setup File `domains.json`
Edit file `domains.json` dan ganti dengan daftar domain serta *Zone ID* Cloudflare milik kamu. Status bisa diatur ke `"OFFLINE"` jika sedang perbaikan.
```json
[
    { "name": "domain-kamu.com", "zone": "ISI_ZONE_ID_CLOUDFLARE_1", "status": "ONLINE" },
    { "name": "domain-lain.net", "zone": "ISI_ZONE_ID_CLOUDFLARE_2", "status": "ONLINE" }
]
```

### 4. Setup Cloudflare Workers (Penerima Email)
Bot ini membutuhkan Cloudflare Workers untuk menangkap *raw email* masuk dan mengirimkannya ke Telegram kamu.
1. Buka dashboard Cloudflare, navigasi ke menu **Workers & Pages** > **Create Worker**.
2. Beri nama worker kamu (misal: `temail`).
3. Copy semua isi file `worker.js` dari repositori ini, lalu *paste* ke dalam code editor Worker.
4. Masuk ke menu **Settings > Variables & Secrets** di setelan Worker tersebut.
5. Tambahkan dua variabel rahasia (*Encrypted*):
   - `BOT_TOKEN` : *(Isi dengan token bot Telegram)*
   - `CF_TOKEN` : *(Isi dengan API token Cloudflare)*
6. Sesuaikan variabel array `zones` di dalam kode `worker.js` dengan kumpulan *Zone ID* kamu, lalu klik **Deploy**.

> **⚠️ Penting:** Pastikan fitur **Email Routing** pada tab *Email* di domain kamu sudah diaktifkan di dashboard Cloudflare.

### 5. Jalankan Bot!
Jalankan bot melalui terminal PC atau VPS kamu:
```bash
node bot.js
```
*(Untuk penggunaan di VPS, sangat disarankan menggunakan `pm2` agar bot tetap hidup di latar belakang: `pm2 start bot.js --name "temailbot"`).*

---

## 📱 Cara Penggunaan
1. Buka bot kamu di Telegram.
2. Ketik perintah `/start`.
3. Bot akan memunculkan *Inline Keyboard* berisi daftar domain yang tersedia.
4. Klik salah satu domain, dan bot akan langsung merespons dengan alamat email sementara kamu.
5. Gunakan email tersebut. Pesan yang masuk akan otomatis diteruskan oleh bot ke chat kamu!

---

## 📸 Cara Kerja Sistem
1. User mengklik tombol domain di antarmuka Telegram.
2. `bot.js` mengeksekusi request ke API Cloudflare untuk membuat *Custom Address Routing* sementara dengan *Catch-All* mengarah ke Worker Cloudflare.
3. Saat ada pihak luar mengirim email, Cloudflare meneruskannya ke `worker.js`.
4. `worker.js` mem-parsing isi pesan (membuang tag HTML tak penting & *decode base64*), mencocokkan *rule* untuk mendapatkan `chat_id` user, lalu menembak API Telegram.
5. Setelah 2 jam (*timeout* internal Node.js), bot menghapus aturan (*rule*) tersebut dari Cloudflare.

---

## 🤝 Kontribusi
Ingin berkontribusi pada proyek ini? Sangat dipersilakan!
1. Lakukan *Fork* pada repositori ini.
2. Buat *branch* fitur kamu (`git checkout -b fitur-keren-kamu`).
3. Lakukan *Commit* perubahan kamu (`git commit -m 'Menambahkan fitur keren'`).
4. Lakukan *Push* ke branch tersebut (`git push origin fitur-keren-kamu`).
5. Buka sebuah *Pull Request*.

---

## ⚠️ Disclaimer
Bot ini dibuat semata-mata untuk **tujuan edukasi** dan kemudahan akses *temporary mail* pribadi. Pengembang tidak bertanggung jawab atas penyalahgunaan layanan ini untuk aktivitas spam, ilegal, penipuan, atau melanggar ketentuan hukum (TOS) pihak ketiga mana pun.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.

<br>
<p align="center"><b>Dibuat dengan ☕ oleh <a href="https://github.com/craxid">CraXID</a></b></p>
