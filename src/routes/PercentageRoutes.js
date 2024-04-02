const express = require('express')
const { PercentageController } = require('../controllers/PercentageContoller')
const PercentageRouter = express.Router()

PercentageRouter.get('/',PercentageController.fetch)
PercentageRouter.post('/',PercentageController.save)
PercentageRouter.put('/',PercentageController.update)
PercentageRouter.delete('/',PercentageController.destroy)
PercentageRouter.get('/remaining',PercentageController.remaining)

module.exports = PercentageRouter