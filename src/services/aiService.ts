import axios from "axios";

export const generateAIResponse = async (query: string, topResponses: any[]): Promise<string> => {
    if (topResponses.length === 0) {
      return "Not enough data for a detailed response. Please refine your search.";
    }
  
    // Step 1: Structure the input for Gemini
    const aiInput = `
  You are an assistant at a company. Your role is to analyze queries and their answers to provide a summarized, context-aware, and relevant response for the given search term.
  
  Search Term: "${query}"
  
  Context (Top Relevant Questions and Answers):
  ${topResponses
      .map(
        (response, index) => {
          // Access the content field correctly for the question and answers
          const questionText = response.content || "No question provided"; // Default if content is undefined
          const answersText = response.answers && response.answers.length > 0
            ? response.answers.map((answer: any, answerIndex: number) => `(${answerIndex + 1}) ${answer.content}`).join('\n   ')
            : "No answers available";
  
          return `${index + 1}. Question: "${questionText}"\n   Answers:\n   ${answersText}`;
        }
      )
      .join('\n\n')}
  
  Provide a clear, concise, and helpful response based on this context. Do not provide add any prefix or suffix, just the response a straightforward answer.
    `.trim();
  
    // Step 2: Call Gemini API
    return await callAIService(aiInput);
  };
  
  // Call Gemini API
  const callAIService = async (input: string): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
  
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return 'AI service is unavailable due to missing API key.';
    }
  
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              role: 'model',
              parts: [
                {
                  text: 'You are an assistant in a company providing intelligent responses based on the given input.',
                },
              ],
            },
            {
              role: 'user',
              parts: [
                {
                  text: input,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      // Handle the response and extract the text correctly
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const candidate = response.data.candidates[0];
  
        // Check if the content field exists and extract it
        if (candidate.content && typeof candidate.content === 'object') {
          // Extract the generated text from the 'content' object
          const generatedText = candidate.content.parts[0].text || "Unable to extract text from the response.";
          return generatedText;
        }
      }
  
      console.error('Unexpected response structure:', response.data);
      return 'Unable to generate a response at this time. The service response is not as expected.';
    } catch (error: any) {
      console.error('Error calling Gemini service:', error?.response?.data || error.message);
      return 'Unable to generate a response at this time. Please try again later.';
    }
  };
  