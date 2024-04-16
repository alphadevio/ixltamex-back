const express = require('express')
const { SalesController } = require("../controllers/SalesController");

const SalesRoutes = express.Router()

SalesRoutes.post('/',SalesController.save)
SalesRoutes.get('/',SalesController.fetch)
SalesRoutes.put('/',SalesController.update)

module.exports.SalesRoutes = SalesRoutes