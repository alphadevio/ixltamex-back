const express = require('express')
const { DevelopmentController } = require('../controllers/DevelopmentController')
const DevelopmentRouter = express.Router()

DevelopmentRouter.get('/',DevelopmentController.fetch)
DevelopmentRouter.post('/',DevelopmentController.save)
DevelopmentRouter.put('/',DevelopmentController.update)
DevelopmentRouter.delete('/',DevelopmentController.destroy)

module.exports = DevelopmentRouter