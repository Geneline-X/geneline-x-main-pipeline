import { llm, model } from "../Config/gemini.js";
import { processBatchText , processBatch } from "../Utils/mainUtils.js";
import { splitTextIntoChunks } from "../Utils/mainUtils.js";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { fileManager } from "../Config/gemini.js";
import fs from "fs"
import path from "path"
import os from "os"
import fetch from "node-fetch"
import { audioPrompts, imagePrompts, videoPrompts } from "../Utils/prompts.js";
import axios from "axios";

export async function uploadImageAndVectorize(request, res){
    try {
        
        const { createdFile, mimeType } = request.body;
        
        const response = await fetch(
           `https://utfs.io/f/${createdFile.key}`
        );
              // Ensure the fetch was successful 
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Step 2: Write the fetched video file to a temporary location on the disk
        const tempFilePath = path.join(os.tmpdir(), `temp-image-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.mp4`);
        const fileStream = fs.createWriteStream(tempFilePath);
        
        await new Promise((resolve, reject) => {
          response.body.pipe(fileStream);
          response.body.on('error', reject);
          fileStream.on('finish', resolve);
        });
        
            // Step 3: Upload the file using uploadFile
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: `image/${mimeType}`,
          displayName: createdFile.name,
        });

        // Step 4: Generate content using the uploaded file URI
    const result = await llm.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: imagePrompts},
    ]);
       const text = result.response.text().replace(/\*/g, "");
     
       const textChunks = splitTextIntoChunks(text, 1000); // Adjust the chunk size as needed

       const batchSize = 50;

       for (let startIndex = 0; startIndex < textChunks.length; startIndex += batchSize) {
         const batch = textChunks.slice(startIndex, startIndex + batchSize);
         await processBatchText({ batch, startIndex, createdFile});
       }
       console.log("Image Vectorization and Indexing complete!");
       await fileManager.deleteFile(uploadResult.file.name);

       res.status(200).json({message: "Image Vectorization and Indexing complete!"});
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message})
    }
}

export async function uploadVideoAndVectorize(request, res) {
  try {
    const { createdFile, mimeType} = request.body;
    const videoUrl =  `https://utfs.io/f/${createdFile.key}`;
    const response = await fetch(videoUrl);
    
    // Ensure the fetch was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // Step 2: Write the fetched video file to a temporary location on the disk
    const tempFilePath = path.join(os.tmpdir(), `temp-video-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.mp4`);
    const fileStream = fs.createWriteStream(tempFilePath);
    
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    // Step 3: Upload the file using uploadFile
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: `video/${mimeType}`,
      displayName: createdFile.name,
    });

    // Step 4: Generate content using the uploaded file URI
    const result = await llm.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: videoPrompts },
    ]);

    const text = result.response.text().replace(/\*/g, "");
    const textChunks = splitTextIntoChunks(text, 1000); // Adjust the chunk size as needed

    const batchSize = 50;

    for (let startIndex = 0; startIndex < textChunks.length; startIndex += batchSize) {
      const batch = textChunks.slice(startIndex, startIndex + batchSize);
      await processBatchText({ batch, startIndex, createdFile});
    }
    console.log("video Vectorization and Indexing complete!");

    // Step 6: Delete the temporary file from the disk
    fs.unlink(tempFilePath, (err) => {
      if (err) {
        console.error('Failed to delete temporary file:', err);
      } else {
        console.log('Temporary file deleted successfully');
      }
    });
    //  delete the file in the api
    await fileManager.deleteFile(uploadResult.file.name);
    res.status(200).json({message: "vectorization completed"})
  } catch (error) {
    // Handle errors
    console.error('Error processing the video:', error);
    res.status(500).json({message: error.message})
  }
}
export async function uploadAudioAndVectorize(request, res) {
  try {
    const { createdFile, mimeType, fileContent} = request.body;
    const audioUrl =  `https://utfs.io/f/${createdFile.key}`;
    const response = await fetch(audioUrl);
    
    // Ensure the fetch was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // Step 2: Write the fetched video file to a temporary location on the disk
    const tempFilePath = path.join(os.tmpdir(), `temp-audio-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.mp4`);
    const fileStream = fs.createWriteStream(tempFilePath);
    
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    // Step 3: Upload the file using uploadFile
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: `audio/${mimeType}`,
      displayName: createdFile.name,
    });

    // Step 4: Generate content using the uploaded file URI
    const result = await llm.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      {
        text: audioPrompts },
    ]);

    const text = result.response.text().replace(/\*/g, "");
    const textChunks = splitTextIntoChunks(text, 1000); // Adjust the chunk size as needed

    const batchSize = 50;

    for (let startIndex = 0; startIndex < textChunks.length; startIndex += batchSize) {
      const batch = textChunks.slice(startIndex, startIndex + batchSize);
      await processBatchText({ batch, startIndex, createdFile});
    }
    console.log("audio Vectorization and Indexing complete!");

    // Step 6: Delete the temporary file from the disk
    fs.unlink(tempFilePath, (err) => {
      if (err) {
        console.error('Failed to delete temporary file:', err);
      } else {
        console.log('Temporary file deleted successfully');
      }
    });
    //  delete the file in the api
    await fileManager.deleteFile(uploadResult.file.name);
    res.status(200).json({message: "vectorization completed"})
  } catch (error) {
    // Handle errors
    console.error('Error processing the video:', error);
    res.status(500).json({message: error.message})
  }
}

export async function uploadPdfAndVectorize(request, res){
    try {
        const { createdFile } = request.body

        const response = await fetch(
          `https://utfs.io/f/${createdFile.key}`
       );
       
        const blob = await response.blob();
        const loader = new PDFLoader(blob);
        const pageLevelDocs = await loader.load();
        
              // Process pages in batches
        const batchSize = 50; 

        const totalPages = pageLevelDocs.length;
        for (let startIndex = 0; startIndex < totalPages; startIndex += batchSize) {

          // creating the batch //
          const batch = pageLevelDocs.slice(startIndex, startIndex + batchSize);

          // process the pages by batches ///
          await processBatch({batch, startIndex, createdFile});
        }
    
      console.log("PDF Vectorization and Indexing complete!");

    } catch (error) {
      res.status(500).json({message: error.message})
        console.log(error)
    }
}

