import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 4000;

// ✅ แก้ SELF_SIGNED_CERT_IN_CHAIN: ใช้ SSL โดยไม่ตรวจสอบใบรับรอง
const rawUrl = process.env.DATABASE_URL;
const connectionString = rawUrl ? rawUrl.replace(/[?&]sslmode=[^&]*/gi, "").replace(/\?&/, "?").replace(/\?$/, "") : null;
const pool = new Pool({
  connectionString: connectionString || rawUrl || undefined,
  ssl: rawUrl ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------------
// ✅ 1. POST /posts (Create) - สร้างบทความ (จากแบบฝึกหัดที่แล้ว)
// ----------------------------------------------------------------------
app.post("/posts", async (req, res) => {
  const { title, image, category_id, description, content, status_id } = req.body;

  if (!title || !image || !category_id || !description || !content || !status_id) {
    return res.status(400).json({ message: "Server could not create post because there are missing data from client" });
  }

  try {
    await pool.query(
      `INSERT INTO posts (title, image, category_id, description, content, status_id, date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [title, image, category_id, description, content, status_id]
    );
    return res.status(201).json({ message: "Created post sucessfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server could not create post because database connection" });
  }
});

// ----------------------------------------------------------------------
// ✅ 2. GET /posts/:postId (Read One) - ดูบทความรายตัว
// ----------------------------------------------------------------------
app.get("/posts/:postId", async (req, res) => {
  const postId = req.params.postId;

  try {
    // ใช้ LEFT JOIN เพื่อดึงชื่อ Category และ Status ออกมาแทน ID (ตามโจทย์ Response)
    // หมายเหตุ: ถ้ายังไม่มีตาราง categories/statuses โค้ดอาจจะ error ให้แก้เหลือแค่ SELECT * FROM posts WHERE id = $1
    const result = await pool.query(
      `SELECT posts.*, categories.name as category, statuses.status 
       FROM posts
       LEFT JOIN categories ON posts.category_id = categories.id
       LEFT JOIN statuses ON posts.status_id = statuses.id
       WHERE posts.id = $1`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Server could not find a requested post" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server could not read post because database connection" });
  }
});

// ----------------------------------------------------------------------
// ✅ 3. PUT /posts/:postId (Update) - แก้ไขบทความ
// ----------------------------------------------------------------------
app.put("/posts/:postId", async (req, res) => {
  const postId = req.params.postId;
  const { title, image, category_id, description, content, status_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE posts 
       SET title = $1, image = $2, category_id = $3, description = $4, content = $5, status_id = $6, updated_at = NOW()
       WHERE id = $7`,
      [title, image, category_id, description, content, status_id, postId]
    );

    // เช็คว่ามีแถวถูกอัปเดตจริงไหม (ถ้า 0 แปลว่าหา ID ไม่เจอ)
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Server could not find a requested post to update" });
    }

    return res.status(200).json({ message: "Updated post sucessfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server could not update post because database connection" });
  }
});

// ----------------------------------------------------------------------
// ✅ 4. DELETE /posts/:postId (Delete) - ลบบทความ
// ----------------------------------------------------------------------
app.delete("/posts/:postId", async (req, res) => {
  const postId = req.params.postId;

  try {
    const result = await pool.query("DELETE FROM posts WHERE id = $1", [postId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Server could not find a requested post to delete" });
    }

    return res.status(200).json({ message: "Deleted post sucessfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server could not delete post because database connection" });
  }
});

// ----------------------------------------------------------------------
// ✅ 5. GET /posts (Read All) - ค้นหาและแบ่งหน้า (ซับซ้อนที่สุด)
// ----------------------------------------------------------------------
app.get("/posts", async (req, res) => {
  // รับ Query Params (กำหนดค่าเริ่มต้นถ้าไม่ส่งมา)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const category = req.query.category;     // category (ชื่อ หรือ keyword)
  const keyword = req.query.keyword;       // คำค้นหา
  
  const offset = (page - 1) * limit;

  // เริ่มสร้าง Query แบบ Dynamic
  let query = `
    SELECT posts.*, categories.name as category, statuses.status 
    FROM posts
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN statuses ON posts.status_id = statuses.id
    WHERE 1=1
  `;
  let countQuery = `
    SELECT COUNT(*) 
    FROM posts 
    LEFT JOIN categories ON posts.category_id = categories.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  // เงื่อนไข 1: กรองตาม Category (ถ้ามีส่งมา)
  if (category) {
    // สมมติว่าส่งมาเป็นชื่อ เช่น "Cat" หรือ "IT"
    query += ` AND categories.name ILIKE $${paramIndex}`;
    countQuery += ` AND categories.name ILIKE $${paramIndex}`;
    params.push(`%${category}%`);
    paramIndex++;
  }

  // เงื่อนไข 2: กรองตาม Keyword (Title, Description, Content)
  if (keyword) {
    query += ` AND (posts.title ILIKE $${paramIndex} OR posts.description ILIKE $${paramIndex} OR posts.content ILIKE $${paramIndex})`;
    countQuery += ` AND (posts.title ILIKE $${paramIndex} OR posts.description ILIKE $${paramIndex} OR posts.content ILIKE $${paramIndex})`;
    params.push(`%${keyword}%`);
    paramIndex++;
  }

  // เติม Order และ Pagination เข้าไปท้ายสุด
  query += ` ORDER BY posts.date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  
  // เตรียม params สำหรับ Query หลัก (ต้องเพิ่ม limit กับ offset เข้าไป)
  const queryParams = [...params, limit, offset];

  try {
    // รัน 2 Query พร้อมกัน: หาจำนวนทั้งหมด (เพื่อคำนวณหน้า) และ หาข้อมูลโพสต์
    const totalCountResult = await pool.query(countQuery, params);
    const postsResult = await pool.query(query, queryParams);

    const totalPosts = parseInt(totalCountResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    return res.status(200).json({
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
      posts: postsResult.rows,
      nextPage: page < totalPages ? page + 1 : null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server could not read post because database connection" });
  }
});

// ✅ Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});