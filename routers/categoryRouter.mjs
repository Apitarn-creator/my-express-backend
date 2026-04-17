import { Router } from 'express';
import connectionPool from '../utils/db.mjs';
import protectAdmin from '../middlewares/protectAdmin.mjs';

const categoryRouter = Router();

// GET /categories — Public
categoryRouter.get('/', async (_req, res) => {
  try {
    const result = await connectionPool.query(
      `SELECT id, name FROM categories ORDER BY id ASC`
    );
    return res.status(200).json({ categories: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch categories', error: error.message });
  }
});

// POST /categories — Admin only
categoryRouter.post('/', protectAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'name is required' });
  try {
    const result = await connectionPool.query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name.trim()]
    );
    return res.status(201).json({ message: 'Category created', category: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Could not create category', error: error.message });
  }
});

// PUT /categories/:id — Admin only
categoryRouter.put('/:id', protectAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'name is required' });
  try {
    const result = await connectionPool.query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
      [name.trim(), req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json({ message: 'Category updated', category: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update category', error: error.message });
  }
});

// DELETE /categories/:id — Admin only
categoryRouter.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const result = await connectionPool.query(
      `DELETE FROM categories WHERE id = $1`,
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete category', error: error.message });
  }
});

export default categoryRouter;
