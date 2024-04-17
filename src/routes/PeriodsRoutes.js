const express = require('express')
const { PeriodsController } = require("../controllers/PeriodsController");

const PeriodsRoutes = express.Router()

PeriodsRoutes.post('/',PeriodsController.save)
PeriodsRoutes.get('/',PeriodsController.fetch)


module.exports.PeriodsRoutes = PeriodsRoutes