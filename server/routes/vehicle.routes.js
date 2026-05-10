const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');

router.route('/')
  .get(vehicleController.getVehicles)
  .post(vehicleController.createVehicle);

router.route('/:id')
  .get(vehicleController.getVehicle)
  .put(vehicleController.updateVehicle)
  .delete(vehicleController.deleteVehicle);

module.exports = router;
