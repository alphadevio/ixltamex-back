const UserRouter = require('./routes/UserRoutes')

const { Router } = require("express");
const router = Router()


router.use('/user',UserRouter)

module.exports = router;