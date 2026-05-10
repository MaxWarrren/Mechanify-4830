const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');

router.route('/')
  .get(jobController.getJobs)
  .post(jobController.createJob);

router.route('/:id')
  .get(jobController.getJob)
  .put(jobController.updateJob)
  .delete(jobController.deleteJob);

module.exports = router;
