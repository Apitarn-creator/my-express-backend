import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 4000;

// ✅ แก้ SELF_SIGNED_CERT_IN_CHAIN: ใช้ SSL โดยไม่ตรวจสอบใบรับรอง (ลบ ?sslmode= ใน URL เพื่อไม่ให้ override)
const rawUrl = process.env.DATABASE_URL;
const connectionString = rawUrl ? rawUrl.replace(/[?&]sslmode=[^&]*/gi, "").replace(/\?&/, "?").replace(/\?$/, "") : null;
const pool = new Pool({
  connectionString: connectionString || rawUrl || undefined,
  ssl: rawUrl ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// ตรวจสอบค่าการเชื่อมต่อใน Terminal
console.log("Checking DB URL:", process.env.DATABASE_URL ? "OK" : "NOT FOUND");

app.post("/assignments", async (req, res) => {
  const { title, image, category_id, description, content, status_id } = req.body;

  // ดักข้อมูลไม่ครบ (Error 400)
  if (!title || !image || !category_id || !description || !content || !status_id) {
    return res.status(400).json({
      message: "Server could not create post because there are missing data from client"
    });
  }

  try {
    // บันทึกลงตาราง posts (ชื่อคอลัมน์อิงตามไฟล์ d)
    await pool.query(
      `INSERT INTO posts (title, image, category_id, description, content, status_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, image, category_id, description, content, status_id]
    );

    return res.status(201).json({
      message: "Created post sucessfully"
    });

  } catch (err) {
    console.error("Database Error Detail:", err);

    // ส่ง error จริงกลับไปเพื่อให้ debug ได้ (production ควรซ่อนหรือกรอง)
    const message = err.message || "Server could not create post because database connection";
    const code = err.code;

    return res.status(500).json({
      message: "Server could not create post because database connection",
      error: message,
      ...(code && { code })
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});