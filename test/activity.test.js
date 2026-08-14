// test/activity.test.js
// Unit test untuk simulasi aktivitas manusia (src/activity.js):
// nama file acak, generator artikel berita, dan loop mengetik
// yang harus meninggalkan direktori dalam keadaan bersih.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  generateNewsArticle,
  randomFileName,
  simulateHumanActivity,
} from "../src/activity.js";

test("randomFileName: format aneh & bervariasi", () => {
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const name = randomFileName();
    assert.match(name, /^[a-z]+-[a-z]+-\d{4}\.(txt|md|log|notes|tmp|draft|bak)$/);
    seen.add(name);
  }
  assert.ok(seen.size > 50, `Nama kurang bervariasi: ${seen.size}`);
});

test("generateNewsArticle: artikel berita panjang ala manusia", () => {
  const article = generateNewsArticle();
  assert.ok(article.startsWith("# "), "Artikel tidak diawali judul");
  assert.ok(article.includes("\n\n"), "Artikel tidak punya paragraf");
  assert.ok(article.endsWith("\n"), "Artikel tidak diakhiri baris baru");
  const words = article.split(/\s+/).length;
  assert.ok(words > 150, `Artikel terlalu pendek: ${words} kata`);
  assert.ok(article.length > 800, `Artikel terlalu pendek: ${article.length} karakter`);
});

test("simulateHumanActivity: membuat file, mengetik, lalu menghapus (direktori bersih)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aetherion-activity-"));
  const renders = [];
  let sawActiveFile = false;

  const p = simulateHumanActivity(
    3,
    (remaining, file) => {
      renders.push({ remaining, file });
      if (file) sawActiveFile = true;
    },
    { dir }
  );

  // Pantau direktori selama simulasi berjalan: file aktivitas harus muncul...
  const deadline = Date.now() + 4000;
  let sawDuringRun = false;
  while (Date.now() < deadline && !sawDuringRun) {
    sawDuringRun = fs.readdirSync(dir).length > 0;
    await new Promise((r) => setTimeout(r, 50));
  }
  await p;

  assert.ok(sawDuringRun, "Tidak ada file yang dibuat selama simulasi");
  assert.ok(sawActiveFile, "Render tidak pernah melaporkan file yang aktif");
  assert.equal(fs.readdirSync(dir).length, 0, "Direktori tidak bersih setelah selesai");
  assert.ok(renders.length >= 2, `Render countdown terlalu sedikit: ${renders.length}`);
});
