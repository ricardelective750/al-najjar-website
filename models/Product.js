const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'اسم المنتج مطلوب باللغة العربية'], trim: true },
  description: { type: String, required: [true, 'وصف المنتج مطلوب باللغة العربية'] },
  price: { type: Number, required: [true, 'سعر المنتج مطلوب بالجنيه المصري'] },
  discountPrice: { type: Number, default: 0 },
  images: [{ type: String, required: [true, 'يرجى إضافة صورة للمنتج'] }],
  category: { type: String, required: [true, 'يرجى اختيار القسم الرئيسي'] },
  dimensions: { type: String, trim: true },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);