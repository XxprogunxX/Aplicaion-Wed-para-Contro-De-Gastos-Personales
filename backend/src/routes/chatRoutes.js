const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');

router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);
router.post('/', chatController.sendMessage);

module.exports = router;
