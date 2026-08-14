// test/utils.test.js
// Unit test untuk strategi "grafik hijau" (greenDaysInYear):
// ~98% hari dalam setahun mendapat commit, 1-2 commit per hari,
// dan tidak pernah ada tanggal di masa depan.

import { test } from "node:test";
import assert from "node:assert/strict";
import { greenDaysInYear } from "../src/utils.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

test("greenDaysInYear: ~98% hari dalam setahun, 1-2 commit per hari", () => {
  const year = 2024; // tahun kabisat: 366 hari
  const dates = greenDaysInYear(year);

  const perDay = new Map();
  for (const d of dates) {
    assert.equal(d.getFullYear(), year, `Tanggal di luar tahun ${year}: ${d.toISOString()}`);
    const key = dayKey(d);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  // Setiap hari yang hijau hanya boleh 1 atau 2 commit
  for (const [key, count] of perDay) {
    assert.ok(count === 1 || count === 2, `Hari ${key} mendapat ${count} commit`);
  }

  // Cakupan minimal 97% (98% dikurangi pembulatan skip)
  assert.ok(
    perDay.size >= Math.floor(366 * 0.97),
    `Hanya ${perDay.size} hari hijau dari 366 (diharapkan ~98%)`
  );
  assert.ok(perDay.size <= 366, `Terlalu banyak hari hijau: ${perDay.size}`);
});

test("greenDaysInYear: tanggal selalu berurutan (tidak ada duplikat yang rusak)", () => {
  const dates = greenDaysInYear(2023);
  for (let i = 1; i < dates.length; i++) {
    assert.ok(dates[i - 1] <= dates[i], "Tanggal tidak berurutan");
  }
});

test("greenDaysInYear: tahun berjalan tidak pernah di masa depan", () => {
  const now = new Date();
  const dates = greenDaysInYear(now.getFullYear(), { now });
  for (const d of dates) {
    assert.ok(d <= now, `Tanggal di masa depan: ${d.toISOString()}`);
    assert.equal(d.getFullYear(), now.getFullYear());
  }
});

test("greenDaysInYear: coverage 1 + tanpa commit kedua mengisi SEMUA hari", () => {
  const dates = greenDaysInYear(2023, { coverage: 1, secondCommitChance: 0 });
  const keys = new Set(dates.map(dayKey));
  assert.equal(keys.size, 365, "Harus mengisi 365 hari");
  assert.equal(dates.length, 365, "Tepat 1 commit per hari");
});

test("greenDaysInYear: coverage 0.5 menyisakan sekitar separuh hari", () => {
  const dates = greenDaysInYear(2023, { coverage: 0.5, secondCommitChance: 0 });
  const keys = new Set(dates.map(dayKey));
  const diff = Math.abs(keys.size - Math.round(365 * 0.5));
  assert.ok(diff <= 5, `Coverage 0.5 menghasilkan ${keys.size} hari (diharapkan ~182)`);
});

test("greenDaysInYear: ukuran hasil wajar untuk tahun berjalan (tidak membuang semua hari)", () => {
  const now = new Date();
  const dates = greenDaysInYear(now.getFullYear(), { now });
  const daysSoFar = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / DAY_MS) + 1;
  assert.ok(dates.length >= Math.floor(daysSoFar * 0.9), `Hasil terlalu sedikit: ${dates.length}`);
});
