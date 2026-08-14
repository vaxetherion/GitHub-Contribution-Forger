// test/e2e.test.js
// End-to-end test: menjalankan index.js di dalam sandbox git dengan remote bare lokal,
// lalu memverifikasi commit yang dibuat (jumlah, tanggal, author/committer) dan push-nya.
//
// Menjalankan:  npm test   (atau)   node --test test/e2e.test.js
//
// Catatan: test ini TIDAK menyentuh remote asli — semua push menuju bare repo lokal
// di dalam folder sementara (os.tmpdir()).

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(PROJECT_ROOT, "index.js");

/** Membuat sandbox: repo kerja + bare remote lokal. Mengembalikan { dir, remote }. */
function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aetherion-e2e-"));
  execFileSync("git", ["init", "--initial-branch=main"], { cwd: dir, stdio: "pipe" });
  execFileSync("git", ["config", "user.name", "Aetherion"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "aetherion@example.com"], { cwd: dir });
  const remote = path.join(dir, "remote.git");
  execFileSync("git", ["init", "--bare", "--initial-branch=main", remote], { stdio: "pipe" });
  execFileSync("git", ["remote", "add", "origin", remote], { cwd: dir });
  return { dir, remote };
}

/** Menjalankan script; melempar assertion bila exit code != 0. Mengembalikan stdout. */
function runScript(dir, args, env = {}) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 180_000,
  });
  assert.equal(
    res.status,
    0,
    `Script gagal (exit ${res.status}).\n--- stdout ---\n${res.stdout}\n--- stderr ---\n${res.stderr}`
  );
  return res.stdout;
}

/** Daftar commit di remote (bare) — format: { date (author, %aI), committerDate (%cI), message } */
function commitsOnRemote(remote) {
  const out = execFileSync(
    "git",
    ["--git-dir", remote, "log", "--reverse", "--format=%aI|%cI|%s"],
    { encoding: "utf8" }
  );
  return out
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [date, committerDate, message] = line.split("|");
      return { date, committerDate, message };
    });
}

test("Mode 2 — tahun pilihan (2020): 5 commit, semua bertanggal 2020, ter-push", () => {
  const { dir, remote } = makeSandbox();

  const stdout = runScript(dir, ["--lang", "en", "--mode", "2", "--year", "2020", "--count", "5"]);

  // Tampilan awal (banner) muncul — art memakai karakter blok, kotak berisi teks
  assert.match(stdout, /By Aetherion \(GitHub\)/);
  assert.match(stdout, /GitHub Contribution Forger — V2\.0/);

  // 5 commit di remote (push berhasil)
  const commits = commitsOnRemote(remote);
  assert.equal(commits.length, 5);

  // Semua author date di tahun 2020, dan committer date sama (autentik)
  for (const c of commits) {
    assert.ok(c.date.startsWith("2020-"), `Author date salah: ${c.date}`);
    assert.equal(c.committerDate, c.date, "Committer date harus sama dengan author date");
  }

  // data.json ada dan berisi tanggal commit terakhir
  const data = JSON.parse(fs.readFileSync(path.join(dir, "data.json"), "utf8"));
  assert.ok(data.date && /^\d{4}-\d{2}-\d{2}T/.test(data.date), `data.json tidak valid: ${data.date}`);
});

test("Mode 3 — acak total (bahasa Indonesia): 6 commit, rentang 2013..sekarang, UI berbahasa Indonesia", () => {
  const { dir, remote } = makeSandbox();

  const stdout = runScript(dir, ["--lang", "id", "--mode", "3", "--count", "6"]);

  // UI dalam bahasa Indonesia
  assert.match(stdout, /Pemalsu Kontribusi GitHub/);
  assert.match(stdout, /Selesai! 6 commit berhasil dibuat\./);

  const commits = commitsOnRemote(remote);
  assert.equal(commits.length, 6);

  const now = Date.now();
  for (const c of commits) {
    const t = Date.parse(c.date);
    assert.ok(!Number.isNaN(t), `Tanggal tidak bisa di-parse: ${c.date}`);
    assert.ok(t <= now, `Commit di masa depan: ${c.date}`);
    const year = Number(c.date.slice(0, 4));
    assert.ok(year >= 2013 && year <= new Date().getFullYear(), `Tahun di luar jangkauan: ${year}`);
  }
});

test("Mode 1 — dari 2024 sampai sekarang: countdown 0, 3 commit/tahun, ter-push per tahun", () => {
  const { dir, remote } = makeSandbox();
  const currentYear = new Date().getFullYear();

  const stdout = runScript(
    dir,
    ["--lang", "en", "--mode", "1", "--count", "3"],
    { AETHERION_START_YEAR: "2024", AETHERION_COUNTDOWN: "0" }
  );

  // Tahun 2024..currentYear, masing-masing 3 commit
  const years = [];
  for (let y = 2024; y <= currentYear; y++) years.push(String(y));
  assert.ok(stdout.includes("Creating commits for year 2024..."));

  const commits = commitsOnRemote(remote);
  const expected = years.length * 3;
  assert.equal(commits.length, expected);

  const seen = new Set(commits.map((c) => c.date.slice(0, 4)));
  for (const y of years) {
    assert.ok(seen.has(y), `Tidak ada commit untuk tahun ${y}`);
  }
  // Tidak ada tanggal di luar rentang
  for (const c of commits) {
    const y = Number(c.date.slice(0, 4));
    assert.ok(y >= 2024 && y <= currentYear, `Tahun di luar jangkauan: ${c.date}`);
  }
});

test("Interaktif via stdin — pilih bahasa, mode, dan tahun; lalu berjalan", () => {
  const { dir, remote } = makeSandbox();

  const res = spawnSync(
    process.execPath,
    [SCRIPT, "--count", "3"],
    {
      cwd: dir,
      env: { ...process.env },
      input: "2\n2\n2018\n", // bahasa Indonesia (2) → mode 2 (tahun pilihan) → tahun 2018
      encoding: "utf8",
      timeout: 120_000,
    }
  );
  assert.equal(
    res.status,
    0,
    `Script interaktif gagal (exit ${res.status}).\n--- stdout ---\n${res.stdout}\n--- stderr ---\n${res.stderr}`
  );
  // Bahasa Indonesia terpilih → pesan selesai dalam bahasa Indonesia
  assert.match(res.stdout, /Selesai! 3 commit berhasil dibuat\./);

  const commits = commitsOnRemote(remote);
  assert.equal(commits.length, 3);
  for (const c of commits) {
    assert.ok(c.date.startsWith("2018-"), `Tahun tidak 2018: ${c.date}`);
  }
});
