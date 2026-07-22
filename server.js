const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/Product');
const CustomOrder = require('./models/CustomOrder');
const User = require('./models/User');

dotenv.config();

const app = express();
app.use(express.json());

// فحص وتأمين الاتصال بقاعدة البيانات قبل معالجة أي طلب لمسارات الـ API فقط (للحفاظ على سرعة تقديم الملفات الساكنة واستقرار الخادم)
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

// خدمة واجهة الويب الأمامية والمرفوعات مباشرة بالمسار المطلق المتوافق مع Vercel
app.use(express.static(path.join(__dirname, 'public')));

// إعداد خزان رفع الصور والفيديوهات من الجهاز المحلي (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// نقطة رفع الملفات المحلية من جهاز المدير
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'لم يتم اختيار أي ملف.' });
  }
  return res.json({ success: true, url: '/uploads/' + req.file.filename });
});

// تسجيل الدخول للمدراء والموظفين ومطابقة كلمة المرور مع إزالة حساسية الحروف الكبيرة والصغيرة ومسح المسافات
app.post('/api/users/login', async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.toLowerCase().trim();
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }
    return res.json({
      success: true,
      message: 'مرحباً بك مجدداً ' + user.name,
      user: { name: user.name, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// جلب كافة طلبات العمولة والورشة للإدارة
app.get('/api/custom-orders', async (req, res) => {
  try {
    const orders = await CustomOrder.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// تحديث تفاصيل طلب العمولة (المالية، نسبة الإنجاز والمواعيد)
app.put('/api/custom-orders/:id', async (req, res) => {
  try {
    const updatedOrder = await CustomOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// حذف وإلغاء طلب عمولة نهائياً من الإدارة
app.delete('/api/custom-orders/:id', async (req, res) => {
  try {
    const deletedOrder = await CustomOrder.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'طلب العمولة غير موجود في النظام.' });
    }
    return res.status(200).json({ success: true, message: 'تم حذف طلب العمولة بنجاح.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// مسار إداري خاص لحذف قطع الأثاث من المعرض سحابياً
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود.' });
    }
    return res.status(200).json({ success: true, message: 'تم إزالة المنتج بنجاح.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// جلب كافة الموظفين والمدراء (خاص بالآدمن فقط)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// سحب صلاحيات وحذف حساب موظف نهائياً (خاص بالآدمن فقط - حساب المدير محمي تلقائياً)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.email === 'admin@najjar.com') {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف الحساب الإداري الرئيسي للمعرض لحماية النظام.' });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'تم حذف الموظف بنجاح وسحب كافة الصلاحيات.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// إضافة حسابات موظفين ومدراء جدد في النظام
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    return res.status(201).json({ success: true, message: 'تم تفعيل الحساب بنجاح', data: savedUser });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.use('/api/products', productRoutes);

// تشغيل الاستماع محلياً فقط وتفادي تشغيله على Vercel لمنع الـ Crash
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('--------------------------------------------------');
    console.log('Server is running locally on port: ' + PORT);
    console.log('--------------------------------------------------');
  });
}

// تصدير الخادم السحابي لمنصة Vercel لمنع أخطاء البناء
module.exports = app;