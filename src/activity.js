// src/activity.js
// Simulasi aktivitas manusia selama countdown antar tahun (default 1,5 jam):
// - membuat file acak dengan nama aneh,
// - "mengetik" artikel berita panjang dengan pola realistis manusia
//   (kecepatan ketik dengan jitter, jeda berpikir, typo yang dikoreksi),
// - setelah selesai, file dihapus agar direktori kerja kembali bersih,
// diulang sampai countdown habis.
//
// Tujuan: menjaga sesi Codespaces / VS Code tetap aktif dan menghindari
// pola aktivitas yang terlihat seperti bot (pencegahan deteksi GitHub).

import fs from "node:fs";
import path from "node:path";
import random from "random";
import { sleep } from "./utils.js";

const pick = (arr) => arr[random.int(0, arr.length - 1)];

// ---------------------------------------------------------------------------
// Nama file acak yang "aneh"
// ---------------------------------------------------------------------------

const NAME_A = [
  "quantum", "lunar", "solar", "nebula", "vortex", "cipher", "drift",
  "ember", "frost", "pulse", "orbit", "chaos", "mirage", "spark",
  "echo", "delta", "zenith", "halo", "prism", "flux",
];
const NAME_B = [
  "notes", "draft", "sketch", "log", "journal", "memo", "scrap",
  "ledger", "chronicle", "fragment", "scratch", "outline",
];
const EXTENSIONS = ["txt", "md", "log", "notes", "tmp", "draft", "bak"];

/** Nama file acak seperti: "quantum-notes-8392.log" */
export function randomFileName() {
  return `${pick(NAME_A)}-${pick(NAME_B)}-${random.int(1000, 9999)}.${pick(EXTENSIONS)}`;
}

// ---------------------------------------------------------------------------
// Generator artikel berita (panjang, ala berita sungguhan)
// ---------------------------------------------------------------------------

const NAMES = [
  "Ardi", "Sari", "Budi", "Dewi", "Rina", "Agus", "Putri", "Fajar",
  "Laras", "Dimas", "Indah", "Rizky", "Santi", "Bayu", "Maya", "Eko",
];
const CITIES = [
  "Jakarta", "Bandung", "Surabaya", "Medan", "Semarang", "Makassar",
  "Yogyakarta", "Denpasar", "Balikpapan", "Palembang",
];
const ORGS = [
  "Kementerian Koordinator Bidang Perekonomian", "Dinas Perhubungan",
  "Badan Pengawas Keuangan", "Universitas Indonesia", "Asosiasi Pengusaha Muda",
  "Otoritas Jasa Keuangan", "Pemerintah Provinsi Jawa Barat", "Dewan Riset Nasional",
];
const ROLES = [
  "kepala biro komunikasi", "juru bicara", "direktur eksekutif",
  "koordinator lapangan", "peneliti utama", "sekretaris jenderal",
];
const TOPICS = [
  "energi terbarukan", "digitalisasi layanan publik", "transportasi umum massal",
  "keamanan siber", "ekonomi kreatif", "ketahanan pangan", "pendidikan vokasi",
  "pariwisata berkelanjutan", "infrastruktur digital", "pemberdayaan UMKM",
];
const ACTION_VERBS = [
  "mengumumkan", "meluncurkan", "menandatangani", "mempercepat",
  "mengevaluasi", "meresmikan", "mengawal", "mendukung",
];
const CONNECTORS = [
  "Sementara itu,", "Di sisi lain,", "Sebelumnya,", "Dalam keterangan resminya,",
  "Terkait hal tersebut,", "Menurut laporan terbaru,", "Tak hanya itu,",
  "Sementara proses tersebut berjalan,",
];
const QUOTE_FRAGMENTS = [
  "Kami berkomitmen menyelesaikan seluruh tahapan sesuai jadwal",
  "Ini merupakan langkah awal dari program jangka panjang",
  "Kami membuka ruang partisipasi seluas-luasnya bagi masyarakat",
  "Hasil evaluasi akan menjadi dasar penyusunan kebijakan berikutnya",
  "Kami optimistis target dapat tercapai pada akhir tahun",
  "Seluruh pemangku kepentingan dilibatkan dalam proses ini",
];

