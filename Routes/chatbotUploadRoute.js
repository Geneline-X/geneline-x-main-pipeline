import { Router } from "express"
import {
    uploadImageAndVectorize, 
    uploadPdfAndVectorize, 
    uploadVideoAndVectorize, 
    uploadAudioAndVectorize,
    uploadTextAndVectorize
} from "../Controllers/chatbotUploadController.js"
import multer from "multer";
const router = Router()

const upload = multer();

router.post("/image", uploadImageAndVectorize)
router.post("/pdf", uploadPdfAndVectorize)
router.post("/text", uploadTextAndVectorize)
router.post("/video", uploadVideoAndVectorize)
router.post("/audio", uploadAudioAndVectorize)
// router.post("/document-to-pdf", upload.single('file'), documentToPdf)

export default router