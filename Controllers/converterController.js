import axios from "axios";
import { config } from "dotenv";
import fs from "fs/promises"; // Using fs/promises for cleaner async/await syntax
import { tmpdir } from "os";
import { createWriteStream, createReadStream } from "fs";

config();

export async function documentToPdf(req, res) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Missing file in request' });
    }
    
    console.log(file)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('instructions', `
      {
        "parts": [
          {
            "file": "file"
          }
        ]
      }
    `);

    // Make the request to PSPDFKit API with the file
    const response = await axios.post('https://api.pspdfkit.com/build', formData, {
        headers: {
            'Authorization': `Bearer ${process.env.PSPD_API_KEY}`,
        },
        responseType: "stream",
    });

    // Generate a temporary filename
    const tempFilename = `${tmpdir()}/converted-${Math.random().toString(36).substring(2, 15)}.pdf`;

    // Stream the response data to a temporary file
    const writer = createWriteStream(tempFilename);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Set response headers for the PDF file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=converted.pdf`);

    // Stream the PDF data to the client
    const fileStream = createReadStream(tempFilename);
    fileStream.pipe(res);

    fileStream.on('end', async () => {
      await fs.unlink(tempFilename); // Clean up the temporary file
    });

    fileStream.on('error', async (error) => {
      await fs.unlink(tempFilename); // Ensure cleanup on error
      console.error('Error streaming PDF to client', error);
      res.status(500).json({ message: 'Error streaming PDF to client' });
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
}
