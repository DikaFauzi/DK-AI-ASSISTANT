# DK AI — Chat Portfolio App

Aplikasi AI chat berbasis web menggunakan **Claude API (Anthropic)**.  
Dibangun sebagai proyek portofolio Teknik Informatika dengan UI clean minimal modern.

---

## Fitur

- 💬 Chat real-time dengan Claude AI
- ✨ Streaming text effect saat AI menjawab
- 🗂 Riwayat percakapan di sidebar
- 💡 Suggestion chips untuk memulai
- 📤 Export chat ke file `.txt`
- ⚙ Settings modal (API key, nama, system prompt)
- 🌙 Dark mode otomatis (ikut sistem)
- ⌨ Keyboard shortcut (`Ctrl+K` new chat, `Ctrl+,` settings)
- 📱 Responsive — tampil baik di mobile

---

## Teknologi

| Layer      | Teknologi                          |
|------------|------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript    |
| AI Model   | Claude claude-sonnet-4-6 (Anthropic)       |
| Icons      | Tabler Icons (CDN)                 |
| Font       | Inter (Google Fonts)               |
| Deploy     | GitHub Pages / Netlify / Vercel    |

---

## Cara Pakai

### 1. Clone / Download

```bash
git clone https://github.com/username/dk-ai.git
cd dk-ai
```

### 2. Buka di browser

Cukup buka file `index.html` langsung di browser — tidak perlu server.

### 3. Masukkan API Key

1. Klik ikon ⚙ di pojok kiri bawah
2. Masukkan API key dari [console.anthropic.com](https://console.anthropic.com)
3. Klik **Simpan**

> API key disimpan di `localStorage` browser — tidak dikirim ke server manapun selain Anthropic.

---

## Deploy ke GitHub Pages

```bash
git init
git add .
git commit -m "init: DK AI chat app"
git remote add origin https://github.com/username/dk-ai.git
git push -u origin main
```

Kemudian aktifkan **GitHub Pages** di Settings repo → Pages → Source: `main / root`.

URL akan tersedia di: `https://username.github.io/dk-ai`

---

## Struktur Project

```
dk-ai/
├── index.html        ← Halaman utama
├── css/
│   └── style.css     ← Semua styling
├── js/
│   └── app.js        ← Logic chat + API
└── README.md
```

---

## Keyboard Shortcuts

| Shortcut       | Aksi           |
|----------------|----------------|
| `Ctrl + K`     | New chat       |
| `Ctrl + ,`     | Buka settings  |
| `Enter`        | Kirim pesan    |
| `Shift + Enter`| Baris baru     |
| `Esc`          | Tutup modal    |

---

## Lisensi

MIT — bebas digunakan untuk portofolio.

---

> Dibuat dengan ❤ sebagai portofolio Teknik Informatika · DK AI
