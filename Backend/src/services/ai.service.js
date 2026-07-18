require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

function getClient() {
    const apiKey =
        process.env.GOOGLE_GENAI_API_KEY?.trim() ||
        process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("GOOGLE_GENAI_API_KEY is missing in Backend/.env");
    }

    return new GoogleGenAI({ apiKey });
}

const interviewReportSchema = z.object({
    matchscore: z.number().min(0).max(100),
    technicalQuestions: z
        .array(
            z.object({
                question: z.string().min(5),
                intention: z.string().min(5),
                answer: z.string().min(10),
            })
        )
        .min(3)
        .max(3),
    behavioralQuestions: z
        .array(
            z.object({
                question: z.string().min(5),
                intention: z.string().min(5),
                answer: z.string().min(10),
            })
        )
        .min(3)
        .max(3),
    skillGaps: z
        .array(
            z.object({
                skill: z.string().min(2),
                severity: z.enum(["low", "medium", "high"]),
            })
        )
        .min(2)
        .max(2),
    preparationPlan: z
        .array(
            z.object({
                day: z.number().int().min(1).max(4),
                tasks: z.array(z.string().min(3)).min(2).max(4),
            })
        )
        .min(4)
        .max(4),
});

const responseJsonSchema = zodToJsonSchema(interviewReportSchema, {
    $refStrategy: "none",
    target: "openApi3",
});

const SYSTEM_INSTRUCTION = `You are a senior technical recruiter and MERN-stack interview coach.
Return structured JSON only. Every question must be an object with question, intention, and answer fields.
Every skill gap must be an object with skill and severity (low, medium, or high).
Preparation plan days must use numeric day values 1, 2, 3, 4.`;

function buildCandidateProfile(resume, selfDescription) {
    const parts = [];
    if (resume?.trim()) parts.push(`RESUME TEXT:\n${resume.trim()}`);
    if (selfDescription?.trim()) parts.push(`SELF DESCRIPTION:\n${selfDescription.trim()}`);
    return parts.join("\n\n") || "No candidate profile provided.";
}

function buildPrompt(resume, selfDescription, jobDescription) {
    const profileForPrompt = buildCandidateProfile(
        resume?.substring(0, 8000) ?? "",
        selfDescription
    );

    return `
Analyze the candidate against the job and produce a personalized interview preparation report.

MATCH SCORE ("matchscore", integer 0-100):
Score honestly from evidence. Strong MERN overlap = 75-92 range. Do not copy a default number.

CANDIDATE PROFILE:
${profileForPrompt}

TARGET JOB DESCRIPTION:
${jobDescription.trim().substring(0, 8000)}

REQUIREMENTS:
- 3 technicalQuestions tailored to the job stack; answers should reflect the candidate's experience
- 3 behavioralQuestions for this role level
- 2 skillGaps the candidate is missing for THIS job (severity: low | medium | high)
- 4 preparationPlan days with 2-3 specific tasks each, targeting gaps and interview prep
`.trim();
}

function extractTopTechnologies(jobDescription) {
    if (!jobDescription || typeof jobDescription !== 'string') return [];
    const techs = ['React', 'Node', 'Express', 'MongoDB', 'Postgres', 'MySQL', 'TypeScript', 'JavaScript', 'Docker', 'Kubernetes', 'GraphQL', 'Redis', 'AWS', 'Azure', 'GCP'];
    const found = [];
    const jd = jobDescription;
    for (const t of techs) {
        const re = new RegExp(`\\b${t}\\b`, 'i');
        if (re.test(jd)) found.push(t);
    }
    return found;
}

function normalizeQuestion(item, fallbackPrefix, resume, selfDescription, jobDescription) {
    if (typeof item === "string") {
        return {
            question: item,
            intention: `Assess ${fallbackPrefix} knowledge relevant to the role.`,
            answer: "Provide a structured answer using the candidate's MERN experience, projects, and tools mentioned in their profile.",
        };
    }

    if (item && typeof item === "object") {
        const qText = item.question || item.text || '';
        const intentionText = item.intention || item.purpose || '';
        const answerText = item.answer || item.modelAnswer || '';

        // If question text is missing or generic, synthesize a better one from jobDescription
        const topTech = extractTopTechnologies(jobDescription)[0] || '';
        let question = qText && String(qText).trim();
        if (!question || question === "question" || question === "...") {
            question = topTech
                ? `Explain your experience with ${topTech} in production projects.`
                : `${fallbackPrefix.charAt(0).toUpperCase() + fallbackPrefix.slice(1)} question: describe relevant experience and approach.`;
        }

        let intention = intentionText && String(intentionText).trim();
        if (!intention || intention === "intention" || intention === "...") {
            intention = topTech
                ? `Assess candidate's practical ${topTech} skills and problem-solving approach.`
                : `Evaluate ${fallbackPrefix} competency for this role.`;
        }

        let answer = answerText && String(answerText).trim();
        if (!answer || answer === "answer" || answer === "...") {
            // Build a concise model answer using available profile snippets
            const profileHint = (selfDescription || resume || '').slice(0, 300);
            answer = profileHint
                ? `Sample answer: ${profileHint.split('\n')[0]}. Expand with examples of projects, challenges, and outcomes.`
                : 'Provide a structured answer using concrete examples from your projects and experience.';
        }

        return {
            question,
            intention,
            answer,
        };
    }

    return null;

    return null;
}

