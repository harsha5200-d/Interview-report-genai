import { createContext, useState, useEffect, useCallback } from "react";
import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "./services/interview.api";

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);

    const getReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllInterviewReports();
            if (res && res.interviewReports) setReports(res.interviewReports);
        } catch (err) {
            console.error("Failed to load interview reports:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);
        try {
            const res = await generateInterviewReport({ jobDescription, selfDescription, resumeFile });
            if (res && res.interviewReport) {
                setReport(res.interviewReport);
                // prepend to reports
                setReports(prev => [res.interviewReport, ...prev]);
                return res.interviewReport;
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
            throw err;
        } finally {
            setLoading(false);
        }
        return null;
    }, []);

    const getReportById = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await getInterviewReportById(id);
            if (res && res.interviewReport) {
                setReport(res.interviewReport);
                return res.interviewReport;
            }
        } catch (err) {
            console.error("Failed to load report:", err);
        } finally {
            setLoading(false);
        }
        return null;
    }, []);

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true);
        try {
            const blob = await generateResumePdf({ interviewReportId });
            const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `interview-plan-report_${interviewReportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to download interview plan report:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Rehydrate reports on mount
    useEffect(() => {
        getReports();
    }, [getReports]);

    return (
        <InterviewContext.Provider value={{ loading, setLoading, report, setReport, reports, setReports, generateReport, getReports, getReportById, getResumePdf }}>
            {children}
        </InterviewContext.Provider>
    );
};