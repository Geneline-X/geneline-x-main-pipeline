import { vectordb } from "../Config/fireBaseConfig.js";
import { collection, getDocs, addDoc, writeBatch, doc, getDoc,  query} from "firebase/firestore";

// convert blob to base64 //
export const fileImageToGenerativePart = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = blob.type; // Assuming mimeType is available from the Blob
  
    return {inlineData: {data: base64Data, mimeType}};
  };
  
  // convert content to blob //
  export const processBatchUrl = async ({batch, startIndex, createdFile}) => {
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
              text,
              embedding: pageEmbedding,
            };
            
            // Add the page data to the Firestore batch
            //const docRef = await addDoc(collection(vectordb, createdFile.id), pageData);

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
        // Retry the operation for the failed batch
        return processBatchUrl({batch, startIndex, createdFile});
    }
};