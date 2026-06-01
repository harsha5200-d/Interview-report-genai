import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../Auth/hooks/useAuth'
import { useNavigate } from 'react-router'

const Home = () => {

    const { loading, generateReport, reports, getResumePdf } = useInterview()
    const { user, handleLogout } = useAuth()
    const [showAll, setShowAll] = useState(false)
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ isDragOver, setIsDragOver ] = useState(false)
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ error, setError ] = useState(null)
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        setError(null)

        // simple client-side validation: job description is required
        if (!jobDescription || jobDescription.trim().length === 0) {
            setError('Please enter the target job description before generating a plan.')
            return
        }

        const file = resumeFile ?? resumeInputRef.current?.files?.[0]
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile: file })
            if (data && data._id) {
                navigate(`/interview/${data._id}`)
            } else {
                setError('Failed to generate report — no report returned.')
            }
        } catch (err) {
            console.error('Generate failed', err)
            setError(err?.response?.data?.message || err.message || 'Failed to generate report')
        }
    }

    const handleFileChange = (e) => {
        const f = e.target.files && e.target.files[0]
        if (f) setResumeFile(f)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
        const f = e.dataTransfer?.files?.[0]
        if (f) {
            setResumeFile(f)
            // also update the hidden input's files if possible
            try { resumeInputRef.current.files = e.dataTransfer.files } catch (err) {}
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>

            {/* Page Header */}
            <header className='page-header'>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                    <div>
                        <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                        <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
                    </div>
                    <div>
                        <button className='logout-btn' onClick={handleLogout} title='Logout'>Logout</button>
                    </div>
                </div>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            value={jobDescription}
                            className='panel__textarea'
                                placeholder={`Paste the full job description here...\ne.g. 'MERN Stack Developer — MongoDB, Express.js, React.js, Node.js, REST APIs, JWT authentication, Git, deployment on Vercel/Render...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label
                                className={`dropzone ${isDragOver ? 'dropzone--over' : ''}`}
                                htmlFor='resume'
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <span className='dropzone__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                <input ref={resumeInputRef} hidden onChange={handleFileChange} type='file' id='resume' name='resume' accept='.pdf,.docx' />
                            </label>
                            {resumeFile && (
                                <div className='dropzone__filename'>Selected: {resumeFile.name} ({(resumeFile.size/1024).toFixed(1)} KB)</div>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Describe your experience, stack, projects, and tools — e.g. MERN developer with JWT auth, REST APIs, MongoDB, React, Node.js, deployments on Vercel/Render..."
                                maxLength={5000}
                            />
                        </div>

                        <div className='char-counter'>{selfDescription.length} / 5000 chars</div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                    <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                        <button
                        onClick={handleGenerateReport}
                        className='generate-btn'
                        disabled={!(jobDescription && (resumeFile || resumeInputRef.current?.files?.length || selfDescription))}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
                {error && (
                    <div className='form-error' style={{ color: '#b00020', marginTop: 12 }}>{error}</div>
                )}
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {(showAll ? reports : reports.slice(0, 5)).map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <div className='report-item__main'>
                                    <h3>{(report.jobDescription && report.jobDescription.slice(0, 80)) || 'Untitled Position'}</h3>
                                    <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className='report-item__actions'>
                                    <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match: {report.matchScore ?? 'N/A'}%</p>
                                    <button
                                        className='icon-btn'
                                        onClick={(e) => { e.stopPropagation(); navigate(`/interview/${report._id}`) }}
                                        aria-label={`View report ${report._id}`}
                                    >
                                        View
                                    </button>
                                    <button
                                        className='icon-btn'
                                        onClick={(e) => { e.stopPropagation(); getResumePdf(report._id) }}
                                        aria-label={`Download interview plan report for ${report._id}`}
                                    >
                                        Interview Plan Report
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {reports.length > 5 && (
                        <div className='reports-footer'>
                            <button className='link-btn' onClick={() => setShowAll(prev => !prev)}>{showAll ? 'Show less' : `Show all (${reports.length})`}</button>
                        </div>
                    )}
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home