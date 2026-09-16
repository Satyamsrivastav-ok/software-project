import { Response } from 'express';
import { NotificationModel } from '../models/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const notifications = NotificationModel.find({ userId: req.user._id });
    // Sort newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.filter(n => !n.read).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      const userNotes = NotificationModel.find({ userId: req.user?._id });
      userNotes.forEach(n => {
        NotificationModel.findByIdAndUpdate(n._id, { read: true });
      });
      return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    }

    const updated = NotificationModel.findByIdAndUpdate(id, { read: true });
    return res.status(200).json({ success: true, notification: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error updating notification' });
  }
};
