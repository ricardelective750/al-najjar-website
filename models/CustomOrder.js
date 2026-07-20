const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema({
  customerName: { type: String, required: [true, 'يرجى إدخال اسم العميل'] },
  customerPhone: { type: String, required: [true, 'يرجى إدخال رقم الهاتف'] },
  title: { type: String, required: [true, 'يرجى كتابة نوع الأثاث المطلوب'] },
  details: { type: String, required: [true, 'يرجى كتابة تفاصيل ومقاسات طلبك'] },
  woodTypeRequested: { type: String, required: [true, 'يرجى تحديد نوع الخشب'] },
  estimatedBudget: { type: Number, default: 0 },
  
  costPrice: { type: Number, default: 0 },         
  sellingPrice: { type: Number, default: 0 },      
  amountPaid: { type: Number, default: 0 },        
  deliveryDate: { type: String, default: '' },     
  completionPercentage: { type: Number, default: 0 }, 
  
  status: { type: String, default: 'قيد المراجعة' }
}, { timestamps: true });

module.exports = mongoose.model('CustomOrder', customOrderSchema);