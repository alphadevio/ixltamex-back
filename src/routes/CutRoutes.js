const express = require('express')
const { Router } = require("express");
const { CutController } = require('../controllers/CutController')

const CutRoutes = express.Router()

CutRoutes.post('/', CutController.getCut)


module.exports.CutRoutes = CutRoutes