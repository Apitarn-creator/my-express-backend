import { Router } from 'express';
import validatePostData from '../middlewares/validatePost.mjs';
import connectionPool from '../utils/db.mjs';
import protectUser from '../middlewares/protectUser.mjs';
import protectAdmin from '../middlewares/protectAdmin.mjs';

const postRouter = Router();

// ✅ GET /posts  — Public
postRouter.get('/', async (req, res) => {
  try {
    const category = req.query.category || '';
    const keyword = req.query.keyword || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const offset = (safePage - 1) * safeLimit;

    // Base query (ไม่กรอง status — เพื่อให้ query ทำงานได้แน่นอน)
    let query = `
      SELECT posts.id, posts.image, categories.name AS category,
             posts.title, posts.description, posts.date, posts.content,
             statuses.status, posts.likes_count, posts.category_id
      FROM posts
      INNER JOIN categories ON posts.category_id = categories.id
      INNER JOIN statuses   ON posts.status_id   = statuses.id
      WHERE 1=1
    `;
    let values = [];

    if (category && keyword) {
      query += ` AND categories.name ILIKE $1
                 AND (posts.title ILIKE $2 OR posts.description ILIKE $2 OR posts.content ILIKE $2)`;
      values = [`%${category}%`, `%${keyword}%`];
    } else if (category) {
      query += ` AND categories.name ILIKE $1`;
      values = [`%${category}%`];
    } else if (keyword) {
      query += ` AND (posts.title ILIKE $1 OR posts.description ILIKE $1 OR posts.content ILIKE $1)`;
      values = [`%${keyword}%`];
    }

    query += ` ORDER BY posts.date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(safeLimit, offset);

    const result = await connectionPool.query(query, values);

    // count
    let countQuery = `
      SELECT COUNT(*) FROM posts
      INNER JOIN categories ON posts.category_id = categories.id
      INNER JOIN statuses   ON posts.status_id   = statuses.id
      WHERE 1=1
    `;
    const countValues = values.slice(0, -2);
    if (category && keyword) {
      countQuery += ` AND categories.name ILIKE $1 AND (posts.title ILIKE $2 OR posts.description ILIKE $2 OR posts.content ILIKE $2)`;
    } else if (category) {
      countQuery += ` AND categories.name ILIKE $1`;
    } else if (keyword) {
      countQuery += ` AND (posts.title ILIKE $1 OR posts.description ILIKE $1 OR posts.content ILIKE $1)`;
    }

    const countResult = await connectionPool.query(countQuery, countValues);
    const totalPosts = parseInt(countResult.rows[0].count, 10);

    const response = {
      totalPosts,
      totalPages: Math.ceil(totalPosts / safeLimit),
      currentPage: safePage,
      limit: safeLimit,
      posts: result.rows,   // ✅ Frontend อ่าน response.data.posts
    };

    if (offset + safeLimit < totalPosts) response.nextPage = safePage + 1;
    if (offset > 0) response.previousPage = safePage - 1;

    return res.status(200).json(response);
  } catch (error) {
    console.error('🔥 Database Error: ', error);
    return res.status(500).json({ message: 'Server could not read posts', error: error.message });
  }
});


// GET /posts/admin/all — ดึงทุก post รวม draft (Admin only)
postRouter.get('/admin/all', protectAdmin, async (req, res) => {
  try {
    const result = await connectionPool.query(
      `SELECT posts.id, posts.image, categories.name AS category,
              posts.title, posts.description, posts.date,
              statuses.status, posts.likes_count, posts.category_id,
              posts.status_id
       FROM posts
       INNER JOIN categories ON posts.category_id = categories.id
       INNER JOIN statuses   ON posts.status_id   = statuses.id
       ORDER BY posts.date DESC`
    );
    return res.status(200).json({ posts: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch posts', error: error.message });
  }
});

// ✅ GET /posts/:postId  — Public
postRouter.get('/:postId', async (req, res) => {
  const postIdFromClient = req.params.postId;
  try {
    const results = await connectionPool.query(
      `SELECT posts.id, posts.image, categories.name AS category,
              posts.title, posts.description, posts.date, posts.content,
              statuses.status, posts.likes_count, posts.category_id
       FROM posts
       INNER JOIN categories ON posts.category_id = categories.id
       INNER JOIN statuses   ON posts.status_id   = statuses.id
       WHERE posts.id = $1`,
      [postIdFromClient]
    );

    if (!results.rows[0]) {
      return res.status(404).json({ message: `Post id ${postIdFromClient} not found` });
    }
    return res.status(200).json(results.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Server could not read post', error: error.message });
  }
});

// POST /posts  — Public (ถ้าต้องการ protect ให้เพิ่ม protectUser กลับมา)
postRouter.post('/', validatePostData, async (req, res) => {
  const newPost = req.body;
  try {
    await connectionPool.query(
      `INSERT INTO posts (title, image, category_id, description, content, status_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newPost.title, newPost.image, newPost.category_id, newPost.description, newPost.content, newPost.status_id]
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server could not create post', error: error.message });
  }
  return res.status(201).json({ message: 'Created post successfully' });
});

// ✅ PUT /posts/:postId  — ต้องเป็น admin
postRouter.put('/:postId', protectAdmin, validatePostData, async (req, res) => {
  const postIdFromClient = req.params.postId;
  const updatedPost = { ...req.body, date: new Date() };
  try {
    const result = await connectionPool.query(
      `UPDATE posts
       SET title=$2, image=$3, category_id=$4, description=$5,
           content=$6, status_id=$7, date=$8
       WHERE id=$1`,
      [
        postIdFromClient,
        updatedPost.title, updatedPost.image, updatedPost.category_id,
        updatedPost.description, updatedPost.content,
        updatedPost.status_id, updatedPost.date,
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Post id ${postIdFromClient} not found` });
    }
    return res.status(200).json({ message: 'Updated post successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server could not update post', error: error.message });
  }
});

// ✅ DELETE /posts/:postId  — ต้องเป็น admin
postRouter.delete('/:postId', protectAdmin, async (req, res) => {
  const postIdFromClient = req.params.postId;
  try {
    const result = await connectionPool.query(
      `DELETE FROM posts WHERE id=$1`,
      [postIdFromClient]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Post id ${postIdFromClient} not found` });
    }
    return res.status(200).json({ message: 'Deleted post successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server could not delete post', error: error.message });
  }
});

export default postRouter;
