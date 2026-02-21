import express from 'express';
// 1. Import ตัว Router ที่เราแยกไฟล์เอาไว้เข้ามา
import postRouter from './routers/postRouter.mjs'; 

const app = express();
const port = 4000;

// ให้ Express สามารถอ่านข้อมูลแบบ JSON ได้
app.use(express.json());

// 2. นำ Router มาใช้งาน และตั้งค่าให้ทุก API ในนี้ขึ้นต้นด้วย /posts
app.use('/posts', postRouter);

// เปิด Server ให้ทำงาน
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});