const express = require('express')
const { TransactionController } = require('../controllers/TransactionController')

const TransactionRoutes = express.Router()

TransactionRoutes.get('/',TransactionController.fetch)
TransactionRoutes.put('/:id',TransactionController.refund)
TransactionRoutes.get('/:id_transaction',TransactionController.fetchById)

module.exports.TransactionRoutes = TransactionRoutes