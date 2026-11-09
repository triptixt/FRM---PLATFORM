import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';

const router = Router();

router.get('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const username = req.query.username as string;
  const newPassword = req.query.newPassword as string;

  if (!username || !newPassword) {
    res.status(400).json({ error: 'username and newPassword query parameters required' });
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const result = await query(
      `UPDATE frm_admin_user SET password = $1 WHERE username = $2 RETURNING user_id`,
      [hash, username]
    );

    res.json({
      message: result.rows.length > 0 ? 'Password updated' : 'User not found',
      username,
      hashLength: hash.length,
      hashPrefix: hash.substring(0, 7),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth-check', async (req: Request, res: Response): Promise<void> => {
  const username = req.query.username as string;
  const password = req.query.password as string;

  if (!username || !password) {
    res.status(400).json({ error: 'username and password query parameters required' });
    return;
  }

  try {
    const result = await query(
      `SELECT user_id, username, password, role, status FROM frm_admin_user WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      res.json({ found: false });
      return;
    }

    const u = result.rows[0];
    const matches = await bcrypt.compare(password, u.password);

    res.json({
      found: true,
      username: u.username,
      role: u.role,
      status: u.status,
      hashLength: u.password ? u.password.length : 0,
      hashPrefix: u.password && u.password.length > 6 ? u.password.substring(0, 7) : 'short',
      passwordMatches: matches,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

