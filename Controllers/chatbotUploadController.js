import { 
  processChatbotBatchText, 
  processChatbotBatch, 
  fetchStoredGuidedConversations, 
  storeGuidedConversations, 
  processGuidedConversations } from "../Utils/chatbotUploadUtils.js";
import { splitTextIntoChunks } from "../Utils/mainUtils.js";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { fileManager } from "../Config/gemini.js";
import fs from "fs"
import path from "path"
import os from "os"
import fetch from "node-fetch"
import { audioPrompts, imagePrompts, videoPrompts } from "../Utils/prompts.js";
import { llm, model } from "../Config/gemini.js";

export async function uploadImageAndVectorize(request, res){
    try {
        
        const { createdFile, mimeType, chatbotName, chatbotId } = request.body;
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
         await processChatbotBatchText({ batch, startIndex, createdFile, chatbotName, chatbotId});
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
      const { createdFile, mimeType, chatbotName, chatbotId} = request.body;
      
      const response = await fetch(`https://utfs.io/f/${createdFile.key}`);
      
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
        await processChatbotBatchText({ batch, startIndex, createdFile, chatbotName, chatbotId});
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
      const { createdFile, mimeType, chatbotName, chatbotId} = request.body;
    
      const response = await fetch(`https://utfs.io/f/${createdFile.key}`);
      
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
        await processChatbotBatchText({ batch, startIndex, createdFile, chatbotName, chatbotId});
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
        const { createdFile, chatbotName, chatbotId } = request.body

        console.log(chatbotId)
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
          await processChatbotBatch({batch, startIndex, createdFile, chatbotName, chatbotId});
        }
    
      console.log("PDF Vectorization and Indexing complete!");
      res.status(200).json({message: 'PDF Vectorization and Indexing complete!'})
    } catch (error) {
      res.status(500).json({message: error.message})
        console.log(error)
    }
}

export async function uploadTextAndVectorize(request, res) {
  try {
    const { text, chatbotName, mode, conversations, chatbotId } = request.body;

    if (mode === 'random') {
      const textChunks = splitTextIntoChunks(text, 1000);
      const batchSize = 50;

      for (let startIndex = 0; startIndex < textChunks.length; startIndex += batchSize) {
        const batch = textChunks.slice(startIndex, startIndex + batchSize);
        await processChatbotBatchText({ batch, startIndex, createdFile: { key: 'text' }, chatbotName, chatbotId });
      }

      res.status(200).json({ message: "Random Text Vectorization and Indexing complete!" });
    } else if (mode === 'guided') {
      await storeGuidedConversations(conversations, chatbotName, chatbotId);

      const textChunks = conversations.map(conv => `${conv.question}: ${conv.answer}`);
      const batchSize = 50;

      for (let startIndex = 0; startIndex < textChunks.length; startIndex += batchSize) {
        const batch = textChunks.slice(startIndex, startIndex + batchSize);
        await processGuidedConversations({ 
          batch, 
          startIndex, 
          createdFile: { key: 'text' }, 
          chatbotName, chatbotId 
        });
      }

      res.status(200).json({ message: "Guided Conversation Vectorization and Indexing complete!" });
    } else {
      throw new Error("Invalid mode provided");
    }
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ message: error.message });
  }
}

