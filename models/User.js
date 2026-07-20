const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'يرجى إدخال الاسم بالكامل'], trim: true },
  email: { type: String, required: [true, 'يرجى إدخال البريد الإلكتروني'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'يرجى إدخال كلمة المرور'] },
  phone: { type: String, required: [true, 'يرجى إدخال رقم الهاتف للتواصل'] },
  role: { type: String, enum: ['customer', 'admin', 'employee'], default: 'customer' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);