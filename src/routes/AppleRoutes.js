const express = require('express')
const { Router } = require("express");
const { AppleController } = require('../controllers/AppleController')

const AppleRoutes = express.Router()

AppleRoutes.get('/',AppleController.fetch)
AppleRoutes.post('/',AppleController.save)
AppleRoutes.put('/',AppleController.update)
AppleRoutes.delete('/',AppleController.destroy)

module.exports.AppleRoutes = AppleRoutes