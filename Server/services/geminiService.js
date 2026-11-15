const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Deterministic keyword ATS fallback if Gemini API quota/rate limit is hit
const buildLocalFallbackEvaluation = (candidate, job) => {
  const jobSkills = Array.isArray(job.skills)
    ? job.skills
    : typeof job.skills === "string"
      ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const searchableCorpus = [
    ...(Array.isArray(candidate.skills) ? candidate.skills : []),
    candidate.bio || "",
    candidate.coverLetter || "",
    candidate.resumeText || "",
  ]
    .join(" ")
    .toLowerCase();

  if (jobSkills.length === 0) {
    return {
      matchScore: searchableCorpus.length > 100 ? 72 : 55,
      keyStrengths: ["Resume and profile details submitted for review"],
      missingSkills: [],
      aiSummary:
        "Candidate profile and resume extracted successfully; manual skill review recommended.",
    };
  }

  const matched = [];
  const missing = [];

  for (const skill of jobSkills) {
    if (searchableCorpus.includes(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const ratio = matched.length / jobSkills.length;
  const matchScore = Math.min(95, Math.max(25, Math.round(ratio * 100)));

  return {
    matchScore,
    keyStrengths:
      matched.length > 0
        ? [`Matched required skills: ${matched.join(", ")}`]
        : ["Relevant background submitted in application"],
    missingSkills: missing,
    aiSummary:
      matched.length > 0
        ? `Candidate demonstrates ${matched.length} of ${jobSkills.length} required skills (${matched.join(", ")}). Recommended for recruiter review.`
        : `Candidate profile lacks explicit mentions of ${missing.slice(0, 3).join(", ")}. Review resume details for transferable experience.`,
  };
};

/**
 * Analyzes candidate credentials & extracted PDF resume text against job requirements
 */
const analyzeCandidateMatch = async (candidate, job) => {
  const extractedResumeSection = candidate.resumeText
    ? `- Extracted Resume PDF Content:\n"""\n${candidate.resumeText.slice(0, 4500)}\n"""`
    : `- Resume URL Provided: ${candidate.resumeLink || "None provided"}`;

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
- Stated Profile Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(", ") : candidate.skills || "None listed"}
- Education: ${candidate.education || "Not specified"}
- Bio / Summary: ${candidate.bio || "None provided"}
- Cover Letter: ${candidate.coverLetter || "None provided"}
${extractedResumeSection}

Evaluate the candidate carefully based on both their profile and extracted resume content, and return:
1. matchScore: An integer from 0 to 100 representing how closely the candidate matches the job needs.
2. keyStrengths: An array of 2 to 4 bullet points highlighting the candidate's strongest matching attributes.
3. missingSkills: An array of missing or recommended skills for this role.
4. aiSummary: A 2-sentence summary providing a recruiter recommendation.
`;

  const callGemini = async (modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
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
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in Server/.env");
    }

    return await callGemini("gemini-2.5-flash");
  } catch (primaryError) {
    console.error("Gemini Primary Error:", primaryError.message);

    // Retry once with gemini-2.0-flash in case 2.5-flash hit quota/model availability
    try {
      return await callGemini("gemini-2.0-flash");
    } catch (secondaryError) {
      console.error("Gemini Secondary Error:", secondaryError.message);
      return buildLocalFallbackEvaluation(candidate, job);
    }
  }
};

module.exports = { analyzeCandidateMatch };