import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import api from '../services/api';
import { initSocket } from '../services/socket';
import { IChatMessage } from '../types';
import { Send, User } from 'lucide-react';

interface ChatBoxProps {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ targetUserId, targetUserName, targetUserRole }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetUserId) return;
    fetchMessages();

    const socket = initSocket();

    const handleNewMessage = (msg: IChatMessage) => {
      if (
        (msg.senderId._id === targetUserId && msg.receiverId._id === user?.id) ||
        (msg.senderId._id === user?.id && msg.receiverId._id === targetUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/${targetUserId}`);
      setMessages(res.data.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post('/chat/send', {
        receiverId: targetUserId,
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-brand-700 text-white shadow-sm">
        <div className="p-2 bg-brand-600 rounded-full border border-brand-500">
          <User className="w-5 h-5 text-brand-100" />
        </div>
        <div>
          <h4 className="font-bold text-base leading-tight">{targetUserName}</h4>
          <p className="text-xs text-brand-200 font-medium">{targetUserRole}</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-4">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No messages yet. Start the conversation below!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId._id === user?.id;
            return (
              <div
                key={msg._id}
                className={`flex flex-col max-w-[75%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write your message..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium shadow-md shadow-brand-900/20 transition flex items-center gap-2 text-sm"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
