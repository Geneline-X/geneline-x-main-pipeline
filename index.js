import { config } from "dotenv";
import express from "express";
import uploadrouter from "./Routes/uploadRoute.js";
import chatbotuploadrouter from "./Routes/chatbotUploadRoute.js";
import cors from "cors";
import { corsOption } from "./Config/corsOption.js";

config();

const app = express();
const PORT = process.env.PORT || 3600;

// Workers can share any TCP connection (HTTP server in this case)
app.use(express.json());
app.use(cors(corsOption));
// this is route is for xplain-ai //
app.use("/file-upload", uploadrouter);
app.use("/chatbot-upload", chatbotuploadrouter)
app.listen(PORT, () => {
  console.log(`Worker ${process.pid} started at port: ${PORT}`);
});
