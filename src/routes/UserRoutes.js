const express = require('express')
const { UserController } = require('../controllers/UserController')
const UserRouter = express.Router()

const { verifyToken } = require('../middleware/verifyToken')

UserRouter.get('/', verifyToken, UserController.fetch)
UserRouter.post('/', verifyToken, UserController.save)
UserRouter.put('/:id', verifyToken, UserController.update)
UserRouter.delete('/', verifyToken, UserController.destroy)
UserRouter.post('/login', UserController.login)

module.exports = UserRouter