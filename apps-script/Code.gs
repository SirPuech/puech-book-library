/**
 * PUECH Book Library — KRIDA Web App (Cyber Kinetic theme)
 * ---------------------------------------------------------
 * Serves a reading dashboard that reads the "PUECH BOOK LISTS" sheet live,
 * and (optionally) appends new books back to the sheet.
 *
 * Sheet columns used  ->  A: ชื่อหนังสือ (Title) | B: Status | C: Genre
 *                          D: นักเขียน (Author) | E: Completed | F: RATING (⭐)
 *
 * SETUP
 *  1) Extensions ▸ Apps Script inside your spreadsheet (or a standalone project
 *     with SHEET_ID set below).
 *  2) Add files: Code.gs, Index.html, Stylesheet.html, JavaScript.html.
 *  3) Deploy ▸ New deployment ▸ Web app.
 *  4) Embed the /exec URL in your site with <iframe> (XFrameOptions is ALLOWALL).
 */

// Spreadsheet ID (from the sheet URL). Leave "" only if this script is BOUND to the sheet.
const SHEET_ID   = "1PeDV5lKVAk06DlK-kNO9gqVSkC7y43VO7So64JKOPxs";
const SHEET_NAME = "";            // "" = auto-detect the book-list tab; or set the exact tab name
const SHEET_GID  = 0;             // optional override only; header detection is tried first anyway
const TZ         = "Asia/Bangkok";

// Sheet status text  ->  dashboard status
const STATUS_MAP = {
  "wishes": "Wished", "done": "Done",
  "in progress": "In progress", "not start": "Not Start"
};
// dashboard status  ->  sheet status text (used when adding a book)
const STATUS_TO_SHEET = {
  "Wished": "Wishes", "Done": "Done",
  "In progress": "In progress", "Not Start": "Not start"
};

/* ---------------- web app ---------------- */

function doGet() {
  const t = HtmlService.createTemplateFromFile("Index");
  t.dataB64 = Utilities.base64Encode(JSON.stringify(getBookData()), Utilities.Charset.UTF_8);
  return t.evaluate()
    .setTitle("PUECH Book Library")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/* ---------------- read ---------------- */

function getBookData() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 6).getValues(); // A2:F<last>
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = str_(r[0]);
    if (!title) continue;                       // skip blank rows
    const statusRaw = str_(r[1]);
    out.push({
      row:       i + 2,   // actual spreadsheet row — used to edit this book in place
      title:     title,
      status:    STATUS_MAP[statusRaw.toLowerCase()] || statusRaw,
      genre:     str_(r[2]),
      author:    str_(r[3]).replace(/\t/g, "").trim(),
      completed: fmtDate_(r[4]),
      rating:    stars_(r[5])
    });
  }
  return out;
}

/* ---------------- write (Add book) ---------------- */

