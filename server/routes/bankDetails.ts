import express from 'express';
import { BankDetails } from '../models/BankDetails';

const router = express.Router();

// Get all bank details for a user
router.get('/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    const bankDetails = await BankDetails.find({ phone }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      bankDetails: bankDetails.map(detail => ({
        id: detail._id,
        type: detail.type,
        name: detail.name,
        details: detail.details,
        isDefault: detail.isDefault,
        createdAt: detail.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create new bank details
router.post('/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { type, name, details, isDefault } = req.body;
    
    // Validate required fields
    if (!type || !name || !details) {
      return res.status(400).json({ success: false, error: 'Type, name, and details are required' });
    }
    
    // Validate details based on type
    if (type === 'upi' && !details.upiId) {
      return res.status(400).json({ success: false, error: 'UPI ID is required for UPI type' });
    }
    
    if (type === 'bank' && (!details.accountNumber || !details.ifscCode || !details.accountHolderName)) {
      return res.status(400).json({ success: false, error: 'Account number, IFSC code, and account holder name are required for bank type' });
    }
    
    if (type === 'qr' && !details.qrCodeUrl) {
      return res.status(400).json({ success: false, error: 'QR code URL is required for QR type' });
    }
    
    // If setting as default, remove default from other entries
    if (isDefault) {
      await BankDetails.updateMany({ phone }, { isDefault: false });
    }
    
    const bankDetail = new BankDetails({
      phone,
      type,
      name,
      details,
      isDefault: isDefault || false,
    });
    
    await bankDetail.save();
    
    res.json({
      success: true,
      bankDetail: {
        id: bankDetail._id,
        type: bankDetail.type,
        name: bankDetail.name,
        details: bankDetail.details,
        isDefault: bankDetail.isDefault,
        createdAt: bankDetail.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating bank details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update bank details
router.put('/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { id, type, name, details, isDefault } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Bank detail ID is required' });
    }
    
    // If setting as default, remove default from other entries
    if (isDefault) {
      await BankDetails.updateMany({ phone }, { isDefault: false });
    }
    
    const bankDetail = await BankDetails.findOneAndUpdate(
      { _id: id, phone },
      { type, name, details, isDefault },
      { new: true }
    );
    
    if (!bankDetail) {
      return res.status(404).json({ success: false, error: 'Bank detail not found' });
    }
    
    res.json({
      success: true,
      bankDetail: {
        id: bankDetail._id,
        type: bankDetail.type,
        name: bankDetail.name,
        details: bankDetail.details,
        isDefault: bankDetail.isDefault,
        createdAt: bankDetail.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete bank details
router.delete('/:phone/:id', async (req, res) => {
  try {
    const { phone, id } = req.params;
    
    const bankDetail = await BankDetails.findOneAndDelete({ _id: id, phone });
    
    if (!bankDetail) {
      return res.status(404).json({ success: false, error: 'Bank detail not found' });
    }
    
    res.json({ success: true, message: 'Bank detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Set default bank details
router.put('/:phone/:id/default', async (req, res) => {
  try {
    const { phone, id } = req.params;
    
    // Remove default from all entries
    await BankDetails.updateMany({ phone }, { isDefault: false });
    
    // Set the specified entry as default
    const bankDetail = await BankDetails.findOneAndUpdate(
      { _id: id, phone },
      { isDefault: true },
      { new: true }
    );
    
    if (!bankDetail) {
      return res.status(404).json({ success: false, error: 'Bank detail not found' });
    }
    
    res.json({ success: true, message: 'Default payment method updated' });
  } catch (error) {
    console.error('Error setting default bank details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
