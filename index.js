import { config } from "dotenv"
config()
import express from "express"

const app = express()

const PORT = process.env.PORT || 3600


app.listen(PORT,() => {
   console.log("server started at port: ", PORT)
})