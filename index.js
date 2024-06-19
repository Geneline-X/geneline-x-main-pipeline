config()
import { config } from "dotenv"

import express from "express"
import uploadrouter from "./Routes/uploadRoute.js"

const app = express()

const PORT = process.env.PORT || 3600

app.use("/file-upload", uploadrouter)

app.listen(PORT,() => {
   console.log("server started at port: ", PORT)
})