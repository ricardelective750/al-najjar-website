const Product = require('../models/Product');
const CustomOrder = require('../models/CustomOrder');

exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    return res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح إلى المعرض وتحديث القائمة', data: savedProduct });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let queryFilter = {};
    if (category) queryFilter.category = category;
    const products = await Product.find(queryFilter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCustomOrder = async (req, res) => {
  try {
    const newOrder = new CustomOrder(req.body);
    const savedOrder = await newOrder.save();
    return res.status(201).json({ success: true, message: 'تم استلام طلب التصنيع بنجاح وجاري مراجعته', data: savedOrder });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};