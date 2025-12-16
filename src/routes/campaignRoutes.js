const express = require('express');
const router = express.Router();
const auth = require('@middlewares/authMiddleware');
const {
    create_campaign,
    getCampaignByCompany,
    deleteCampaignById,
    getCampaignById,
    updateCampaign
} = require('@controllers/campaignController');
const { upload } = require('@services/fileUpload');

router.post('/create-campaign', auth('admin', 'user', 'company'),upload.single('photo'), create_campaign);
router.post('/update', auth('admin', 'user', 'company'),upload.single('photo'), updateCampaign);
router.get('/getCampaignByCompany', auth('admin', 'user', 'company'), getCampaignByCompany);
router.delete('/delete/:id', auth('admin', 'user', 'company'), deleteCampaignById);
router.get('/:id', auth('admin', 'user', 'company'), getCampaignById);


module.exports = router;