import { vectordb } from "../Config/fireBaseConfig.js";
import { collection, writeBatch, doc, getDocs, query} from "firebase/firestore";
import { model } from "../Config/gemini.js";



export async function fetchStoredGuidedConversations(chatbotName) {
    try {
      const conversationsRef = collection(vectordb, `${chatbotName}-conversations`);
      const q = query(conversationsRef);
      const querySnapshot = await getDocs(q);
      const conversations = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          question: data.question,
          answer: data.answer,
        });
      });
  
      console.log("Fetched guided conversations successfully:", conversations);
      return conversations;
    } catch (error) {
      console.error('Error fetching guided conversations:', error);
      throw error;
    }
}

  export const processChatbotBatchText = async ({ batch, startIndex, createdFile, retryCount = 0, maxRetries = 3, chatbotName=""}) => {
    try {
        const batchWrite = writeBatch(vectordb);
        const upsertPromises = batch.map(async (text, index) => {
            const pageIndex = startIndex + index;

            // Embed the individual page using model.embedContent
            const result = await model.embedContent(text);
            const pageEmbedding = result.embedding.values;

            const pageId = `${chatbotName}-page-${pageIndex}`;

            // Store the embedding for the page 
            // Create the data object for the page embedding
            let pageData; 
            if(createdFile.key === "key"){
                pageData = {
                pageText: text,
                embedding: pageEmbedding,
                };
            }
             pageData = {
                pageText: text,
                embedding: pageEmbedding,
                textUrl: `https://utfs.io/f/${createdFile.key}`
            };

            // Add the page data to the Firestore batch
            const docRef = doc(collection(vectordb,chatbotName), pageId);
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
            return processChatbotBatchText({ batch, startIndex, createdFile, retryCount: retryCount + 1, maxRetries, chatbotName });
        } else {
            console.error('Max retries reached. Batch processing failed.');
            throw error;
        }
    }
};

/// process documents by batches ////
export const processChatbotBatch = async ({batch, startIndex, createdFile, retryCount = 0, maxRetries = 3, chatbotName}) => {
    try {
        const batchWrite = writeBatch(vectordb);
        const upsertPromises = batch.map(async (page, index) => {
          const pageIndex = startIndex + index;
          const pageText = page.pageContent;

          // Embed the individual page using model.embedContent
          const result = await model.embedContent(pageText);
          const pageEmbedding = result.embedding.values;

          const pageId = `${chatbotName}-page-${pageIndex}`;
          
          // Store the embedding for the page 
          // Create the data object for the page embedding
            const pageData = {
              pageText,
              embedding: pageEmbedding,
              textUrl: `https://utfs.io/f/${createdFile.key}`
            };
        
            const docRef = doc(collection(vectordb, chatbotName), pageId);
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
            return processChatbotBatch({ batch, startIndex, createdFile, retryCount: retryCount + 1, maxRetries });
        } else {
            console.error('Max retries reached. Batch processing failed.');
            throw error;
        }
    }
};

export async function storeGuidedConversations(conversations, chatbotName) {
    try {
      const batchWrite = writeBatch(vectordb);
      console.log(conversations)
      conversations.forEach((conv, index) => {
        const convId = `${chatbotName}-conv-${index}`;
        const convData = {
          question: conv.question,
          answer: conv.answer,
        };
        const docRef = doc(collection(vectordb, `${chatbotName}-conversations`), convId);
        batchWrite.set(docRef, convData);
      });
  
      await batchWrite.commit();
      console.log("Guided conversations stored successfully");
    } catch (error) {
      console.error('Error storing guided conversations:', error);
      throw error;
    }
}

export async function processGuidedConversations({ batch, startIndex, createdFile, retryCount = 0, maxRetries = 3, chatbotName = "" }) {
    try {
      const batchWrite = writeBatch(vectordb);
      const upsertPromises = batch.map(async (text, index) => {
        const pageIndex = startIndex + index;
  
        // Embed the individual page using model.embedContent
        const result = await model.embedContent(text);
        const pageEmbedding = result.embedding.values;
  
        const pageId = `${chatbotName}-page-${pageIndex}`;
  
        const pageData = {
          pageText: text,
          embedding: pageEmbedding,
          textUrl: `https://utfs.io/f/${createdFile.key}`
        };
  
        // Add the page data to the Firestore batch
        const docRef = doc(collection(vectordb, chatbotName), pageId);
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
        return processGuidedConversations({ batch, startIndex, createdFile, retryCount: retryCount + 1, maxRetries, chatbotName });
      } else {
        console.error('Max retries reached. Batch processing failed.');
        throw error;
      }
    }
}