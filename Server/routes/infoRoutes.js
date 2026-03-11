import express from 'express';
import { getPrivacy, getTerms } from '../controllers/infoController.js';

const router = express.Router();

/**
 * @swagger
 * /privacy:
 *   get:
 *     summary: Get privacy policy text
 *     responses:
 *       200:
 *         description: Privacy policy
 */
router.get('/privacy', getPrivacy);

/**
 * @swagger
 * /terms:
 *   get:
 *     summary: Get terms of service text
 *     responses:
 *       200:
 *         description: Terms of service
 */
router.get('/terms', getTerms);

export default router;
