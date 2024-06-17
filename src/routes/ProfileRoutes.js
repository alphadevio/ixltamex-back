const express = require('express')
const { ProfileController } = require("../controllers/ProfileController");

const ProfileRoutes = express.Router()

ProfileRoutes.get('/',ProfileController.fetch)


module.exports.ProfileRoutes = ProfileRoutes