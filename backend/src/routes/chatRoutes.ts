import express from 'express';
import { getConversationHistory, sendMessage } from '../controllers/chatController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/:userId', authenticate, getConversationHistory);
router.post('/send', authenticate, sendMessage);

export default router;
