const express = require('express')
const { SalesController } = require("../controllers/SalesController");

const SalesRoutes = express.Router()

SalesRoutes.post('/',SalesController.save)

module.exports.SalesRoutes = SalesRoutes