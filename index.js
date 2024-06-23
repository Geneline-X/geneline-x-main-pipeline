import { config } from "dotenv";
import express from "express";
import cluster from "cluster";
import os from "os";
import uploadrouter from "./Routes/uploadRoute.js";
import cors from "cors"
import { corsOption } from "./Config/corsOption.js";

config();

const app = express();
const PORT = process.env.PORT || 3600;
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new one.`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case, it is an HTTP server
  app.use(express.json());
  app.use(cors(corsOption))
  app.use("/file-upload", uploadrouter);

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started at port: ${PORT}`);
  });
}
