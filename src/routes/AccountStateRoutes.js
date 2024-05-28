const express = require('express')
const { Router } = require("express");
const { AccountState } = require('../controllers/AccountStateController')

const AccountStateRoutes = express.Router()

AccountStateRoutes.get('/', AccountState.fetch)

module.exports.AccountStateRoutes = AccountStateRoutes