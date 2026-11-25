# Getoh Flight Monitor — ติดตั้ง

## ไฟล์ที่เพิ่ม/แก้ไข
- `prep.js` — เพิ่ม Flight Monitor ในแท็บเตรียมตัว (Manual Refresh)
- `functions/index.js` — เพิ่ม Cloud Function `flightMonitor` เป็น proxy ไปยัง FlightAware AeroAPI
- `firebase-rules.json` — เพิ่ม rules สำหรับ `flightMonitor/currentStatus` และ `flightMonitor/history`
- `index.html` — เพิ่ม cache-busting version ของ `prep.js`

## ตั้งค่าก่อนใช้งาน
1. สมัคร/เปิดใช้งาน FlightAware AeroAPI และตรวจสอบว่าแพ็กเกจมีสิทธิ์เรียกข้อมูลย้อนหลัง (historical flight data) และข้อมูลเที่ยวบินตามวันเดินทาง
2. ตั้ง Secret ใน Firebase:
   ```bash
   firebase functions:secrets:set FLIGHTAWARE_API_KEY
   ```
   วาง API key เมื่อระบบถาม
3. Deploy Cloud Function:
   ```bash
   firebase deploy --only functions:flightMonitor
   ```
4. Deploy Realtime Database Rules:
   ```bash
   firebase deploy --only database
   ```
   หากโปรเจกต์ใช้ชื่อไฟล์ rules แบบกำหนดเอง ให้ตรวจ `firebase.json` และนำ `firebase-rules.json` ไปใช้กับ Realtime Database Rules ของโปรเจกต์
5. Deploy ไฟล์หน้าเว็บที่แก้ไข (`index.html`, `prep.js`) ไปยัง GitHub Pages

## การทำงาน
- ผู้ใช้กดปุ่ม “ตรวจสอบเที่ยวบิน” เท่านั้น ไม่มี polling หรือการเรียก API ตามเวลา
- ใช้เที่ยวบินที่กำหนดใน `hotels.js` โดยอัตโนมัติ (ขาไปและขากลับ)
- ดึงสถานะเที่ยวบินใกล้วันเดินทาง และประวัติย้อนหลัง 365 วัน
- สรุปอัตราออกตรงเวลา (เกณฑ์ไม่เกิน 15 นาที) และดีเลย์เฉลี่ยของเที่ยวบินที่ล่าช้า
- บันทึกผลไว้ใน Firebase Realtime Database ที่ `flightMonitor/`
- API key อยู่ใน Firebase Secret ไม่ส่งไปหน้าเว็บ

## ข้อควรทราบ
- Historical data availability, lookback window, pagination และ flight coverage ขึ้นกับสิทธิ์ของ AeroAPI account
- หากแพ็กเกจไม่อนุญาต historical data ระบบจะแสดงข้อผิดพลาดจาก API ไม่สร้างสถิติจำลอง
- CORS ปัจจุบันอนุญาต `https://getoh-git.github.io` ตามโดเมนที่ระบุในโค้ดเดิม หากใช้โดเมนอื่นให้เพิ่ม origin ใน `FLIGHT_CORS`
- Rules ในไฟล์นี้กำหนดให้เขียนข้อมูล Flight Monitor ได้ถึง 1 มี.ค. 2027 ตามรูปแบบวันหมดอายุที่ใช้ใน rules เดิม ควรทบทวนก่อนวันดังกล่าว
