const express = require('express')
const { Router } = require("express");
const { AccountState } = require('../controllers/AccountStateController')

const AccountStateRoutes = express.Router()

AccountStateRoutes.get('/', AccountState.fetch)
AccountStateRoutes.post('/', AccountState.pdfmake)

module.exports.AccountStateRoutes = AccountStateRoutes