import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { config } from '../config/env';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json(ApiResponse.error('Username and password are required'));
    return;
  }

  try {
    const userRes = await query(
      `SELECT user_id, username, password, full_name, role, status
       FROM frm_admin_user
       WHERE username = $1 AND status = 'ACTIVE'
       LIMIT 1`,
      [username]
    );

    if (userRes.rows.length === 0) {
      logger.warn(`Login failed: user '${username}' not found or inactive`);
      res.status(401).json(ApiResponse.error('Invalid credentials'));
      return;
    }

    const user = userRes.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      logger.warn(`Login failed: invalid password for '${username}'`);
      res.status(401).json(ApiResponse.error('Invalid credentials'));
      return;
    }

    const token = jwt.sign(
      {
        sub: user.username,
        role: user.role,
        fullName: user.full_name,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`User logged in successfully: ${user.username} (${user.role})`);

    res.json({
      token,
      username: user.username,
      fullName: user.full_name || '',
      role: user.role,
    });
  } catch (err: any) {
    logger.error(`Login error for '${username}': ${err.message}`);
    res.status(500).json(ApiResponse.error('Authentication service failure'));
  }
});

export default router;

