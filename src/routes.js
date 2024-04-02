const DevelopmentRouter = require('./routes/DevelopmentRoute');
const UserRouter = require('./routes/UserRoutes')

const { Router } = require("express");
const router = Router()


router.use('/user',UserRouter)
router.use('/development',DevelopmentRouter)

module.exports = router;