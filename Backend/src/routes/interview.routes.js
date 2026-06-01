const express = require("express");
const authMiddleware  = require("../middleware/auth.middleware");
const interviewController = require("../controller/interview.controller")
const upload = require("../middleware/file.middleware")
const interviewRouter = express.Router();

/**
 * @route POST/api.interview/
 * @description Generate an interview report based on the provided resume, self-description, and job description
 * @access private 
*/


interviewRouter.post("/", authMiddleware.authUser,upload.single("resume"),interviewController.generateInterviewReportController)

// Get all interview reports for the authenticated user
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

// Get a single interview report by id
interviewRouter.get("/report/:id", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

// Generate interview plan report PDF (rendered via Puppeteer)
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

// Dev-only: create a sample report for testing
// Dev helper route to create a sample report for testing (protected)
interviewRouter.post('/dev/create-report', authMiddleware.authUser, interviewController.generateTestReportController)

module.exports = interviewRouter;