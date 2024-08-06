import { Router } from "express"
import {
    getGuidedConvo
} from "../Controllers/guidedConvoController.js"
import multer from "multer";
const router = Router()

router.post("/get", getGuidedConvo)

export default router