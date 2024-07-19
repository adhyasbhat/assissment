const express = require('express');
const multer = require('multer');
const { inputCSV, getStatus,getOutputCSV } = require('../Controllers/controllers');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/inputCSV', upload.single('inputCSV'), inputCSV);
router.get('/status/:requestId', getStatus);
router.get('/outputCSV/:requestId', getOutputCSV);
module.exports = router;
