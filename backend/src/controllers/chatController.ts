import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import ChatMessage from '../models/ChatMessage';
import User from '../models/User';
import { broadcastChatMessage } from '../socket/socketHandler';

export const getConversationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!._id;
  const targetUserId = req.params.userId;

  try {
    const messages = await ChatMessage.find({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
    })
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await ChatMessage.updateMany(
      { senderId: targetUserId, receiverId: currentUserId, read: false },
      { read: true }
    );

    res.status(200).json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const senderId = req.user!._id;
  const { receiverId, message } = req.body;

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404).json({ success: false, message: 'Receiver not found' });
      return;
    }

    const chatMessage = await ChatMessage.create({
      senderId,
      receiverId,
      message,
      read: false,
    });

    const populatedMessage = await ChatMessage.findById(chatMessage._id)
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role');

    broadcastChatMessage(populatedMessage);

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
