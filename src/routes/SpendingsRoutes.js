const express = require('express')
const { SpendingsController } = require("../controllers/SpendingsController");

const SpendingsRoutes = express.Router()

SpendingsRoutes.post('/',SpendingsController.save)
SpendingsRoutes.get('/',SpendingsController.fetch)
SpendingsRoutes.put('/:id',SpendingsController.update)
SpendingsRoutes.delete('/:id',SpendingsController.destroy)
SpendingsRoutes.get('/sms', SpendingsController.sms)
SpendingsRoutes.post('/pdf/:spendingId', SpendingsController.generatePDF)

module.exports.SpendingsRoutes = SpendingsRoutes