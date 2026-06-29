import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import InventoryItem from '../models/InventoryItem';
import Order from '../models/Order';
import { broadcastLowStockAlert } from '../socket/socketHandler';
import { AuditLogger } from '../services/AuditLogger';

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await InventoryItem.find().sort({ itemName: 1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await InventoryItem.create(req.body);
    await AuditLogger.log(req.user!._id.toString(), 'INVENTORY_ITEM_ADDED', { itemId: item._id, itemName: item.itemName }, req.ip);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInventoryStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const { quantity, minimumThreshold } = req.body;

  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Inventory item not found' });
      return;
    }

    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.minimumThreshold = minimumThreshold !== undefined ? minimumThreshold : item.minimumThreshold;
    item.lastRestocked = new Date();
    await item.save();

    await AuditLogger.log(req.user!._id.toString(), 'INVENTORY_STOCK_UPDATED', { itemId: item._id, quantity: item.quantity }, req.ip);

    if (item.quantity <= item.minimumThreshold) {
      broadcastLowStockAlert(item);
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLowStockAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await InventoryItem.find({ $expr: { $lte: ["$quantity", "$minimumThreshold"] } });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPreparationReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ordersToday = await Order.find({ createdAt: { $gte: startOfDay } }).populate('mealItems.mealId');

    let totalPrepared = 0;
    let totalPackaged = 0;
    let totalDelivered = 0;
    let totalFailed = 0;

    ordersToday.forEach((o) => {
      if (o.preparationStatus === 'Preparing') totalPrepared++;
      if (o.preparationStatus === 'Packaged' || o.preparationStatus === 'ReadyForDelivery') totalPackaged++;
      if (o.preparationStatus === 'Delivered') totalDelivered++;
      if (o.deliveryStatus === 'Failed') totalFailed++;
    });

    // Approximate food wastage based on failed deliveries or unconsumed preps
    const wastageStats = {
      wastedMealsCount: totalFailed,
      estimatedLossAmount: totalFailed * 15.0, // Assuming average $15 per meal
      wastagePercentage: ordersToday.length > 0 ? ((totalFailed / ordersToday.length) * 100).toFixed(1) : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalOrdersToday: ordersToday.length,
        totalPrepared,
        totalPackaged,
        totalDelivered,
        totalFailed,
        wastageStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
