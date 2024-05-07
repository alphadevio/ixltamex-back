const express = require('express')
const { TransactionController } = require('../controllers/TransactionController')

const TransactionRoutes = express.Router()

TransactionRoutes.get('/',TransactionController.fetch)
TransactionRoutes.put('/:id',TransactionController.refund)


module.exports.TransactionRoutes = TransactionRoutes