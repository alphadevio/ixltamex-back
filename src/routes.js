const { AppleRoutes } = require('./routes/AppleRoutes');
const { ClientRoutes } = require('./routes/ClientRoutes');
const DevelopmentRouter = require('./routes/DevelopmentRoute');
const { LotRoutes } = require('./routes/LotRoutes');
const PercentageRouter = require('./routes/PercentageRoutes');
const { SalesRoutes } = require('./routes/SalesRoutes');
const UserRouter = require('./routes/UserRoutes')
const { PeriodsRoutes } = require('./routes/PeriodsRoutes');
const { PaymentRoutes } = require('./routes/PaymentRoutes');
const { TransactionRoutes } = require('./routes/TransactionRoute');
const { PdfRoutes } = require('./routes/PdfRoutes')
const { AssetRoutes } = require('./routes/AssetRoutes')
const { AccountStateRoutes } = require('./routes/AccountStateRoutes')
const { SpendingsRoutes } = require('./routes/SpendingsRoutes')

const { Router } = require("express");
const router = Router()

router.use('/user',UserRouter)
router.use('/development',DevelopmentRouter)
router.use('/percentage',PercentageRouter)
router.use('/client',ClientRoutes)
router.use('/apple',AppleRoutes)
router.use('/lot',LotRoutes)
router.use('/sale',SalesRoutes)
router.use('/period',PeriodsRoutes)
router.use('/payment',PaymentRoutes)
router.use('/transaction',TransactionRoutes)
router.use('/pdf', PdfRoutes)
router.use('/asset', AssetRoutes)
router.use('/account-state', AccountStateRoutes)
router.use('/spendings', SpendingsRoutes)

module.exports = router;