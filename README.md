# 📚 PUECH Book Library

แดชบอร์ดคลังหนังสือสไตล์ **KRIDA (Cyber Kinetic)** — แสดงหนังสือที่อ่านจบ / กำลังอ่าน / อยากอ่าน
พร้อมสถิติการอ่านแบบเรียลไทม์ ค้นหา กรอง จัดเรียง และเพิ่มหนังสือใหม่ได้

**🔗 Live demo → https://sirpuech.github.io/puech-book-library/**

![theme](https://img.shields.io/badge/theme-Cyber%20Kinetic-2563EB) ![fonts](https://img.shields.io/badge/font-Prompt-F97316) ![build](https://img.shields.io/badge/deps-none-10b981)

---

## ไฟล์ในโปรเจกต์

| ไฟล์ / โฟลเดอร์ | ใช้ทำอะไร |
|---|---|
| **`index.html`** | ตัวแดชบอร์ด (ไฟล์เดียวจบ ฝังข้อมูล 195 เล่มไว้ในตัว) — GitHub Pages จะเสิร์ฟไฟล์นี้เป็นหน้าแรก |
| **`apps-script/`** | เวอร์ชันอ่าน Google Sheet สด + เพิ่มเล่มกลับเข้าชีต (`Code.gs`, `Index.html`, `Stylesheet.html`, `JavaScript.html`, `appsscript.json`) |

> ข้อมูลต้นทาง: Google Sheet **"PUECH BOOK LISTS"** — คอลัมน์ `A–F` = ชื่อหนังสือ · Status · Genre · นักเขียน · Completed · RATING (⭐)

---

## ✨ ฟีเจอร์

- สรุปภาพรวม (KPI) + กราฟสถิติ 5 ชุด (ความคืบหน้าตามหมวด, โดนัทสถานะ, การกระจายคะแนน, อ่านจบรายปี, นักเขียนยอดนิยม) วาดด้วย CSS/SVG ล้วน ไม่พึ่ง library
- ค้นหา · กรองตามสถานะ/หมวด · จัดเรียง · สลับมุมมอง การ์ด ⇄ ตาราง
- ➕ เพิ่ม / ✎ แก้ไข / 🗑 ลบ หนังสือที่เพิ่มเอง — เช่น เปลี่ยนสถานะจาก *อยากอ่าน* เป็น *อ่านจบแล้ว* พร้อมให้คะแนนและวันที่ (demo เก็บใน `localStorage` ของเบราว์เซอร์ / เวอร์ชัน Apps Script เขียนกลับลงชีต)
- สองธีมสว่าง–มืด + รองรับมือถือ · สองภาษา TH/EN · ฟอนต์ **Prompt** + **JetBrains Mono**

---

## 🚀 เปิด Live Demo ด้วย GitHub Pages

1. Push โปรเจกต์นี้ขึ้น GitHub (ดูด้านล่าง)
2. ไปที่ repo → **Settings ▸ Pages**
3. **Source:** *Deploy from a branch* → **Branch:** `main` → **Folder:** `/ (root)` → **Save**
4. รอสักครู่ ลิงก์ `https://<username>.github.io/<repo>/` จะแสดงแดชบอร์ด (จาก `index.html`) — เอาไปฝังในเว็บด้วย `<iframe>` ได้เลย

---

## ⚙️ เวอร์ชัน Apps Script (อ่านชีตจริง + เพิ่มเล่มลงชีต)

1. เปิดสเปรดชีต → **ส่วนขยาย ▸ Apps Script**
2. วางไฟล์จาก `apps-script/` ให้ครบ (ชื่อไฟล์ต้องตรง): `Code.gs`, `Index.html`, `Stylesheet.html`, `JavaScript.html` และตั้ง manifest ตาม `appsscript.json`
3. ใน `Code.gs` ตั้ง `SHEET_ID` (หรือเว้น `""` ถ้าสคริปต์ผูกกับชีต) และ `SHEET_NAME`
4. **Deploy ▸ New deployment ▸ Web app** แล้วนำ URL `/exec` ไปฝัง `<iframe>` (ตั้ง `XFrameOptionsMode.ALLOWALL` ให้แล้ว)

### 🔐 หมายเหตุความปลอดภัย
Web App รันด้วยสิทธิ์ของ **เจ้าของสคริปต์** — ถ้าตั้ง access เป็น *Anyone* ผู้เข้าชมจะเพิ่มหนังสือลงชีตจริงได้
สำหรับโชว์สาธารณะ แนะนำใช้ **`index.html` (GitHub Pages)** ซึ่งเพิ่มเล่มเก็บในเบราว์เซอร์ผู้ชมเท่านั้น
ส่วนเวอร์ชัน Apps Script ให้ตั้ง access เป็น *Only myself* / โดเมนของคุณ

---

## 📝 หมายเหตุข้อมูล
`index.html` เป็นสแนปช็อต **195 เล่ม** (ชีตนับ 196 — มี 1 แถวหมวด Business ที่ Sheets API ตัดหายเพราะเซลล์ถูก merge)
ตัวเลขทุกอย่างคำนวณจาก 195 เล่มนี้จึงตรงกันเอง ส่วนเวอร์ชัน Apps Script อ่านสดจะได้ครบ 196 เสมอ

---

*Built by **KRIDA** · Google Workspace & Full-Stack Solutions · Cyber Kinetic Theme*
