// src/modes.js
// Tiga mode:
//   1. Dari awal fitur Contribution Graph GitHub (2013) sampai tahun ini,
//      dengan countdown ~5 menit setelah setiap tahun agar sesi tidak offline.
//   2. Hanya pada tahun yang dipilih user.
//   3. Tanggal sepenuhnya acak (hari, bulan, tahun) — sulit ditebak.

import { createCommit, pushToRemote, randomCommitMessage } from "./git.js";
import { countdown, formatClock, formatIso, randomDateAnywhere, randomDateInYear } from "./utils.js";

/**
 * Mode 1 — dari tahun pertama Contribution Graph (2013) hingga tahun sekarang.
 * @param {object} t - translator
 * @param {object} opts { startYear, endYear, commitsPerYear, countdownSeconds, onYearStart }
 */
export async function runMode1(t, opts) {
  const { startYear, endYear, commitsPerYear, countdownSeconds } = opts;
  let total = 0;

  for (let year = startYear; year <= endYear; year++) {
    const count = typeof commitsPerYear === "function" ? commitsPerYear() : commitsPerYear;
    console.log("\n" + t.make("makingCommits", { year }));

    for (let i = 0; i < count; i++) {
      const date = formatIso(randomDateInYear(year));
      await createCommit(date, randomCommitMessage());
      console.log(t.make("commitProgress", { done: i + 1, total: count, date }));
      total++;
    }

    console.log(t.make("pushing"));
    await pushToRemote();
    console.log(t.make("pushDone"));

    const nextYear = year + 1;
    if (nextYear <= endYear && countdownSeconds > 0) {
      console.log(""); // jeda sebelum countdown
      await countdown(countdownSeconds, (remaining) =>
        t.make("countdownMsg", { time: formatClock(remaining), year: nextYear })
      );
    }
  }

  return total;
}

/**
 * Mode 2 — hanya tahun yang dipilih user.
 */
export async function runMode2(t, { year, commitsPerYear }) {
  const count = typeof commitsPerYear === "function" ? commitsPerYear() : commitsPerYear;
  console.log("\n" + t.make("makingCommits", { year }));

  for (let i = 0; i < count; i++) {
    const date = formatIso(randomDateInYear(year));
    await createCommit(date, randomCommitMessage());
    console.log(t.make("commitProgress", { done: i + 1, total: count, date }));
  }

  console.log(t.make("pushing"));
  await pushToRemote();
  console.log(t.make("pushDone"));
  return count;
}

/**
 * Mode 3 — tanggal, bulan, dan tahun semuanya acak.
 */
export async function runMode3(t, { minYear, commitsPerYear }) {
  const count = typeof commitsPerYear === "function" ? commitsPerYear() : commitsPerYear;
  console.log("\n" + t.make("makingCommits", { year: `${minYear}-${new Date().getFullYear()}` }));

  for (let i = 0; i < count; i++) {
    const date = formatIso(randomDateAnywhere(minYear));
    await createCommit(date, randomCommitMessage());
    console.log(t.make("commitProgress", { done: i + 1, total: count, date }));
  }

  console.log(t.make("pushing"));
  await pushToRemote();
  console.log(t.make("pushDone"));
  return count;
}
