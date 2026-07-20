const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.post('/custom-order', productController.createCustomOrder);

module.exports = router;