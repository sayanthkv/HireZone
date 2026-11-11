const { GoogleGenAI, Type } = require("@google/genai");

// Reads GEMINI_API_KEY directly from your .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes candidate credentials against job requirements
 * @param {Object} candidate - Student info (name, skills, bio, resumeLink, coverLetter)
 * @param {Object} job - Job info (title, description, skills, company)
 */
const analyzeCandidateMatch = async (candidate, job) => {
  try {
    const prompt = `
You are an expert technical recruiter and automated ATS evaluation engine.
Evaluate this candidate application against the target job profile.

Job Profile:
- Title: ${job.title}
- Company: ${job.company || "Not specified"}
- Required Skills: ${Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "Not specified"}
- Description: ${job.description || "Not specified"}

Candidate Profile & Submission:
- Name: ${candidate.name || "Candidate"}
- Stated Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(", ") : candidate.skills || "None listed"}
- Education: ${candidate.education || "Not specified"}
- Bio / Summary: ${candidate.bio || "None provided"}
- Cover Letter: ${candidate.coverLetter || "None provided"}
- Resume URL: ${candidate.resumeLink || "None provided"}

Evaluate the candidate carefully and return:
1. matchScore: An integer from 0 to 100 representing how closely the candidate matches the job needs.
2. keyStrengths: An array of 2 to 4 bullet points highlighting the candidate's strongest matching attributes.
3. missingSkills: An array of missing or recommended skills for this role.
4. aiSummary: A 2-sentence summary providing a recruiter recommendation.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: {
              type: Type.INTEGER,
              description: "Match score between 0 and 100",
            },
            keyStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            aiSummary: {
              type: Type.STRING,
            },
          },
          required: ["matchScore", "keyStrengths", "missingSkills", "aiSummary"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini ATS Analysis Error:", error.message);
    // Graceful fallback so applications never crash even if API is slow or missing
    return {
      matchScore: 50,
      keyStrengths: ["Application received for review"],
      missingSkills: [],
      aiSummary: "Automated analysis pending or API quota limit reached.",
    };
  }
};

module.exports = { analyzeCandidateMatch };