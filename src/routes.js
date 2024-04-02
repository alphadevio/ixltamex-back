const DevelopmentRouter = require('./routes/DevelopmentRoute');
const PercentageRouter = require('./routes/PercentageRoutes');
const UserRouter = require('./routes/UserRoutes')

const { Router } = require("express");
const router = Router()


router.use('/user',UserRouter)
router.use('/development',DevelopmentRouter)
router.use('/percentage',PercentageRouter)

module.exports = router;