const express = require('express');
const router = express.Router();
const auth = require('@middlewares/authMiddleware');
const { upload } = require('@services/fileUpload');
const {
    create_product,
    getProductByCompany,
    deleteProductById,
    getProductById,
    updateProduct,
    getProductCountByCampaign,
    getAllProducts,
    getProductForWebsite,
    updateProductStatus
} = require('@controllers/productController');

router.get('/products', getAllProducts);
router.get('/website/details', getProductForWebsite);

router.post('/create-product', auth('admin', 'user', 'company'), upload.single('product_image'), create_product);
router.post('/update', auth('admin', 'user', 'company'), upload.single('product_image'), updateProduct);
router.put('/:id/status', auth('admin'), updateProductStatus);
router.get('/getProductByCompany', auth('admin', 'user', 'company'), getProductByCompany);
router.get('/count/:campaign_id', auth('admin', 'user', 'company'), getProductCountByCampaign);
router.delete('/delete/:id', auth('admin', 'user', 'company'), deleteProductById);
router.get('/:id', auth('admin', 'user', 'company'), getProductById);


module.exports = router;