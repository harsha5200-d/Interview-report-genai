// const pdfParse = require("pdf-parse");
// const InterviewReportModel = require("../models/interviewReport.model");
// const { generateInterviewReport } = require("../services/ai.service");

// async function generateInterviewReportController(req, res) {

//     try {

//         const resumeFile = req.file;

//         const resumeContent = await (
//             new pdfParse.PDFParse(
//                 Uint8Array.from(resumeFile.buffer)
//             )
//         ).getText();

//         const { selfDescription, jobDescription } = req.body;

//         const interviewReportByAi = await generateInterviewReport({
//             resume: resumeContent.text,
//             selfDescription,
//             jobDescription
//         });

//         const interviewReport = await InterviewReportModel.create({
//             user: req.user.id,
//             resume: resumeContent.text,
//             selfDescription,
//             jobDescription,
//             ...interviewReportByAi
//         });

//         res.status(201).json({
//             message: "Interview report generated successfully",
//             interviewReport
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             message: error.message
//         });
//     }
// }

// module.exports = {
//     generateInterviewReportController
// };

const pdfParse = require("pdf-parse");
const InterviewReportModel = require("../models/interviewReport.model");
const { generateInterviewReport } = require("../services/ai.service");
const puppeteer = require('puppeteer');

async function generateInterviewReportController(req, res) {

    try {

        const resumeFile = req.file;
        const { selfDescription, jobDescription } = req.body;

        // validate required fields
        if (!jobDescription?.trim()) {
            return res.status(400).json({ message: 'Job description is required' });
        }

        // extract resume text if a file was uploaded
        let resumeText = '';
        if (resumeFile && resumeFile.buffer) {
            try {
                const resumeContent = await (
                    new pdfParse.PDFParse(
                        Uint8Array.from(resumeFile.buffer)
                    )
                ).getText();

                resumeText = resumeContent && resumeContent.text ? resumeContent.text : '';
            } catch (err) {
                console.error('Failed to parse uploaded resume PDF:', err);
                resumeText = '';
            }
        }

        if (!resumeText?.trim() && !selfDescription?.trim()) {
            return res.status(400).json({
                message: 'Either upload a resume or provide a self description',
            });
        }

        const interviewReportByAi = await generateInterviewReport(resumeText, selfDescription, jobDescription);

        if (!interviewReportByAi.success) {
            return res.status(500).json({ message: interviewReportByAi.error });
        }

        // Map AI keys (matchscore) to model fields (matchScore)
        const aiData = interviewReportByAi.data || {};
        const docPayload = {
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            matchScore: aiData.matchscore ?? aiData.matchScore,
            technicalQuestions: aiData.technicalQuestions || [],
            behavioralQuestions: aiData.behavioralQuestions || [],
            skillGaps: aiData.skillGaps || [],
            preparationPlan: aiData.preparationPlan || []
        };

        const interviewReport = await InterviewReportModel.create(docPayload);

        res.status(201).json({
            message:
                "Interview report generated successfully",

            interviewReport
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
}

async function getAllInterviewReportsController(req, res) {
    try {
        const reports = await InterviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 });

        const sanitized = reports.map(sanitizeReportForClient);

        res.status(200).json({
            interviewReports: sanitized
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

async function getInterviewReportByIdController(req, res) {
    try {
        const { id } = req.params;

        const report = await InterviewReportModel.findOne({ _id: id, user: req.user.id });

        if (!report) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        res.status(200).json({ interviewReport: sanitizeReportForClient(report) });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    generateInterviewReportController,
    getAllInterviewReportsController,
    getInterviewReportByIdController,
    generateResumePdfController
};

// export dev helper
module.exports.generateTestReportController = generateTestReportController;

// Dev helper: create a sample interview report for the authenticated user
async function generateTestReportController(req, res) {
    try {
        // Dev-only helper — enabled for local testing

        const sample = {
            user: req.user.id,
            jobDescription: 'Senior Frontend Engineer — React, TypeScript, System Design',
            resume: 'Sample resume text for dev testing',
            selfDescription: '5+ years building frontend apps with React and Vite',
            matchScore: 87,
            technicalQuestions: [
                { question: 'Explain event loop', intention: 'Assess runtime understanding', answer: 'Event loop...' },
                { question: 'Describe React reconciliation', intention: 'Assess React knowledge', answer: 'Reconciliation...' }
            ],
            behavioralQuestions: [
                { question: 'Tell me about a time...', intention: 'Assess leadership', answer: 'I led a team...' }
            ],
            skillGaps: [
                { skill: 'Distributed systems', severity: 'medium ' }
            ],
            preparationPlan: [
                { day: 1, tasks: ['Read system design basics', 'Practice data structures'] },
                { day: 2, tasks: ['Implement sample app', 'Review algorithms'] }
            ]
        };

        const doc = await InterviewReportModel.create(sample);
        return res.status(201).json({ interviewReport: doc });

    } catch (error) {
        console.error('Dev generate test report failed', error);
        return res.status(500).json({ message: error.message });
    }
}

async function generateResumePdfController(req, res) {
        try {
                const { interviewReportId } = req.params;

                const report = await InterviewReportModel.findOne({ _id: interviewReportId, user: req.user.id });

                if (!report) return res.status(404).json({ message: 'Interview report not found' });

                const html = buildInterviewPlanReportHtml(report);

                const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: 'networkidle0' });
                const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' } });
                await browser.close();

                res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length });
                return res.status(200).send(pdfBuffer);

        } catch (error) {
                console.error('Failed to generate interview plan PDF:', error);
                return res.status(500).json({ message: error.message });
        }
}

function buildInterviewPlanReportHtml(report) {
        const generatedAt = new Date(report.createdAt).toLocaleString();
        const matchScoreLabel =
                report.matchScore !== null && report.matchScore !== undefined
                        ? `${report.matchScore}%`
                        : 'N/A';

        return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Interview Plan Report</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            color: #1e293b;
            font-size: 11pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 3px solid #0f766e;
            padding-bottom: 14px;
            margin-bottom: 22px;
        }
        .header h1 {
            margin: 0 0 6px;
            font-size: 22pt;
            color: #0f172a;
            letter-spacing: -0.02em;
        }
        .header-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            color: #64748b;
            font-size: 10pt;
        }
        .match-badge {
            display: inline-block;
            background: #ecfdf5;
            color: #047857;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 999px;
            border: 1px solid #a7f3d0;
        }
        .section {
            margin-bottom: 22px;
            page-break-inside: avoid;
        }
        .section h2 {
            font-size: 13pt;
            color: #0f766e;
            margin: 0 0 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
        }
        .prose {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            white-space: pre-wrap;
        }
        .question-block {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        .question-block:last-child { margin-bottom: 0; }
        .question-num {
            font-size: 9pt;
            font-weight: 700;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 6px;
        }
        .question-text {
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 10px;
        }
        .label {
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 4px;
        }
        .label--intention { color: #7c3aed; }
        .label--answer { color: #0369a1; }
        .block { margin-bottom: 10px; }
        .block:last-child { margin-bottom: 0; }
        .block p { margin: 0; color: #334155; }
        .skill-gaps {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .skill-tag {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 9.5pt;
            font-weight: 600;
            border: 1px solid transparent;
        }
        .skill-tag--low { background: #fef9c3; color: #854d0e; border-color: #fde047; }
        .skill-tag--medium { background: #ffedd5; color: #9a3412; border-color: #fdba74; }
        .skill-tag--high { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
        .day-card {
            border: 1px solid #e2e8f0;
            border-left: 4px solid #0f766e;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }
        .day-card:last-child { margin-bottom: 0; }
        .day-badge {
            font-weight: 700;
            color: #0f766e;
            margin-bottom: 8px;
        }
        .day-tasks {
            margin: 0;
            padding-left: 18px;
            color: #334155;
        }
        .day-tasks li { margin-bottom: 4px; }
        .empty { color: #94a3b8; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interview Plan Report</h1>
        <div class="header-meta">
            <span>Generated: ${escapeHtml(generatedAt)}</span>
            <span>Match Score: <span class="match-badge">${escapeHtml(matchScoreLabel)}</span></span>
        </div>
    </div>

    <div class="section">
        <h2>Target Job Description</h2>
        <div class="prose">${escapeHtml(report.jobDescription || 'Not provided.')}</div>
    </div>

    <div class="section">
        <h2>Your Self Description</h2>
        <div class="prose">${escapeHtml(report.selfDescription || 'Not provided.')}</div>
    </div>

    ${report.skillGaps && report.skillGaps.length > 0 ? `
    <div class="section">
        <h2>Skill Gaps</h2>
        <div class="skill-gaps">${renderSkillGaps(report.skillGaps)}</div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Technical Questions</h2>
        ${renderQuestions(report.technicalQuestions)}
    </div>

    <div class="section">
        <h2>Behavioral Questions</h2>
        ${renderQuestions(report.behavioralQuestions)}
    </div>

    <div class="section">
        <h2>Preparation Plan</h2>
        ${renderPreparationPlan(report.preparationPlan)}
    </div>
</body>
</html>`;
}

function escapeHtml(input) {
        if (input === null || input === undefined) return '';
        return String(input)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
}

function renderQuestions(questions) {
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
                return '<p class="empty">No questions available.</p>';
        }

        return questions.map((item, index) => {
                const q = typeof item === 'string' ? { question: item } : item;
                return `
        <div class="question-block">
            <div class="question-num">Question ${index + 1}</div>
            <p class="question-text">${escapeHtml(q.question || '')}</p>
            ${q.intention ? `
            <div class="block">
                <div class="label label--intention">Intention</div>
                <p>${escapeHtml(q.intention)}</p>
            </div>` : ''}
            ${q.answer ? `
            <div class="block">
                <div class="label label--answer">Model Answer</div>
                <p>${escapeHtml(q.answer)}</p>
            </div>` : ''}
        </div>`;
        }).join('');
}

function renderPreparationPlan(plan) {
        if (!plan || !Array.isArray(plan) || plan.length === 0) {
                return '<p class="empty">No preparation plan available.</p>';
        }

        return plan.map((day) => {
                const tasks = Array.isArray(day.tasks) ? day.tasks : [];
                const taskItems = tasks.length > 0
                        ? tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join('')
                        : '<li class="empty">No tasks listed.</li>';

                return `
        <div class="day-card">
            <div class="day-badge">Day ${escapeHtml(String(day.day ?? ''))}</div>
            <ul class="day-tasks">${taskItems}</ul>
        </div>`;
        }).join('');
}

function renderSkillGaps(gaps) {
        return gaps.map((gap) => {
                const severity = (gap.severity || 'medium').toString().trim().toLowerCase();
                const cssClass = ['low', 'medium', 'high'].includes(severity) ? severity : 'medium';
                return `<span class="skill-tag skill-tag--${cssClass}">${escapeHtml(gap.skill || '')}</span>`;
        }).join('');
}

// Ensure the report object has client-friendly fields (parse strings, map keys)
function sanitizeReportForClient(reportDoc) {
    if (!reportDoc) return reportDoc;

    // Clone plain object
    const r = JSON.parse(JSON.stringify(reportDoc));

    function tryParse(value) {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    // Normalize simple keys
    if (r.matchscore && !r.matchScore) r.matchScore = Number(r.matchscore) || r.matchScore;

    // Fields that should be arrays of objects
    ['technicalQuestions', 'behavioralQuestions', 'skillGaps', 'preparationPlan'].forEach((key) => {
        let val = r[key];
        if (typeof val === 'string') {
            val = tryParse(val);
        }
        if (Array.isArray(val)) {
            // ensure items are objects; parse if needed
            val = val.map((it) => (typeof it === 'string' ? tryParse(it) : it));
        } else if (val && typeof val === 'object' && Object.keys(val).length > 0) {
            // sometimes stored as an object with numeric keys
            val = Object.values(val).map((it) => (typeof it === 'string' ? tryParse(it) : it));
        } else {
            val = [];
        }

        r[key] = val;
    });

    // Ensure matchScore is numeric
    if (r.matchScore == null && typeof r.matchscore === 'number') r.matchScore = r.matchscore;
    if (r.matchScore != null) r.matchScore = Number(r.matchScore);

    return r;
}