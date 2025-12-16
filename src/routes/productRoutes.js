const express = require('express');
const router = express.Router();
const auth = require('@middlewares/authMiddleware');
const {
    create_product,
    getProductByCompany,
    deleteProductById,
    getProductById,
    updateProduct
} = require('@controllers/productController');

router.post('/create-product', auth('admin', 'user', 'company'), create_product);
router.post('/update', auth('admin', 'user', 'company'), updateProduct);
router.get('/getProductByCompany', auth('admin', 'user', 'company'), getProductByCompany);
router.delete('/delete/:id', auth('admin', 'user', 'company'), deleteProductById);
router.get('/:id', auth('admin', 'user', 'company'), getProductById);


module.exports = router;