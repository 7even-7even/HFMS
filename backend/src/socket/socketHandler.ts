import { Server, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';

let io: Server;

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'production_super_secret_jwt_key_hfms_2026') as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.name} (${user.role}) [Socket: ${socket.id}]`);

    // Set user as online in DB for real-time tracking
    await User.findByIdAndUpdate(user._id, { isOnline: true });
    io.emit('userStatusChange', { userId: user._id, isOnline: true, role: user.role });

    // Join specific role room for broadcasts
    socket.join(user.role);
    socket.join(user._id.toString());

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.name} (${user.role}) [Socket: ${socket.id}]`);
      await User.findByIdAndUpdate(user._id, { isOnline: false });
      io.emit('userStatusChange', { userId: user._id, isOnline: false, role: user.role });
    });

    // Client join custom chat or order rooms
    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const broadcastOrderUpdate = (order: any) => {
  if (!io) return;
  io.to('Admin').to('Pantry').to('Delivery').to(order.patientId.toString()).emit('orderUpdate', order);
};

export const broadcastLowStockAlert = (item: any) => {
  if (!io) return;
  io.to('Admin').to('Pantry').emit('lowStockAlert', item);
};

export const broadcastChatMessage = (message: any) => {
  if (!io) return;
  io.to(message.receiverId.toString()).to(message.senderId.toString()).emit('newMessage', message);
};
