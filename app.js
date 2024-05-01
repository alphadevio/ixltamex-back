const express = require("express")
const app = express()
const cors = require("cors")
require('dotenv').config();
const router = require("./src/routes");


const port = 8000
app.use(express.json())
app.use(cors({ origin: '*' ,methods: '*', allowedHeaders: ['*'], requestHeaders: ['*']}));
app.use("/api",router)
app.listen(port, () => {
    const date = new Date();
    console.log(`Server Started in: ${port} `+ date)
})