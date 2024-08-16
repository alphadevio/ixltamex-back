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
const { CutRoutes } = require('./routes/CutRoutes')
const { ProfileRoutes } = require('./routes/ProfileRoutes')
const { SmsLogsRoutes } = require ('./routes/SmsLogsRoutes')

const { verifyToken } = require('./middleware/verifyToken')

const { Router } = require("express");
const router = Router()

router.use('/user', UserRouter)
router.use('/development', verifyToken, DevelopmentRouter)
router.use('/percentage', verifyToken, PercentageRouter)
router.use('/client', verifyToken, ClientRoutes)
router.use('/apple', verifyToken, AppleRoutes)
router.use('/lot', verifyToken, LotRoutes)
router.use('/sale', verifyToken, SalesRoutes)
router.use('/period', verifyToken, PeriodsRoutes)
router.use('/payment', verifyToken, PaymentRoutes)
router.use('/transaction', verifyToken, TransactionRoutes)
router.use('/pdf', verifyToken, PdfRoutes)
router.use('/asset', verifyToken, AssetRoutes)
router.use('/account-state', verifyToken, AccountStateRoutes)
router.use('/spendings', verifyToken, SpendingsRoutes)
router.use('/cut', verifyToken, CutRoutes)
router.use('/profile', verifyToken, ProfileRoutes)
router.use('/sms-logs', verifyToken, SmsLogsRoutes)

module.exports = router;