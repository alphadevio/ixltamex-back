const express = require('express')
const { SpendingsController } = require("../controllers/SpendingsController");

const SpendingsRoutes = express.Router()

SpendingsRoutes.post('/',SpendingsController.save)
SpendingsRoutes.get('/',SpendingsController.fetch)
SpendingsRoutes.put('/:id',SpendingsController.update)
SpendingsRoutes.delete('/:id',SpendingsController.destroy)
SpendingsRoutes.post('/sms/:userId', SpendingsController.sms)
SpendingsRoutes.post('/pdf/:spendingId', SpendingsController.generatePDF)
SpendingsRoutes.get('/verify/:code', SpendingsController.verifySMS)
SpendingsRoutes.get('/control-sms', SpendingsController.SMScontrol)

module.exports.SpendingsRoutes = SpendingsRoutes