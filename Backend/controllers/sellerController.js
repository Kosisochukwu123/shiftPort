// sellerController.js – FIXED VERSION
const cloudinary = require('../config/cloudinary');
const Seller = require('../models/Seller');

exports.updateProfile = async (req, res) => {
  try {
    // Use req.seller from your protect middleware (you updated it to req.seller)
    const sellerId = req.seller._id;

    const updates = {};

    // Text fields from form
    if (req.body.businessPhone !== undefined) updates.businessPhone = req.body.businessPhone.trim();
    if (req.body.whatsapp !== undefined) updates.whatsapp = req.body.whatsapp.trim();
    if (req.body.instagram !== undefined) updates.instagram = req.body.instagram.trim();

    // Optional: support more fields from your model
    if (req.body.fullName) updates.fullName = req.body.fullName.trim();
    if (req.body.phone) updates.phone = req.body.phone.trim();
    if (req.body.businessName) updates.businessName = req.body.businessName.trim();

    // ── Logo upload to Cloudinary ────────────────────────────────────────
    if (req.file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'sellers-logos',
            transformation: [{ width: 400, height: 400, crop: 'limit' }],
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      const result = await uploadPromise;
      updates.logo = result.secure_url;
    }

    // Update the seller document
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedSeller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      seller: updatedSeller,
    });
  } catch (error) {
    console.error('[updateProfile error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};