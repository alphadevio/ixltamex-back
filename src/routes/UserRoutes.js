const express = require('express')
const { UserController } = require('../controllers/UserController')
const UserRouter = express.Router()

UserRouter.get('/',UserController.fetch)
UserRouter.post('/',UserController.save)
UserRouter.put('/',UserController.update)
UserRouter.delete('/',UserController.destroy)

module.exports = UserRouter