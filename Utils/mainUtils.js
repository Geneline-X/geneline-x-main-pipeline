import { vectordb } from "../Config/fireBaseConfig.js";
import { collection, writeBatch, doc} from "firebase/firestore";
import { model } from "../Config/gemini.js";

// convert blob to base64 //
export const fileImageToGenerativePart = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = blob.type; // Assuming mimeType is available from the Blob
  
    return {inlineData: {data: base64Data, mimeType}};
  };
  
  // convert content to blob //
export const processBatchText = async ({ batch, startIndex, createdFile, retryCount = 0, maxRetries = 3 }) => {
    try {
        const batchWrite = writeBatch(vectordb);
        const upsertPromises = batch.map(async (text, index) => {
            const pageIndex = startIndex + index;

            // Embed the individual page using model.embedContent
            const result = await model.embedContent(text);
            const pageEmbedding = result.embedding.values;

            const pageId = `${createdFile.id}-page-${pageIndex}`;

            // Store the embedding for the page 
            // Create the data object for the page embedding
            const pageData = {
                pageText: text,
                embedding: pageEmbedding,
            };

            // Add the page data to the Firestore batch
            const docRef = doc(collection(vectordb, createdFile.id), pageId);
            batchWrite.set(docRef, pageData);
        });

        await Promise.all(upsertPromises);

        // Commit the batch write
        await batchWrite.commit();

        console.log("Batch write committed successfully");
    } catch (error) {
        console.error('Error occurred during batch processing:', error.message);

        if (retryCount < maxRetries) {
            console.log(`Retrying batch processing... (${retryCount + 1}/${maxRetries})`);
            return processBatchText({ batch, startIndex, createdFile, retryCount: retryCount + 1, maxRetries });
        } else {
            console.error('Max retries reached. Batch processing failed.');
            throw error;
        }
    }
};

/// process documents by batches ////
export const processBatch = async ({batch, startIndex, createdFile, retryCount = 0, maxRetries = 3}) => {
    try {
        const batchWrite = writeBatch(vectordb);
        const upsertPromises = batch.map(async (page, index) => {
          const pageIndex = startIndex + index;
          const pageText = page.pageContent;

          // Embed the individual page using model.embedContent
          const result = await model.embedContent(pageText);
          const pageEmbedding = result.embedding.values;

          const pageId = `${createdFile.id}-page-${pageIndex}`;
          
          // Store the embedding for the page 
          // Create the data object for the page embedding
            const pageData = {
              pageText,
              embedding: pageEmbedding,
            };
        
            const docRef = doc(collection(vectordb, createdFile.id), pageId);
            batchWrite.set(docRef, pageData);   
      });

        //return Promise.all(upsertPromises);
        await Promise.all(upsertPromises);

        // Commit the batch write
        await batchWrite.commit();

      console.log("Batch write committed successfully");
    } catch (error) {
        console.error('Error occurred during batch processing:', error.message);
        if (retryCount < maxRetries) {
            console.log(`Retrying batch processing... (${retryCount + 1}/${maxRetries})`);
            return processBatch({ batch, startIndex, createdFile, retryCount: retryCount + 1, maxRetries });
        } else {
            console.error('Max retries reached. Batch processing failed.');
            throw error;
        }
    }
};

export function splitTextIntoChunks(text, chunkSize) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let chunk = '';
  
    for (const sentence of sentences) {
      if (chunk.length + sentence.length <= chunkSize) {
        chunk += sentence;
      } else {
        chunks.push(chunk);
        chunk = sentence;
      }
    }
  
    if (chunk) {
      chunks.push(chunk);
    }
  
    return chunks;
}