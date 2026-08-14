// src/git.js
// Operasi git: menulis data.json, commit dengan tanggal palsu (author + committer),
// dan push ke remote dengan retry.

import jsonfile from "jsonfile";
import simpleGit from "simple-git";
import random from "random";
import { sleep } from "./utils.js";

const DATA_FILE = "./data.json";

const COMMIT_MESSAGES = [
  "Update data.json",
  "chore: refresh data",
  "fix: update data file",
  "docs: sync data",
  "refactor: data update",
  "build: regenerate data",
  "style: format data",
  "feat: add data entry",
];

export const randomCommitMessage = () => COMMIT_MESSAGES[random.int(0, COMMIT_MESSAGES.length - 1)];

/** Menimpa data.json dengan tanggal commit saat ini. */
export async function writeDataFile(date) {
  await jsonfile.writeFile(DATA_FILE, { date });
}

/**
 * Membuat satu commit dengan tanggal author & committer palsu.
 * Retry hingga 3x bila gagal, lalu lempar error.
 * @param {string} date - ISO string
 * @param {string} message
 */
export async function createCommit(date, message) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await writeDataFile(date);
      const git = simpleGit().env({ GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
      await git.add([DATA_FILE]).commit(message, { "--date": date });
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(2000 * attempt);
    }
  }
}

/**
 * Push branch saat ini ke origin dengan -u (aman bila upstream sudah ada).
 * Retry hingga 3x, lalu lempar error terakhir.
 */
export async function pushToRemote() {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await simpleGit().push("origin", "HEAD", { "-u": null });
      return;
    } catch (err) {
      lastErr = err;
      if (attempt === 3) break;
      await sleep(5000 * attempt);
    }
  }
  throw lastErr;
}
