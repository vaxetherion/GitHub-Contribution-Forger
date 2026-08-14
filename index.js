// Aetherion — GitHub Contribution Forger V2.0
// Script untuk memalsukan grafik kontribusi GitHub.
// Dikembangkan oleh Aetherion (GitHub).
//
// Penggunaan:
//   node index.js                        → interaktif (banner, bahasa, mode)
//   node index.js --lang id --mode 2 --year 2013
//   node index.js -l en -m 3 -c 200
//
// Opsi:
//   -l, --lang <code>   bahasa (en, id, zh, ja, th, vi, ko, es, fr, de, ar, ru)
//   -m, --mode <1|2|3>  mode (1: dari 2013, 2: tahun pilihan, 3: acak total)
//   -y, --year <YYYY>   tahun untuk mode 2
//   -c, --count <n>     jumlah commit (override default acak)
//   -h, --help          bantuan ini
//
// Env:
//   AETHERION_START_YEAR   tahun awal mode 1 (default: 2013, saat Contribution Graph muncul)
//   AETHERION_COUNTDOWN    detik jeda antar tahun mode 1 (default: 300 = 5 menit; 0 = nonaktif)
//   AETHERION_COMMITS      jumlah commit (sama dengan --count)

import process from "node:process";
import random from "random";
import { LANGS, createTranslator } from "./src/i18n.js";
import { showBanner } from "./src/banner.js";
import { runMode1, runMode2, runMode3 } from "./src/modes.js";
import { askQuestion, closePrompter, pickNumber } from "./src/cli.js";

const VERSION = "2.0";
const GRAPH_START_YEAR = 2013; // Contribution Graph GitHub diluncurkan 7 Januari 2013
const DEFAULT_COUNTDOWN_SECONDS = 300; // 5 menit
const DEFAULT_MIN_PER_YEAR = 150;
const DEFAULT_MAX_PER_YEAR = 300;
const DEFAULT_MIN_TOTAL_RANDOM = 150;
const DEFAULT_MAX_TOTAL_RANDOM = 350;

function parseArgs(argv) {
  const args = {
    lang: null,
    mode: null,
    year: null,
    count: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "-l":
      case "--lang":
        args.lang = next();
        break;
      case "-m":
      case "--mode":
        args.mode = Number(next());
        break;
      case "-y":
      case "--year":
        args.year = Number(next());
        break;
      case "-c":
      case "--count":
        args.count = Number(next());
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        if (a.startsWith("--")) {
          const [k, v] = a.slice(2).split("=");
          if (v !== undefined) {
            if (k === "lang") args.lang = v;
            else if (k === "mode") args.mode = Number(v);
            else if (k === "year") args.year = Number(v);
            else if (k === "count") args.count = Number(v);
          }
        }
    }
  }
  return args;
}

const usage = () => {
  console.log(`Aetherion — GitHub Contribution Forger v${VERSION}
Penggunaan:
  node index.js                          interaktif
  node index.js --lang id --mode 2 --year 2013
Opsi:
  -l, --lang <code>   bahasa (${LANGS.map((l) => l.code).join(", ")})
  -m, --mode <1|2|3>  mode: 1 dari 2013 | 2 tahun pilihan | 3 acak total
  -y, --year <YYYY>   tahun untuk mode 2
  -c, --count <n>     jumlah commit (override default acak)
  -h, --help          bantuan ini`);
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }

  const currentYear = new Date().getFullYear();
  const startYear =
    Number(process.env.AETHERION_START_YEAR) || GRAPH_START_YEAR;
  const countdownSeconds = Number(process.env.AETHERION_COUNTDOWN);
  const envCount = Number(process.env.AETHERION_COMMITS);
  const overrideCount = args.count ?? (Number.isFinite(envCount) && envCount > 0 ? envCount : null);

  // ---- Banner ----
  showBanner(createTranslator("en"), VERSION);

  // ---- Pilih bahasa ----
  let lang = args.lang;
  if (!lang) {
    console.log(`\n${createTranslator("en").languagePrompt}`);
    LANGS.forEach((l, i) => console.log(`  ${i + 1}. ${l.name}`));
    const choice = await pickNumber(createTranslator("en"), `> `, LANGS.length);
    lang = LANGS[choice - 1].code;
  }
  if (!lang) lang = "en";
  if (!LANGS.some((l) => l.code === lang)) {
    console.error(`Unknown language: ${lang}. Using English.`);
    lang = "en";
  }
  const t = createTranslator(lang);

  // ---- Pilih mode ----
  let mode = args.mode;
  if (!mode) {
    console.log(`\n${t.modePrompt}`);
    console.log(`  ${t.modeOption1}\n      ${t.mode1Desc}`);
    console.log(`  ${t.modeOption2}\n      ${t.mode2Desc}`);
    console.log(`  ${t.modeOption3}\n      ${t.mode3Desc}`);
    mode = await pickNumber(t, `> `, 3);
  }
  if (![1, 2, 3].includes(mode)) {
    console.error(`Mode harus 1, 2, atau 3. Gunakan --help untuk bantuan.`);
    process.exit(1);
  }

  // ---- Tahun untuk mode 2 ----
  let year = args.year;
  if (mode === 2) {
    if (!year) {
      for (;;) {
        const answer = await askQuestion(t.yearPrompt);
        year = Number((answer || "").trim());
        if (Number.isInteger(year) && year >= startYear && year <= currentYear) break;
        if (!process.stdin.isTTY && (answer === undefined || String(answer).trim() === "")) {
          throw new Error("Missing interactive input (stdin ended).");
        }
        console.log(t.make("invalidYear", { min: startYear, max: currentYear }));
      }
    }
    if (!Number.isInteger(year) || year < startYear || year > currentYear) {
      console.error(t.make("invalidYear", { min: startYear, max: currentYear }));
      process.exit(1);
    }
  }

  // ---- Jumlah commit ----
  const commitsPerYear = overrideCount
    ? () => overrideCount
    : () => random.int(DEFAULT_MIN_PER_YEAR, DEFAULT_MAX_PER_YEAR);
  const totalRandomCount = overrideCount
    ? overrideCount
    : random.int(DEFAULT_MIN_TOTAL_RANDOM, DEFAULT_MAX_TOTAL_RANDOM);

  console.log(`\n${t.starting} (${t.tagline} v${VERSION})`);

  let total;
  if (mode === 1) {
    total = await runMode1(t, {
      startYear,
      endYear: currentYear,
      commitsPerYear,
      countdownSeconds: Number.isFinite(countdownSeconds) && countdownSeconds >= 0 ? countdownSeconds : DEFAULT_COUNTDOWN_SECONDS,
    });
  } else if (mode === 2) {
    total = await runMode2(t, { year, commitsPerYear });
  } else {
    total = await runMode3(t, { minYear: startYear, commitsPerYear: totalRandomCount });
  }

  console.log(`\n${t.make("doneMsg", { total })}`);
  closePrompter();
  process.exit(0);
}

main().catch((err) => {
  const t = createTranslator(process.env.AETHERION_LANG || "en");
  console.error(`\n${t.make("errorMsg", { msg: err && err.message ? err.message : String(err) })}`);
  process.exit(1);
});
