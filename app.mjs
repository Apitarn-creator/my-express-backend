import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello TechUp! API is running.");
});

// ✅ API สร้างบทความ (แก้ไข Query ให้ตรงกับตาราง posts ในไฟล์ d)
app.post("/assignments", async (req, res) => {
  const { title, image, category_id, description, content, status_id } = req.body;

  // Validation
  if (!title || !image || !category_id || !description || !content || !status_id) {
    return res.status(400).json({
      message: "Server could not create post because there are missing data from client"
    });
  }

  try {
    // ⚠️ แก้ไขชื่อคอลัมน์ให้ตรงกับไฟล์ d (ใช้ date แทน created_at/updated_at)
    await pool.query(
      `INSERT INTO posts (title, image, category_id, description, content, status_id, date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [title, image, category_id, description, content, status_id]
    );

    return res.status(201).json({
      message: "Created post sucessfully"
    });

  } catch (err) {
    console.error("Database Error:", err);
    return res.status(500).json({
      message: "Server could not create post because database connection"
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});