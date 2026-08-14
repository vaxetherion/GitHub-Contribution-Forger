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
