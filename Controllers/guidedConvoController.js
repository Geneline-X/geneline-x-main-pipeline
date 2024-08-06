import { fetchStoredGuidedConversations } from "../Utils/chatbotUploadUtils.js"

export async function getGuidedConvo(request, res){
    try {
    const { chatbotName } = request.body
     const guidedConvo = await fetchStoredGuidedConversations(chatbotName)
     res.status(200).json({convesations: guidedConvo })
    } catch (error) {
      res.status(500).join({message: "Error Occured"})
    }
}