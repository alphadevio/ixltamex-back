const express = require("express")
const app = express()
const cors = require("cors")
const router = require("./src/routes")


const port = 8000
app.use(express.json())
app.use(cors({ origin: '*' ,methods: '*', allowedHeaders: ['*'], requestHeaders: ['*']}));
app.use("/api",router)
app.listen(port, () => {
    console.log(`Server Started in: ${port}`)
})