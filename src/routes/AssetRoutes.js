const express = require('express')
const { Router } = require("express");
const { AssetController } = require('../controllers/AssetController')

const AssetRoutes = express.Router()

AssetRoutes.get('/',AssetController.fetch)
AssetRoutes.post('/',AssetController.save)
AssetRoutes.put('/:id',AssetController.update)
AssetRoutes.delete('/:id',AssetController.destroy)

module.exports.AssetRoutes = AssetRoutes