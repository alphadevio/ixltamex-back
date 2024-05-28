const express = require('express')
const { SpendingsController } = require("../controllers/SpendingsController");

const SpendingsRoutes = express.Router()

SpendingsRoutes.post('/',SpendingsController.save)
SpendingsRoutes.get('/',SpendingsController.fetch)
SpendingsRoutes.put('/:id',SpendingsController.update)
SpendingsRoutes.delete('/:id',SpendingsController.destroy)

module.exports.SpendingsRoutes = SpendingsRoutes