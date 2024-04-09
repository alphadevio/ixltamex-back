const { AppleRoutes } = require('./routes/AppleRoutes');
const { ClientRoutes } = require('./routes/ClientRoutes');
const DevelopmentRouter = require('./routes/DevelopmentRoute');
const PercentageRouter = require('./routes/PercentageRoutes');
const UserRouter = require('./routes/UserRoutes')

const { Router } = require("express");
const router = Router()


router.use('/user',UserRouter)
router.use('/development',DevelopmentRouter)
router.use('/percentage',PercentageRouter)
router.use('/client',ClientRoutes)
router.use('/apple',AppleRoutes)

module.exports = router;