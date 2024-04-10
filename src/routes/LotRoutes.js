const express = require('express')
const { Router } = require("express");
const { LotController } = require('../controllers/LotController');

const LotRoutes = express.Router()

LotRoutes.get('/',LotController.fetch)
LotRoutes.post('/',LotController.save)
LotRoutes.put('/',LotController.update)
LotRoutes.delete('/',LotController.destroy)

module.exports.LotRoutes = LotRoutes