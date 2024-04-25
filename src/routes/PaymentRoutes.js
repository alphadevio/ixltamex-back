const express = require('express')
const { PaymentController } = require('../controllers/PaymentController');


const PaymentRoutes = express.Router()

PaymentRoutes.put('/pay', PaymentController.pay)

module.exports.PaymentRoutes = PaymentRoutes
