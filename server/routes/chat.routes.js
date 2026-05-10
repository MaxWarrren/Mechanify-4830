const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const sessionController = require('../controllers/chatSession.controller');

router.route('/sessions')
  .get(sessionController.listSessions)
  .post(sessionController.createSession);

router.route('/sessions/:id')
  .get(sessionController.getSession)
  .patch(sessionController.updateSession)
  .delete(sessionController.deleteSession);

router.post('/', chatController.handleChat);

module.exports = router;
