const express = require("express")
const app = express()
const cors = require("cors")
require('dotenv').config();
const router = require("./src/routes");


const port = 8000
app.use(express.json())
app.use(cors({ origin: '*' ,methods: '*', allowedHeaders: ['*'], requestHeaders: ['*']}));
app.use('/pdf', express.static('./public/pdf'))
app.use('/qr', express.static('./public/qr'))
app.use('/img', express.static('./public/images'))
app.use("/api",router)
app.listen(port, () => {
    const date = new Date();
    console.log(`Server Started in: ${port} `+ date)
})