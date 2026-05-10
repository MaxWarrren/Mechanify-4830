const express = require('express');
const router = express.Router();
const multer = require('multer');
const knowledgeController = require('../controllers/knowledge.controller');

// Configure multer to store files in memory as Buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', knowledgeController.getManuals);
router.post('/upload', upload.single('file'), knowledgeController.uploadManual);
router.delete('/:id', knowledgeController.deleteManual);

module.exports = router;
