// src/modes.js
// Tiga mode:
//   1. Dari awal fitur Contribution Graph GitHub (2013) sampai tahun ini,
//      dengan countdown ~5 menit setelah setiap tahun agar sesi tidak offline.
//   2. Hanya pada tahun yang dipilih user.
//   3. Tanggal sepenuhnya acak (hari, bulan, tahun) — sulit ditebak.
//
// Default Mode 1 & 2 memakai strategi "grafik hijau": ~98% hari dalam setahun
// mendapat commit (1-2 commit per hari), sisanya dikosongkan agar terlihat
// natural. Bila user memberikan --count (atau AETHERION_COMMITS), perilaku
// lama dipakai: tepat N commit acak per tahun.

import { createCommit, pushToRemote, randomCommitMessage } from "./git.js";
import { countdown, formatClock, formatIso, greenDaysInYear, randomDateAnywhere, randomDateInYear } from "./utils.js";

/**
 * Menentukan tanggal-tanggal commit untuk satu tahun.
 * countOverride != null → tepat N commit acak (perilaku lama);
 * sebaliknya → strategi "grafik hijau" (~98% hari, 1-2 commit per hari).
 * @param {number} year
 * @param {number|null} countOverride
 * @returns {string[]} tanggal ISO, diurutkan kronologis
 */
function datesForYear(year, countOverride) {
  if (countOverride != null) {
    return Array.from({ length: countOverride }, () => formatIso(randomDateInYear(year)));
  }
  return greenDaysInYear(year).map(formatIso);
}

/**
 * Mode 1 — dari tahun pertama Contribution Graph (2013) hingga tahun sekarang.
 * @param {object} t - translator
 * @param {object} opts { startYear, endYear, countOverride, countdownSeconds }
 */
export async function runMode1(t, opts) {
  const { startYear, endYear, countOverride = null, countdownSeconds } = opts;
  let total = 0;

  for (let year = startYear; year <= endYear; year++) {
    const dates = datesForYear(year, countOverride);
    console.log("\n" + t.make("makingCommits", { year }));

    for (let i = 0; i < dates.length; i++) {
      await createCommit(dates[i], randomCommitMessage());
      console.log(t.make("commitProgress", { done: i + 1, total: dates.length, date: dates[i] }));
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
export async function runMode2(t, { year, countOverride = null }) {
  const dates = datesForYear(year, countOverride);
  console.log("\n" + t.make("makingCommits", { year }));

  for (let i = 0; i < dates.length; i++) {
    await createCommit(dates[i], randomCommitMessage());
    console.log(t.make("commitProgress", { done: i + 1, total: dates.length, date: dates[i] }));
  }

  console.log(t.make("pushing"));
  await pushToRemote();
  console.log(t.make("pushDone"));
  return dates.length;
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
