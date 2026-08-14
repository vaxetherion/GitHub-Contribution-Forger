// src/utils.js
// Helper: tanggal acak, sleep, countdown untuk menjaga sesi tetap aktif.

import random from "random";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tanggal acak dalam satu tahun kalender (waktu lokal), tidak pernah di masa depan.
 * @param {number} year
 * @param {Date} [now]
 */
export function randomDateInYear(year, now = new Date()) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const month = random.int(0, 11);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = random.int(1, daysInMonth);
    const date = new Date(year, month, day, random.int(0, 23), random.int(0, 59), random.int(0, 59));
    if (year === now.getFullYear() && date > now) continue;
    return date;
  }
  // Fallback: kemarin, supaya tidak pernah di masa depan.
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

/**
 * Tanggal acak di mana saja antara minYear dan tahun sekarang.
 * @param {number} minYear
 * @param {Date} [now]
 */
export function randomDateAnywhere(minYear, now = new Date()) {
  const year = random.int(minYear, now.getFullYear());
  return randomDateInYear(year, now);
}

/**
 * Daftar tanggal untuk strategi "grafik hijau": ~coverage% hari dalam setahun
 * mendapat commit (1-2 commit per hari), sisanya sengaja dikosongkan agar
 * grafik terlihat natural (98% hijau, bukan 100% palsu).
 *
 * @param {number} year
 * @param {object} [opts]
 * @param {number} [opts.coverage=0.98] - proporsi hari yang harus hijau (0..1)
 * @param {number} [opts.secondCommitChance=0.4] - peluang hari hijau mendapat commit kedua
 * @param {Date} [opts.now] - patokan waktu (default: sekarang)
 * @returns {Date[]} tanggal commit, diurutkan kronologis, tidak pernah di masa depan
 */
export function greenDaysInYear(year, opts = {}) {
  const { coverage = 0.98, secondCommitChance = 0.4, now = new Date() } = opts;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const end = year === now.getFullYear() ? now : yearEnd;
  if (end <= yearStart) return [];

  const DAY_MS = 24 * 60 * 60 * 1000;
  // Ceil: bila end = tengah hari (tahun berjalan) → hari ke-N; bila end = tengah malam
  // tahun berikutnya → tepat jumlah hari kalender (365/366).
  const totalDays = Math.ceil((end.getTime() - yearStart.getTime()) / DAY_MS);
  const skipCount = Math.min(totalDays - 1, Math.round(totalDays * (1 - coverage)));

  // Pilih hari mana saja yang dikosongkan (acak, tanpa pengulangan).
  const indices = Array.from({ length: totalDays }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = random.int(0, i);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const skipped = new Set(indices.slice(0, skipCount));

  const clampToNow = (d) => {
    if (d > now) d.setTime(now.getTime() - 1000); // hari ini: jangan pernah di masa depan
    return d;
  };

  const dates = [];
  for (let i = 0; i < totalDays; i++) {
    if (skipped.has(i)) continue;
    // Konstruksi lewat kalender (bukan ms) agar aman dari pergeseran DST.
    const d = new Date(year, 0, 1 + i);
    d.setHours(random.int(0, 23), random.int(0, 59), random.int(0, 59), 0);
    dates.push(clampToNow(d));

    if (random.float() < secondCommitChance) {
      const d2 = new Date(d);
      d2.setHours(random.int(0, 23), random.int(0, 59), random.int(0, 59), 0);
      dates.push(clampToNow(d2));
    }
  }
  dates.sort((a, b) => a - b); // urut kronologis, termasuk 2 commit pada hari yang sama
  return dates;
}

/** Format tanggal lokal menjadi string ISO seperti yang diterima git. */
export function formatIso(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/** Format detik menjadi "MM:SS". */
export function formatClock(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Countdown yang mencetak satu baris setiap detik (update di tempat).
 * Digunakan untuk mencegah Codespaces / VS Code offline saat sesi idle.
 * @param {number} seconds
 * @param {(remaining: number) => string} render - fungsi untuk membuat teks tiap detik
 */
export async function countdown(seconds, render) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  for (let remaining = seconds; remaining > 0; remaining--) {
    process.stdout.write("\r\x1b[K" + render(remaining));
    await sleep(1000);
  }
  process.stdout.write("\n");
}
