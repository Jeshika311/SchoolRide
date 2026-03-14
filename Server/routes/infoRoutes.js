import express from 'express';
import { getPrivacy, getTerms } from '../controllers/infoController.js';

const router = express.Router();

router.get('/privacy', getPrivacy);
router.get('/terms', getTerms);

export default router;