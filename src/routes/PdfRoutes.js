const express = require('express')
const { PdfController } = require('../controllers/PdfController');

const PdfRoutes = express.Router()

PdfRoutes.post('/:id', PdfController.generate)

module.exports.PdfRoutes = PdfRoutes
