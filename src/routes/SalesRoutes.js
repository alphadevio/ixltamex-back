const express = require('express')
const { SalesController } = require("../controllers/SalesController");

const SalesRoutes = express.Router()

SalesRoutes.post('/',SalesController.save)
SalesRoutes.get('/',SalesController.fetch)
SalesRoutes.put('/',SalesController.update)
SalesRoutes.delete('/:id',SalesController.destroy)

module.exports.SalesRoutes = SalesRoutes