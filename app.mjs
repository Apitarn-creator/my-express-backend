import 'dotenv/config';
import express from 'express';
import cors from 'cors'; 
import postRouter from './routers/postRouter.mjs';
import authRouter from './routers/authRouter.mjs';

import protectUser from "./middlewares/protectUser.mjs";
import protectAdmin from "./middlewares/protectAdmin.mjs";

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.use('/posts', postRouter);
app.use('/auth', authRouter);


app.get("/protected-route", protectUser, (req, res) => {
  res.json({ message: "This is protected content", user: req.user });
});

app.get("/admin-only", protectAdmin, (req, res) => {
  res.json({ message: "This is admin-only content", admin: req.user });
});

// เปิด Server ให้ทำงาน
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});