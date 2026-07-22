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

connectDB();

const app = express();
app.use(express.json());

// تشغيل وخدمة واجهة الويب الأمامية والمرفوعات مباشرة بالمسار المطلق المتوافق مع Vercel
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

// تغذية قاعدة البيانات تلقائياً بأرقى المنتجات والمدير الرئيسي الافتراضي
const seedSampleProducts = async () => {
  try {
    // 1. تغذية أو تحديث حساب المدير الرئيسي الافتراضي
    const adminEmail = 'admin@najjar.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      await User.create({
        name: 'المدير العام',
        email: adminEmail,
        password: 'admin_najjar_123',
        phone: '01060344580',
        role: 'admin'
      });
      console.log('[Auto-Seeder] تم إنشاء حساب المدير الرئيسي الافتراضي بنجاح!');
    } else {
      adminUser.password = 'admin_najjar_123';
      await adminUser.save();
      console.log('[Auto-Seeder] تم التحقق من حساب المدير وإعادة تعيين الباسوورد الافتراضي بنجاح!');
    }

    // 2. تغذية المنتجات الافتراضية
    const count = await Product.countDocuments();
    if (count === 0) {
      const sampleData = [
        {
          title: 'غرفة نوم الملكة الفاخرة',
          description: 'غرفة نوم كاملة مودرن بتفاصيل مذهبة وألوان متناسقة تناسب ذوقك الرفيع، مصنوعة بالكامل من الخشب الطبيعي المجفف.',
          price: 45000,
          discountPrice: 33750,
          category: 'غرف نوم',
          woodType: 'خشب زان أحمر فرنسي',
          dimensions: 'سرير 180سم - دولاب 280سم',
          images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600']
        },
        {
          title: 'غرفة نوم الأطفال ميكي السحرية',
          description: 'غرفة نوم أطفال مبهجة بتصميم عصري ملون، تشمل سريرين ودولاب مدمج بتفاصيل محببة ومقاومة لحركة الأطفال.',
          price: 22000,
          discountPrice: 16500,
          category: 'غرف أطفال',
          woodType: 'خشب سويدي متين كبس',
          dimensions: 'سرير 120سم - دولاب 160سم',
          images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600']
        },
        {
          title: 'صالون قصر النبلاء المذهب',
          description: 'صالون كلاسيكي فخم مذهب بأيدي أمهر الصناع بدمياط، وحياكة فاخرة تليق بقاعات استقبال الضيوف.',
          price: 38000,
          discountPrice: 28500,
          category: 'انتريه',
          woodType: 'زان روماني مذهب',
          dimensions: 'كنبة 3 مقاعد، كنبة مقعدين، و2 فوتيه مع طاولة مذهبة',
          images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600']
        },
        {
          title: 'سفرة فرساي الملكية مع 8 كراسي',
          description: 'طاولة سفرة فخمة مع 8 كراسي مبطنة بنسيج قطني فاخر، تتميز بزجاج حراري مقاوم للصدمات.',
          price: 32000,
          discountPrice: 24000,
          category: 'سفرة',
          woodType: 'زان أحمر طبيعي متين',
          dimensions: 'طول 220سم - عرض 110سم',
          images: ['https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=600']
        }
      ];
      await Product.insertMany(sampleData);
      console.log('[Auto-Seeder] تم تعبئة المعرض بـ 4 منتجات تجريبية فاخرة بنجاح!');
    }
  } catch (err) {
    console.error('[Seeder Error] فشل التغذية التلقائية: ' + err.message);
  }
};

seedSampleProducts();

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