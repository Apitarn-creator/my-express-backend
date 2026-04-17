import { Router } from 'express';
import connectionPool from '../utils/db.mjs';
import protectUser from '../middlewares/protectUser.mjs';

const commentRouter = Router();

// GET /comments/:postId — ดึง comment ทั้งหมดของ post นั้น (Public)
commentRouter.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await connectionPool.query(
      `SELECT comments.id, comments.comment_text, comments.created_at,
              users.username, users.name
       FROM comments
       INNER JOIN users ON comments.user_id = users.id
       WHERE comments.post_id = $1
       ORDER BY comments.created_at DESC`,
      [postId]
    );
    return res.status(200).json({ comments: result.rows });
  } catch (error) {
    console.error('Comment GET error:', error);
    return res.status(500).json({ message: 'Could not fetch comments', error: error.message });
  }
});

// POST /comments/:postId — เพิ่ม comment (ต้อง login)
commentRouter.post('/:postId', protectUser, async (req, res) => {
  const { postId } = req.params;
  const { comment_text } = req.body;
  const userId = req.user.id; // มาจาก protectUser middleware

  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ message: 'comment_text is required' });
  }

  try {
    const result = await connectionPool.query(
      `INSERT INTO comments (post_id, user_id, comment_text, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, comment_text, created_at`,
      [postId, userId, comment_text.trim()]
    );

    // ดึงข้อมูล user มา join ด้วยเพื่อส่งกลับครบ
    const comment = result.rows[0];
    return res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        ...comment,
        username: req.user.user_metadata?.username || '',
        name: req.user.user_metadata?.name || '',
      }
    });
  } catch (error) {
    console.error('Comment POST error:', error);
    return res.status(500).json({ message: 'Could not create comment', error: error.message });
  }
});

// DELETE /comments/:commentId — ลบ comment (เฉพาะเจ้าของ)
commentRouter.delete('/:commentId', protectUser, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const result = await connectionPool.query(
      `DELETE FROM comments WHERE id = $1 AND user_id = $2`,
      [commentId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Comment not found or not yours' });
    }
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete comment', error: error.message });
  }
});

export default commentRouter;
