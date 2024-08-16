const express = require('express')
const { SmsLogsController } = require("../controllers/SmsLogsController");

const SmsLogsRoutes = express.Router()

SmsLogsRoutes.get('/',SmsLogsController.fetch)

module.exports.SmsLogsRoutes = SmsLogsRoutes