function addBook(book) {
  if (!book || !String(book.title || "").trim()) throw new Error("กรุณากรอกชื่อหนังสือ");
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);                          // avoid race conditions
  try {
    const sh = sheet_();
    const status = STATUS_TO_SHEET[book.status] || book.status || "Wishes";
    const n = Math.max(0, Math.min(5, parseInt(book.rating, 10) || 0));
    const stars = n ? new Array(n + 1).join("⭐") : "";
    // A–F: Title, Status, Genre, Author, Completed, Rating
    sh.appendRow([
      String(book.title).trim(),
      status,
      cleanGenre_(book.genre),
      String(book.author || "").trim(),
      String(book.completed || "").trim(),
      stars
    ]);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- write (Update book) ---------------- */

function updateBook(p) {
  if (!p || !p.row) throw new Error("Missing row");
  const row = parseInt(p.row, 10);
  if (!(row >= 2)) throw new Error("Bad row: " + p.row);
  if (!String(p.title || "").trim()) throw new Error("กรุณากรอกชื่อหนังสือ");
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheet_();
    const status = STATUS_TO_SHEET[p.status] || p.status || "Wishes";
    const n = Math.max(0, Math.min(5, parseInt(p.rating, 10) || 0));
    const stars = n ? new Array(n + 1).join("⭐") : "";
    // Overwrite ONLY columns A–F of this row; the stat block in H–N is left untouched.
    sh.getRange(row, 1, 1, 6).setValues([[
      String(p.title).trim(),
      status,
      cleanGenre_(p.genre),
      String(p.author || "").trim(),
      String(p.completed || "").trim(),
      stars
    ]]);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- helpers ---------------- */

function ss_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  const a = SpreadsheetApp.getActiveSpreadsheet();
  if (!a) throw new Error("No spreadsheet found — set SHEET_ID at the top of Code.gs (a standalone project can't use getActiveSpreadsheet).");
  return a;
}

/* Resolve the book-list tab. Header detection comes FIRST so a stray gid/name
   can never lock onto the wrong (empty) tab.
   1) the tab whose header row looks like the book list  2) SHEET_NAME  3) SHEET_GID  4) most rows */
function sheet_() {
  const ss = ss_();
  const sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) { if (looksLikeBooks_(sheets[i])) return sheets[i]; }
  if (SHEET_NAME) { var s = ss.getSheetByName(SHEET_NAME); if (s) return s; }
  if (SHEET_GID)  { for (var k = 0; k < sheets.length; k++) { if (sheets[k].getSheetId() === SHEET_GID) return sheets[k]; } }
  var best = sheets[0], bestN = -1;
  for (var j = 0; j < sheets.length; j++) { var n = sheets[j].getLastRow(); if (n > bestN) { bestN = n; best = sheets[j]; } }
  return best;
}
function looksLikeBooks_(s) {
  if (s.getLastRow() < 2 || s.getLastColumn() < 2) return false;
  var w = Math.min(8, s.getLastColumn());
  var hdr = s.getRange(1, 1, 1, w).getValues()[0]
              .map(function (x) { return String(x).trim().toLowerCase(); }).join("|");
  return hdr.indexOf("status") >= 0 &&
         (hdr.indexOf("ชื่อหนังสือ") >= 0 || hdr.indexOf("genre") >= 0 ||
          hdr.indexOf("นักเขียน") >= 0 || hdr.indexOf("title") >= 0);
}
function str_(v)  { return v == null ? "" : String(v).trim(); }
function cleanGenre_(g) { g = String(g == null ? "" : g).trim(); return g === "—" ? "" : g; }

function stars_(v) {
  if (v == null) return 0;
  const m = String(v).match(/⭐/g);
  if (m) return m.length;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(5, n));
}

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "d/M/yyyy");
  return str_(v);
}

/* ---------------- diagnostics ----------------
   Select "debugSheets" in the toolbar dropdown, click Run, then open Execution log. */
function debugSheets() {
  const ss = ss_();
  const sheets = ss.getSheets();
  Logger.log("Spreadsheet: '" + ss.getName() + "'  (" + sheets.length + " tab(s))");
  sheets.forEach(function (s, i) {
    var w = Math.max(1, Math.min(8, s.getLastColumn()));
    var hdr = s.getRange(1, 1, 1, w).getValues()[0].join(" | ");
    Logger.log("[" + i + "] name='" + s.getName() + "' gid=" + s.getSheetId() +
               " rows=" + s.getLastRow() + " cols=" + s.getLastColumn() + "  row1: " + hdr);
  });
  var picked = sheet_();
  Logger.log("sheet_() -> name='" + picked.getName() + "' gid=" + picked.getSheetId());
  Logger.log("getBookData() returned " + getBookData().length + " books");
}

/* Proves whether the page that doGet serves actually contains the injected data.
   Select "debugOut" -> Run -> Execution log. */
function debugOut() {
  var t = HtmlService.createTemplateFromFile("Index");
  t.dataB64 = Utilities.base64Encode(JSON.stringify(getBookData()), Utilities.Charset.UTF_8);
  Logger.log("dataB64 length = " + t.dataB64.length + " (should be a few thousand)");
  var html = t.evaluate().getContent();
  Logger.log("served html length = " + html.length);
  Logger.log("html has MODE=gas : " + (html.indexOf('MODE  = "gas"') >= 0));
  var i = html.indexOf("__BOOKS_B64__ =");
  Logger.log("html has injection: " + (i >= 0));
  if (i >= 0) Logger.log("injected snippet: " + html.substring(i, i + 70));
}
