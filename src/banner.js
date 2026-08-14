// src/banner.js
// Tampilan awal script — ASCII art "AETHERION" + kotak info, oleh Aetherion (GitHub).

export const AETHERION_ART = [
  " █████╗ ███████╗████████╗██╗  ██╗███████╗██████╗ ██╗ ██████╗ ███╗   ██╗",
  "██╔══██╗██╔════╝╚══██╔══╝██║  ██║██╔════╝██╔══██╗██║██╔═══██╗████╗  ██║",
  "███████║█████╗     ██║   ███████║█████╗  ██████╔╝██║██║   ██║██╔██╗ ██║",
  "██╔══██║██╔══╝     ██║   ██╔══██║██╔══╝  ██╔══██╗██║██║   ██║██║╚██╗██║",
  "██║  ██║███████╗   ██║   ██║  ██║███████╗██║  ██║██║╚██████╔╝██║ ╚████║",
  "╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝",
];

const BOX_WIDTH = 62;

function padCenter(text) {
  if (text.length >= BOX_WIDTH - 4) return text;
  const total = BOX_WIDTH - 4 - text.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

function drawBox(lines) {
  const border = "═".repeat(BOX_WIDTH - 2);
  const out = [`╔${border}╗`];
  for (const line of lines) {
    out.push(`║ ${padCenter(line)} ║`);
  }
  out.push(`╚${border}╝`);
  return out;
}

/**
 * Menampilkan banner pembuka.
 * @param {object} t - objek terjemahan aktif
 * @param {string} version - versi script
 */
export function showBanner(t, version) {
  const box = drawBox([
    `${t.tagline} — V${version}`,
    t.byLine,
  ]);
  const lines = [...AETHERION_ART, "", ...box, ""];
  process.stdout.write("\n" + lines.join("\n") + "\n");
}