function normalizeSkillGap(item) {
    if (typeof item === "string") {
        return { skill: item, severity: "medium" };
    }

    if (item && typeof item === "object") {
        const severity = ["low", "medium", "high"].includes(
            String(item.severity || "").toLowerCase()
        )
            ? String(item.severity).toLowerCase()
            : "medium";

        return {
            skill: item.skill || item.name || "Additional skill development",
            severity,
        };
    }

    return null;
}

function normalizeDay(dayValue, index) {
    if (typeof dayValue === "number") return dayValue;
    if (typeof dayValue === "string") {
        const match = dayValue.match(/\d+/);
        if (match) return Number(match[0]);
    }
    return index + 1;
}

function normalizeReport(raw, resume, selfDescription, jobDescription) {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    const matchscore =
        typeof parsed.matchscore === "number"
            ? Math.round(Math.min(100, Math.max(0, parsed.matchscore)))
            : typeof parsed.matchScore === "number"
              ? Math.round(Math.min(100, Math.max(0, parsed.matchScore)))
              : 0;

    const technicalQuestions = (parsed.technicalQuestions || [])
        .map((q) => normalizeQuestion(q, "technical", resume, selfDescription, jobDescription))
        .filter(Boolean)
        .slice(0, 3);

    const behavioralQuestions = (parsed.behavioralQuestions || [])
        .map((q) => normalizeQuestion(q, "behavioral", resume, selfDescription, jobDescription))
        .filter(Boolean)
        .slice(0, 3);

    const skillGaps = (parsed.skillGaps || [])
        .map(normalizeSkillGap)
        .filter(Boolean)
        .slice(0, 2);

    while (technicalQuestions.length < 3) {
        technicalQuestions.push({
            question: "Explain how you structure a REST API in Express.js for a MERN application.",
            intention: "Assess backend architecture and API design skills.",
            answer:
                "Describe routes, controllers, middleware, error handling, and how the API connects to MongoDB using the candidate's project experience.",
        });
    }

    while (behavioralQuestions.length < 3) {
        behavioralQuestions.push({
            question: "Tell me about a challenging bug you fixed in a full-stack project.",
            intention: "Assess debugging approach and ownership.",
            answer:
                "Use STAR format with a real MERN project example: problem, investigation, fix, and outcome.",
        });
    }

    while (skillGaps.length < 2) {
        skillGaps.push({
            skill: "Advanced system design for scalable MERN apps",
            severity: "medium",
        });
    }

    const preparationPlan = (parsed.preparationPlan || [])
        .map((day, index) => {
            if (!day || typeof day !== "object") return null;
            const tasks = Array.isArray(day.tasks)
                ? day.tasks.map(String).filter(Boolean)
                : typeof day.task === "string"
                  ? [day.task]
                  : [];

            if (tasks.length === 0) return null;

            return {
                day: normalizeDay(day.day, index),
                tasks: tasks.slice(0, 4),
            };
        })
        .filter(Boolean)
        .slice(0, 4);

    while (preparationPlan.length < 4) {
        const dayNum = preparationPlan.length + 1;
        preparationPlan.push({
            day: dayNum,
            tasks: [
                `Review technical and behavioral questions from Day ${dayNum - 1 || 1}.`,
                "Practice answering out loud with examples from your MERN projects.",
            ],
        });
    }

    return {
        matchscore,
        technicalQuestions,
        behavioralQuestions,
        skillGaps,
        preparationPlan,
    };
}

const MODELS = ["gemini-2.5-flash"];

