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

// Paste your spreadsheet ID here, or leave "" if this script is bound to the sheet:
const SHEET_ID   = "";
const SHEET_NAME = "";            // "" = first tab, or the exact tab name
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
  t.booksJson = JSON.stringify(getBookData());
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
      String(book.genre || "").trim(),
      String(book.author || "").trim(),
      String(book.completed || "").trim(),
      stars
    ]);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- helpers ---------------- */

function ss_()    { return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_() { const ss = ss_(); return SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0]; }
function str_(v)  { return v == null ? "" : String(v).trim(); }

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
