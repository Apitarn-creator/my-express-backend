import { Router } from 'express';
import connectionPool from '../utils/db.mjs';
import protectUser from '../middlewares/protectUser.mjs';

const likeRouter = Router();

// GET /likes/:postId — Public: ดึงจำนวน like + เช็ค is_liked ถ้ามี token
likeRouter.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const countResult = await connectionPool.query(
      `SELECT likes_count FROM posts WHERE id = $1`, [postId]
    );
    const likes_count = countResult.rows[0]?.likes_count || 0;

    // ถ้ามี token ค่อยเช็ค is_liked
    let is_liked = false;
    if (token) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) {
          const userLike = await connectionPool.query(
            `SELECT id FROM likes WHERE post_id = $1 AND user_id = $2`,
            [postId, data.user.id]
          );
          is_liked = userLike.rows.length > 0;
        }
      } catch { /* token invalid - is_liked stays false */ }
    }

    return res.status(200).json({ likes_count, is_liked });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch likes', error: error.message });
  }
});

// POST /likes/:postId — toggle like (like ถ้ายังไม่ได้ like / unlike ถ้า like แล้ว)
likeRouter.post('/:postId', protectUser, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  try {
    // เช็คว่า like อยู่แล้วไหม
    const existing = await connectionPool.query(
      `SELECT id FROM likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    let is_liked;
    if (existing.rows.length > 0) {
      // Unlike — ลบออก
      await connectionPool.query(
        `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      // ลด likes_count ใน posts
      await connectionPool.query(
        `UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`,
        [postId]
      );
      is_liked = false;
    } else {
      // Like — เพิ่มเข้า
      await connectionPool.query(
        `INSERT INTO likes (post_id, user_id, liked_at) VALUES ($1, $2, NOW())`,
        [postId, userId]
      );
      // เพิ่ม likes_count ใน posts
      await connectionPool.query(
        `UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1`,
        [postId]
      );
      is_liked = true;
    }

    // ดึงจำนวน like ล่าสุด
    const countResult = await connectionPool.query(
      `SELECT likes_count FROM posts WHERE id = $1`,
      [postId]
    );

    return res.status(200).json({
      is_liked,
      likes_count: countResult.rows[0]?.likes_count || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not toggle like', error: error.message });
  }
});

export default likeRouter;
