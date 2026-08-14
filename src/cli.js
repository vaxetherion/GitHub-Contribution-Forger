// src/cli.js
// Prompt interaktif (readline) untuk pemilihan bahasa, mode, dan tahun.
// Bekerja di dua mode input:
//   - TTY asli        : readline/promises biasa (echo + line editing).
//   - stdin piped     : seluruh baris diantrekan, tidak ada baris yang hilang
//                       (readline question() kehilangan baris yang datang sekaligus).

import { createInterface } from "node:readline/promises";
import process from "node:process";

const isTTY = Boolean(process.stdin.isTTY);

let ttyRl = null;

function getTtyRl() {
  if (!ttyRl) {
    ttyRl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  }
  return ttyRl;
}

/** Menutup interface readline (dipanggil sekali di akhir main). */
export function closePrompter() {
  if (ttyRl) {
    ttyRl.close();
    ttyRl = null;
  }
}

// ---- Antrean baris untuk stdin piped ----
const piped = { queue: [], done: false, waiters: [] };
let pipedInitialized = false;

function initPiped() {
  if (pipedInitialized) return;
  pipedInitialized = true;
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  rl.on("line", (line) => {
    piped.queue.push(line);
    if (piped.waiters.length) piped.waiters.shift()(line);
  });
  rl.on("close", () => {
    piped.done = true;
    while (piped.waiters.length) piped.waiters.shift()("");
  });
}

/** Menanyakan satu pertanyaan. */
export async function askQuestion(prompt) {
  if (isTTY) return getTtyRl().question(prompt);

  initPiped();
  process.stdout.write(prompt + "\n");
  if (piped.queue.length) return piped.queue.shift();
  if (piped.done) return "";
  return new Promise((resolve) => piped.waiters.push(resolve));
}

/**
 * Loop "pilih angka dari daftar" sampai input valid.
 * Bila input habis (bukan TTY) dan jawaban kosong, lempar error agar tidak hang.
 * @param {object} t - translator
 * @param {string} prompt
 * @param {number} max - jumlah pilihan (1..max)
 */
export async function pickNumber(t, prompt, max) {
  for (;;) {
    const answer = await askQuestion(prompt);
    const n = Number((answer || "").trim());
    if (Number.isInteger(n) && n >= 1 && n <= max) return n;
    if (!isTTY && (answer === undefined || String(answer).trim() === "")) {
      throw new Error("Missing interactive input (stdin ended).");
    }
    console.log(t.invalidInput);
  }
}
