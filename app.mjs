// ไฟล์: app.mjs (อัปเดตใหม่)
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Route หน้าแรก (เดิม)
app.get("/", (req, res) => {
  res.send("Hello TechUp!");
});

// 2. เพิ่ม Route สำหรับ Health Check (เพื่อให้ HealthTestPage ทำงานได้)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "success", 
    message: "Backend is healthy and running on Vercel!" 
  });
});

// 3. เพิ่ม Route สำหรับ Posts (เพื่อให้หน้าบทความทำงานได้)
// อันนี้จำลองข้อมูลส่งไปก่อน (Mock Data) เดี๋ยวค่อยเปลี่ยนเป็น Database จริงทีหลัง
app.get("/posts", (req, res) => {
  res.json([
    {
      id: 1,
      title: "First Post from Vercel Backend",
      category: "Highlight",
      image: "https://placehold.co/600x400?text=Vercel+Backend",
      author: "Admin",
      description: "This data is coming from your new Express server on Vercel!",
      content: "Success! The connection is working.",
      date: "2024-03-20",
      likes: 99
    }
  ]);
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});