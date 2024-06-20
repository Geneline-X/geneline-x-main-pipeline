import { Router } from "express"
import {
    uploadImageAndVectorize, 
    uploadPdfAndVectorize, 
    uploadVideoAndVectorize, 
    uploadAudioAndVectorize
} from "../Controllers/uploadController.js"
import { documentToPdf } from "../Controllers/converterController.js"
import multer from "multer";
const router = Router()

const upload = multer();

router.post("/image", uploadImageAndVectorize)
router.post("/pdf", uploadPdfAndVectorize)
router.post("/video", uploadVideoAndVectorize)
router.post("/audio", uploadAudioAndVectorize)
router.post("/document-to-pdf", upload.single('file'), documentToPdf)

export default router