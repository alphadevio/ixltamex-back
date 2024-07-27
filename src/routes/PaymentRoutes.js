const express = require('express')
const { PaymentController } = require('../controllers/PaymentController');


const PaymentRoutes = express.Router()

PaymentRoutes.put('/pay', PaymentController.pay)
PaymentRoutes.put('/pay-bulk', PaymentController.payBulk)

module.exports.PaymentRoutes = PaymentRoutes
