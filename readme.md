# 66010730 Drone API Server (Node.js + Express)

API สำหรับดึง Config/Status และจัดการ Logs ของโดรน โดยเชื่อมต่อ 2 เซิร์ฟเวอร์:
Server1 (Config): Google Apps Script (Web App)
Server2 (Logs): PocketBase

## 1) การติดตั้ง & รัน
bash
# ติดตั้งแพ็กเกจ
npm install

# สร้างไฟล์ .env ที่รากโปรเจกต์
# ใส่ค่าตามนี้ (ตัวอย่าง)
DRONE_CONFIG_URL= https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec
DRONE_LOG_URL=https://app-tracking.pockethost.io/api/collections/drone_logs/records
DRONE_LOG_TOKEN=20250901efx
PORT=3000

# รันเซิร์ฟเวอร์
node index.js
# เห็นข้อความ: Server is running on http://localhost:3000

### 1. GET/config/:droneId
ดึง config ของโดรน (คงค่าไว้เฉพาะ field ที่กำหนด)
http://localhost:3000/config/3001
ตัวอย่าง Response
{
  "drone_id": 3001,
  "drone_name": "Dot Dot",
  "light": "on",
  "country": "Bharat",
  "weight": 25
}

### 2. GET/status/:droneId
ดูสถานะของ DRONE
http://localhost:3000/status/3001
ตัวอย่าง Response
{
    "condition": "good"
}

### 3. GET/log/:droneId(รองรับPagination)
http://localhost:3000/logs/3001
http://localhost:3000/logs/3001?page=1&perPage=5
ตัวอย่าง Response
[
  {
    "drone_id": 3001,
    "drone_name": "Dot Dot",
    "created": "2025-11-04T07:14:03.773Z",
    "country": "Thailand",
    "celsius": 55
  }
]
 ### 4. POST/logs
POST http://localhost:3000/log
Content-Type: application/json
ตัวอย่าง Response
{
  "drone_id": 3001,
  "drone_name": "Dot Dot",
  "created": "2025-11-04T07:55:21.123Z",
  "country": "Thailand",
  "celsius": 37
}