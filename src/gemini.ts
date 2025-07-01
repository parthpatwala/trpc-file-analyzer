import { config } from 'dotenv';

config();

const GEMINI_API_ENDPOINT = process.env.GEMINI_API_ENDPOINT;
const GEMINI_AUTH_TOKEN = process.env.GEMINI_AUTH_TOKEN;

export interface GeminiAnalysisResult {
  strengths: string[];
  weaknesses: string[];
  alignmentScore: number; // e.g., 0-100
  alignmentSummary: string;
}

export async function analyzeWithGemini(jobDescriptionText: string, cvText: string): Promise<GeminiAnalysisResult> {
  // Basic validation for environment variables
  if (!GEMINI_API_ENDPOINT || !GEMINI_AUTH_TOKEN) {
    throw new Error('Gemini API endpoint or authorization token is not configured in .env.');
  }

  // Prompt
  const prompt = `
  You are an expert recruitment AI tasked with evaluating a candidate's CV against a job description.
  Your goal is to provide a comprehensive analysis identifying the candidate's strengths and weaknesses,
  and a clear evaluation of their alignment with the job description.

  Job Description:
  """
  ${jobDescriptionText}
  """

  Candidate CV:
  """
  ${cvText}
  """

  Provide your analysis STRICTLY in a JSON format with the following structure.
  Ensure the JSON is perfectly valid and can be parsed directly. Do not include any other text outside the JSON.

  {
    "strengths": [
      "Identify key skills and experiences from the CV that strongly match the job description. Provide specific examples.",
      "Highlight significant achievements or qualifications from the CV relevant to the role."
    ],
    "weaknesses": [
      "Point out any missing skills, experiences, or qualifications explicitly mentioned in the job description but absent or weak in the CV.",
      "Identify areas where the candidate's experience might not fully align with the job's requirements."
    ],
    "alignmentScore": "A numerical score from 0 to 100, where 100 indicates a perfect match and 0 indicates no match. (e.g., 75)",
    "alignmentSummary": "A concise summary (3-5 sentences) evaluating the overall fit of the candidate for the job description. Include actionable insights on key matches and gaps."
  }
  `;

  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        topK: 40,
        topP: 0.95,
      },
    };

    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${GEMINI_AUTH_TOKEN}`,
      },
      body: JSON.stringify(requestBody), // Send the request body as JSON
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error(`${errorDetail}`);
      throw new Error(`Gemini API call failed: ${response.status} - ${response.statusText}. Detail: ${errorDetail}`);
    }
    const data: any = await response.json();
    const geminiOutputText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!geminiOutputText) {
      console.error('No Data:', data);
      throw new Error('No content found.');
    }

    // Attempt to parse the JSON output from Gemini
    const regex = /```json\s*([\s\S]*?)\s*```/;
    const match = geminiOutputText.match(regex);
    if (!match) {
      console.error(`Could not extract JSON`);
      throw new Error(`Could not extract JSON`);
    }
    const rawJsonString = match[1].trim();
    const parsedResult: GeminiAnalysisResult = JSON.parse(rawJsonString);
    return parsedResult;
  } catch (error: any) {
    console.error('Error:', error);
    throw new Error(error.message);
  }
}
