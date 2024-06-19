import express, { Router } from "express"
import {uploadAndVectorize} from "../Controllers/uploadController.js"
const router = Router()

router.post("/", uploadAndVectorize)

export default router