async function callGemini(prompt) {
    const ai = getClient();
    let lastError;

    for (const model of MODELS) {
        try {
            return await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseJsonSchema,
                    temperature: 0.35,
                    topP: 0.9,
                },
            });
        } catch (error) {
            lastError = error;
            const msg = error.message || String(error);
            const retryable =
                msg.includes("503") ||
                msg.includes("UNAVAILABLE") ||
                msg.includes("high demand");

            if (retryable && model !== MODELS[MODELS.length - 1]) {
                console.warn(`Model ${model} unavailable, trying fallback...`);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

async function generateInterviewReport(resume, selfDescription, jobDescription) {
    if (!jobDescription?.trim()) {
        return { success: false, error: "Job description is required" };
    }

    if (!resume?.trim() && !selfDescription?.trim()) {
        return {
            success: false,
            error: "Either a resume or self description is required",
        };
    }

    const prompt = buildPrompt(resume, selfDescription, jobDescription);
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await callGemini(prompt);
            const rawText = response.text?.trim();

            if (!rawText) {
                throw new Error("AI returned an empty response");
            }

            const normalized = normalizeReport(JSON.parse(rawText), resume, selfDescription, jobDescription);
            const validated = interviewReportSchema.safeParse(normalized);

            if (!validated.success) {
                console.error(
                    `AI validation failed (attempt ${attempt}):`,
                    validated.error.flatten()
                );
                lastError = new Error("AI response format was incomplete");
                continue;
            }

            return { success: true, data: validated.data };
        } catch (error) {
            lastError = error;
            console.error(`AI attempt ${attempt} failed:`, error.message);
        }
    }

    const message = lastError?.message || "Unknown error";

    if (message.includes("API key") || message.includes("GOOGLE_GENAI")) {
        return {
            success: false,
            error:
                "Invalid or missing Google AI API key. Check GOOGLE_GENAI_API_KEY in Backend/.env",
        };
    }

    if (message.includes("fetch failed") || message.includes("certificate")) {
        return {
            success: false,
            error:
                "Cannot reach Google AI. Add GOOGLE_AI_TLS_INSECURE=true to Backend/.env for local dev.",
        };
    }

    if (message.includes("503") || message.includes("high demand") || message.includes("UNAVAILABLE")) {
        return {
            success: false,
            error: "Gemini is busy right now. Please wait a minute and try again.",
        };
    }

    // If failure is due to quota or resource exhaustion, generate a local fallback report
    const lowMsg = message.toLowerCase();
    if (lowMsg.includes('quota') || lowMsg.includes('resource_exhausted') || lowMsg.includes('exceeded')) {
        try {
            const fallback = generateLocalFallback(resume, selfDescription, jobDescription);
            const normalizedFallback = normalizeReport(fallback, resume, selfDescription, jobDescription);
            const validatedFallback = interviewReportSchema.safeParse(normalizedFallback);
            if (validatedFallback.success) {
                return { success: true, data: validatedFallback.data };
            }
        } catch (err) {
            console.error('Local fallback generation failed:', err?.message || err);
        }
    }

    return {
        success: false,
        error: message.includes("format")
            ? "AI response was incomplete. Please try generating again."
            : "Failed to generate interview plan. Please try again.",
    };
}

// Local deterministic fallback generator used when AI is unavailable (quota/network)
function generateLocalFallback(resume, selfDescription, jobDescription) {
    const topTechs = extractTopTechnologies(jobDescription);
    const primary = topTechs[0] || 'MERN stack';

    // Heuristic match score: base 50 + 10 per matched tech up to 100
    let score = 50;
    for (const t of topTechs) {
        const re = new RegExp(`\\b${t}\\b`, 'i');
        if ((resume && re.test(resume)) || (selfDescription && re.test(selfDescription))) score += 10;
    }
    score = Math.min(95, Math.max(40, Math.round(score)));

    const techQs = [];
    for (let i = 0; i < 3; i++) {
        const tech = topTechs[i] || (primary + (i + 1));
        techQs.push({
            question: `Explain your experience with ${tech} in production projects.`,
            intention: `Assess candidate's practical ${tech} skills and problem-solving approach.`,
            answer: `Sample answer: Describe a project using ${tech}, your role, the challenges faced, and measurable outcomes.`,
        });
    }

    const behavioralQs = [
        {
            question: 'Tell me about a challenging bug you fixed in a full-stack project.',
            intention: 'Assess debugging approach and ownership.',
            answer: 'Use STAR: Situation, Task, Action, Result — focus on investigation, fix, and impact.',
        },
        {
            question: 'Describe a time you improved performance or reliability in an application.',
            intention: 'Assess impact-driven engineering and optimization skills.',
            answer: 'Explain the issue, steps taken, metrics improved, and trade-offs considered.',
        },
        {
            question: 'How do you handle feedback during code reviews?',
            intention: 'Assess collaboration and growth mindset.',
            answer: 'Discuss receiving feedback, making incremental changes, and communicating decisions.',
        },
    ];

    const skillGaps = [
        { skill: `${primary} Testing (Unit/Integration)`, severity: 'medium' },
        { skill: 'Advanced system design for scalable MERN apps', severity: 'medium' },
    ];

    const preparationPlan = [
        { day: 1, tasks: [`Review core ${primary} concepts and recent projects.`, 'Practice two technical questions out loud.'] },
        { day: 2, tasks: ['Deep-dive into one backend challenge (APIs, DB indexing).', 'Mock interview: explain system design at high level.'] },
        { day: 3, tasks: ['Implement a small feature or bugfix related to the job tech stack.', 'Write tests for critical paths.'] },
        { day: 4, tasks: ['Rehearse behavioral answers using STAR.', 'Prepare questions to ask the interviewer.'] },
    ];

    return {
        matchscore: score,
        technicalQuestions: techQs,
        behavioralQuestions: behavioralQs,
        skillGaps,
        preparationPlan,
    };
}

module.exports = {
    generateInterviewReport,
};