/** Satu kalimat berita acak. */
function sentence() {
  const r = random.float();
  if (r < 0.3) {
    return `${pick(ORGS)} ${pick(ACTION_VERBS)} program ${pick(TOPICS)} di ${pick(CITIES)} pada kuartal mendatang.`;
  }
  if (r < 0.55) {
    return `"${pick(QUOTE_FRAGMENTS)}", ujar ${pick(NAMES)}, ${pick(ROLES)} ${pick(ORGS).toLowerCase()}, dalam jumpa pers di ${pick(CITIES)}.`;
  }
  if (r < 0.75) {
    return `${pick(CITIES)} mencatat peningkatan ${random.int(12, 98)} persen pada sektor ${pick(TOPICS)} dibanding periode sebelumnya.`;
  }
  if (r < 0.9) {
    return `${pick(CONNECTORS)} pemerintah menyiapkan anggaran tambahan sebesar ${random.int(5, 95)} triliun rupiah untuk mendukung program ini.`;
  }
  return `Masyarakat setempat menyambut positif langkah ${pick(ORGS).toLowerCase()} yang dinilai lebih responsif terhadap kebutuhan warga.`;
}

/** Satu paragraf berita (3-5 kalimat). */
function paragraph() {
  const count = random.int(3, 5);
  const sentences = [];
  for (let i = 0; i < count; i++) sentences.push(sentence());
  return sentences.join(" ");
}

/** Artikel berita panjang: judul + 6-10 paragraf. */
export function generateNewsArticle() {
  const topic = pick(TOPICS);
  const title = `${pick(ORGS)} Dorong ${topic} hingga ${random.int(20, 99)} Persen pada Tahun Depan`;
  const body = [];
  const paragraphs = random.int(6, 10);
  for (let i = 0; i < paragraphs; i++) body.push(paragraph());
  return `# ${title}\n\n${body.join("\n\n")}\n`;
}

// ---------------------------------------------------------------------------
// Simulasi mengetik
// ---------------------------------------------------------------------------

/**
 * Menjalankan simulasi aktivitas manusia selama `seconds` detik.
 * Setiap detik memanggil `render(remaining, fileName)` (fileName = null saat
 * tidak sedang mengetik apa pun). Saat selesai, direktori dijamin bersih
 * kembali (file aktivitas dihapus).
 *
 * @param {number} seconds - lama simulasi (detik)
 * @param {(remaining: number, file: string|null) => void} render
 * @param {object} [opts]
 * @param {string} [opts.dir="."] - direktori tempat file aktivitas dibuat
 */
export async function simulateHumanActivity(seconds, render, opts = {}) {
  const dir = opts.dir || ".";
  const started = Date.now();
  const deadline = started + seconds * 1000;
  let remaining = seconds;
  let nextTickAt = started + 1000;
  let file = null;
  let text = "";
  let article = "";
  let articlePos = 0;

  const now = () => Date.now();

  const tick = () => {
    const r = Math.max(0, Math.ceil((deadline - now()) / 1000));
    if (r !== remaining) {
      remaining = r;
      render(remaining, file);
    }
  };

  const writeFile = () => {
    fs.writeFileSync(path.join(dir, file), text, "utf8");
  };

  const openNewFile = () => {
    file = randomFileName();
    text = "";
    article = generateNewsArticle();
    articlePos = 0;
    writeFile();
  };

  const closeFile = () => {
    if (!file) return;
    try {
      fs.unlinkSync(path.join(dir, file));
    } catch {
      // file mungkin sudah tidak ada — abaikan
    }
    file = null;
    text = "";
    article = "";
    articlePos = 0;
  };

  while (now() < deadline) {
    tick();

    if (!file) {
      openNewFile();
      await sleep(random.int(600, 2000)); // jeda "membuka editor baru"
      continue;
    }

    // Ketik 1-3 karakter dengan kecepatan realistis.
    const chunk = article.slice(articlePos, articlePos + random.int(1, 3));
    text += chunk;
    articlePos += chunk.length;
    writeFile();

    // Kadang "salah ketik" lalu dikoreksi (seperti backspace manusia).
    if (random.float() < 0.02 && articlePos > 10) {
      const back = random.int(2, 6);
      articlePos = Math.max(0, articlePos - back);
      text = text.slice(0, Math.max(0, text.length - back));
      writeFile();
      await sleep(random.int(300, 900));
    }

    // Artikel selesai → jeda "membaca ulang", lalu hapus file.
    if (articlePos >= article.length) {
      await sleep(random.int(2000, 5000));
      closeFile();
      await sleep(random.int(1500, 4000)); // jeda sebelum file berikutnya
      continue;
    }

    // Jeda antar ketikan: sering pendek, kadang "berpikir" agak lama.
    await sleep(random.int(40, 160));
    if (random.float() < 0.04) {
      await sleep(random.int(1500, 6000));
    }

    if (now() >= nextTickAt) {
      nextTickAt += 1000;
      tick();
    }
  }

  // Pastikan direktori kembali bersih saat countdown selesai.
  closeFile();
  render(Math.max(0, remaining), null);
  process.stdout.write("\n");
}
