const express = require('express')
const { Router } = require("express");
const { LotController } = require('../controllers/LotController');
const multer = require('multer')

const LotRoutes = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images'); 
  },
  filename: function(req, file, cb) {
    const ext = file.originalname.split('.').pop();
    const filename = new Date().valueOf() + '.' + ext;
    cb(null, filename);
  }
})

const upload = multer({ storage: storage });

LotRoutes.get('/', LotController.fetch)
LotRoutes.post('/', upload.fields([{name:'image', maxCount:1}]),LotController.save)
LotRoutes.put('/', upload.fields([{name:'image', maxCount:1}]),LotController.update)
LotRoutes.delete('/', LotController.destroy)

module.exports.LotRoutes = LotRoutes