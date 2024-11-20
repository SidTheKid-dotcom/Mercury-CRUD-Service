"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = void 0;
const axios_1 = __importDefault(require("axios"));
const generateAIResponse = (query, topResponses) => __awaiter(void 0, void 0, void 0, function* () {
    if (topResponses.length === 0) {
        return "Not enough data for a detailed response. Please refine your search.";
    }
    // Step 1: Structure the input for Gemini
    const aiInput = `
  You are an assistant at a company. Your role is to analyze queries and their answers to provide a summarized, context-aware, and relevant response for the given search term.
  
  Search Term: "${query}"
  
  Context (Top Relevant Questions and Answers):
  ${topResponses
        .map((response, index) => {
        // Access the content field correctly for the question and answers
        const questionText = response.content || "No question provided"; // Default if content is undefined
        const answersText = response.answers && response.answers.length > 0
            ? response.answers.map((answer, answerIndex) => `(${answerIndex + 1}) ${answer.content}`).join('\n   ')
            : "No answers available";
        return `${index + 1}. Question: "${questionText}"\n   Answers:\n   ${answersText}`;
    })
        .join('\n\n')}
  
  Provide a clear, concise, and helpful response based on this context. Do not provide add any prefix or suffix, just the response a straightforward answer.
    `.trim();
    // Step 2: Call Gemini API
    return yield callAIService(aiInput);
});
exports.generateAIResponse = generateAIResponse;
// Call Gemini API
const callAIService = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set');
        return 'AI service is unavailable due to missing API key.';
    }
    try {
        const response = yield axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
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
    }
    catch (error) {
        console.error('Error calling Gemini service:', ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return 'Unable to generate a response at this time. Please try again later.';
    }
});
