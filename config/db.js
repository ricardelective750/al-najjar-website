const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const seedSampleProducts = async () => {
  try {
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

    const count = await Product.countDocuments();
    if (count === 0) {
      const sampleData = [
        {
          title: 'غرفة نوم الملكة الفاخرة',
          description: 'غرفة نوم كاملة مودرن بتفاصيل مذهبة وألوان متناسقة تناسب ذوقك الرفيع، مصنوعة بالكامل من الخشب الطبيعي المجفف.',
          price: 45000,
          discountPrice: 33750,
          category: 'غرف نوم',
          dimensions: 'سرير 180سم - دولاب 280سم',
          images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600']
        },
        {
          title: 'غرفة نوم الأطفال ميكي السحرية',
          description: 'غرفة نوم أطفال مبهجة بتصميم عصري ملون، تشمل سريرين ودولاب مدمج بتفاصيل محببة ومقاومة لحركة الأطفال.',
          price: 22000,
          discountPrice: 16500,
          category: 'غرف أطفال',
          dimensions: 'سرير 120سم - دولاب 160سم',
          images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600']
        },
        {
          title: 'صالون قصر النبلاء المذهب',
          description: 'صالون كلاسيكي فخم مذهب بأيدي أمهر الصناع بدمياط، وحياكة فاخرة تليق بقاعات استقبال الضيوف.',
          price: 38000,
          discountPrice: 28500,
          category: 'انتريه',
          dimensions: 'كنبة 3 مقاعد، كنبة مقعدين، و2 فوتيه مع طاولة مذهبة',
          images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600']
        },
        {
          title: 'سفرة فرساي الملكية مع 8 كراسي',
          description: 'طاولة سفرة فخمة مع 8 كراسي مبطنة بنسيج قطني فاخر، تتميز بزجاج حراري مقاوم للصدمات.',
          price: 32000,
          discountPrice: 24000,
          category: 'سفرة',
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

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('Database already connected (State: 1)');
    return;
  }
  if (mongoose.connection.readyState === 2) {
    console.log('Database is connecting (State: 2)... Waiting.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Database connected successfully: ' + conn.connection.host);
    await seedSampleProducts();
  } catch (error) {
    console.error('Database connection failed: ' + error.message);
  }
};

module.exports = connectDB;