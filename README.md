# 🌱 Aetherion — GitHub Contribution Forger

**Aetherion — GitHub Contribution Forger (V2.0)** adalah script Node.js untuk mengisi grafik kontribusi GitHub dengan membuat commit bertanggal lampau (*backdated*) secara otomatis.

Dikembangkan oleh **Aetherion** — penyempurnaan dari proyek [goGreen](https://github.com/fenrir2608/goGreen).

> ⚠️ **Disclaimer**: Tool ini menulis ulang riwayat commit dengan tanggal palsu. GitHub memiliki aturan tentang kontribusi palsu dan dapat menandai (*spam-flag*) akun yang ketahuan melakukannya. Gunakan sepenuhnya atas risiko sendiri — sebaiknya hanya di repository pribadi untuk keperluan eksperimen/edukasi, bukan untuk menipu siapa pun.

## ✨ Fitur

- 🕰️ **3 mode pemalsuan**:
  1. Dari lahirnya Contribution Graph (2013) sampai tahun sekarang
  2. Hanya pada tahun yang kamu pilih
  3. Tanggal sepenuhnya acak (hari, bulan, tahun)
- 🌍 **12 bahasa UI**: English, Indonesia, 中文, 日本語, ไทย, Tiếng Việt, 한국어, Español, Français, Deutsch, العربية, Русский
- ⏳ **Countdown otomatis** (default 5 menit) antar tahun agar sesi Codespaces/VS Code tidak *offline*
- 🔁 **Retry otomatis** untuk commit & push (hingga 3x)
- ⌨️ Mode interaktif maupun non-interaktif (CLI flags / environment variables)

## 📋 Persyaratan

- Node.js 18+ (disarankan versi LTS)
- Git dengan `user.name` & `user.email` yang terkonfigurasi (pakai akun GitHub kamu)

## 🚀 Instalasi

```bash
git clone https://github.com/Swevaga/Hack-GitHub-Contribution.git
cd Hack-GitHub-Contribution
npm install
```

## 🧑‍💻 Penggunaan

Jalankan secara interaktif:

```bash
node index.js
```

Atau non-interaktif (langsung jalan):

```bash
node index.js --lang id --mode 2 --year 2013
node index.js -l en -m 3 -c 200
```

### Opsi CLI

| Opsi | Keterangan |
| --- | --- |
| `-l, --lang <code>` | Bahasa (`en`, `id`, `zh`, `ja`, `th`, `vi`, `ko`, `es`, `fr`, `de`, `ar`, `ru`) |
| `-m, --mode <1\|2\|3>` | Mode: `1` dari 2013, `2` tahun pilihan, `3` acak total |
| `-y, --year <YYYY>` | Tahun untuk mode 2 |
| `-c, --count <n>` | Jumlah commit (menggantikan nilai acak default) |
| `-h, --help` | Tampilkan bantuan |

### Environment variables

| Variabel | Keterangan |
| --- | --- |
| `AETHERION_START_YEAR` | Tahun awal mode 1 (default: `2013`, saat Contribution Graph muncul) |
| `AETHERION_COUNTDOWN` | Jeda detik antar tahun di mode 1 (default: `300`; `0` = nonaktif) |
| `AETHERION_COMMITS` | Jumlah commit (sama dengan `--count`) |

### Penjelasan mode

1. **Dari 2013** — membuat commit untuk setiap tahun dari 2013 hingga tahun sekarang, dengan countdown 5 menit setelah tiap tahun agar sesi tetap aktif.
2. **Tahun pilihan** — membuat commit hanya pada tahun yang kamu tentukan, lalu selesai.
3. **Acak total** — membuat commit pada tanggal yang sepenuhnya acak (hari, bulan, tahun); sulit ditebak.

## 🔧 Cara kerja

1. Script menulis tanggal commit target ke `data.json`.
2. Commit dibuat dengan `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` sesuai tanggal target.
3. Semua commit di-*push* ke `origin` dengan retry otomatis.

## 📁 Struktur proyek

```
├── index.js          # Entry point + parsing argumen CLI
├── data.json         # File yang diubah di setiap commit
├── src/
│   ├── banner.js     # ASCII art pembuka
│   ├── cli.js        # Prompt interaktif (readline)
│   ├── git.js        # Operasi git: commit palsu, push + retry
│   ├── i18n.js       # 12 bahasa UI
│   ├── modes.js      # Implementasi 3 mode
│   └── utils.js      # Helper tanggal acak, sleep, countdown
└── test/
    └── e2e.test.js   # Test end-to-end (sandbox git lokal)
```

## 🧪 Menjalankan tes

```bash
npm test
```

Test end-to-end menjalankan script di dalam sandbox git lokal dengan remote *bare* — tidak menyentuh remote asli sama sekali.

## 🙏 Kredit

- [Akshay Saini](https://github.com/akshaymarch7) — video asli yang menginspirasi proyek ini
- [goGreen](https://github.com/fenrir2608/goGreen) — proyek sumber yang disempurnakan

## 📜 Lisensi

[MIT](LICENSE)
# GitHub-Contribution-Forger
