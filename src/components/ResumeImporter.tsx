import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../css/resumeImporter.css";

type ResumeSkill = {
    skill_id: number;
    skill_name: string;
    detected_as?: string;
    existing?: boolean;
};

type ResumeEducation = {
    degree: string;
    field_of_study: string;
    institution: string;
    start_year: string;
    end_year: string;
};

type ResumeProject = {
    project_name: string;
    description: string;
    technologies_used: string;
    start_date: string;
    end_date: string;
    github_repo_url: string;
};

type ResumeExperience = {
    company_name: string;
    job_title: string;
    description: string;
    start_date: string;
    end_date: string;
};

type ResumeCourse = {
    course_name: string;
    provider: string;
    description: string;
    completion_date: string;
    certificate_url: string;
};

type ResumeCertification = {
    name: string;
    issuer: string;
    issue_date: string;
    credential_id: string;
};

type ResumeData = {
    skills: ResumeSkill[];
    unmatched_skills: string[];
    education: ResumeEducation[];
    projects: ResumeProject[];
    experience: ResumeExperience[];
    internships: ResumeExperience[];
    courses: ResumeCourse[];
    certifications: ResumeCertification[];
};

type ResumeImporterProps = {
    onImported: () => void;
};

function ResumeImporter({
    onImported
}: ResumeImporterProps) {

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);
    const [existingResume, setExistingResume] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [analyzing, setAnalyzing] =
        useState(false);

    const [importing, setImporting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [resumeData, setResumeData] =
        useState<ResumeData | null>(null);

    const [showReview, setShowReview] =
        useState(false);

    const token =
        localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    useEffect(() => {
        const fetchExistingResume = async () => {
            try {
                const response = await axios.get(
                    "/api/resume/file",
                    { headers }
                );

                console.log("EXISTING RESUME RESPONSE:", response.data);

                if (response.data?.filename) {
                    setExistingResume(response.data.filename);
                }
            } catch (error) {
                console.log("NO EXISTING RESUME:", error);
            }
        };

        fetchExistingResume();
    }, []);
    // =====================================================
    // FILE SELECTION
    // =====================================================

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0];

        setError("");
        setSuccess("");
        setResumeData(null);
        setShowReview(false);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(file.type)) {

            setError(
                "Please select a PDF or DOCX resume."
            );

            setSelectedFile(null);

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            setError(
                "Resume file must be smaller than 5 MB."
            );

            setSelectedFile(null);

            return;
        }

        setSelectedFile(file);
    };


    // =====================================================
    // ANALYZE RESUME
    // =====================================================

    const handleAnalyze = async () => {

        if (!selectedFile) {

            setError(
                "Please select a resume first."
            );

            return;
        }

        try {

            setAnalyzing(true);
            setError("");
            setSuccess("");

            const formData =
                new FormData();

            formData.append(
                "resume",
                selectedFile
            );

            const response =
                await axios.post(
                    "/api/resume/upload",
                    formData,
                    {
                        headers: {
                            ...headers,
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );

            setResumeData({
                skills:
                    response.data.skills || [],

                unmatched_skills:
                    response.data.unmatched_skills || [],

                education:
                    response.data.education || [],

                projects:
                    response.data.projects || [],

                experience:
                    response.data.experience || [],

                internships:
                    response.data.internships || [],

                courses:
                    response.data.courses || [],

                certifications:
                    response.data.certifications || []
            });

            setShowReview(true);

        } catch (error: any) {

            console.error(
                "Resume analysis error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to analyze resume."
            );

        } finally {

            setAnalyzing(false);
        }
    };


    // =====================================================
    // IMPORT TO PROFILE
    // =====================================================

    const handleImport = async () => {

        if (!resumeData) {
            return;
        }

        try {

            setImporting(true);
            setError("");
            setSuccess("");

            const response =
                await axios.post(
                    "/api/resume/import",
                    resumeData,
                    {
                        headers
                    }
                );

            setSuccess(
                response.data.message ||
                "Resume information imported successfully."
            );

            setShowReview(false);
            setResumeData(null);
            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            onImported();

        } catch (error: any) {

            console.error(
                "Resume import error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to import resume information."
            );

        } finally {

            setImporting(false);
        }
    };


    // =====================================================
    // RESET / DISCARD ANALYSIS
    // =====================================================

    const handleReset = () => {

        setSelectedFile(null);
        setResumeData(null);
        setShowReview(false);
        setError("");
        setSuccess("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    // =====================================================
    // DATE DISPLAY
    // =====================================================

    const formatDate = (
        value: string | null | undefined
    ) => {

        if (!value) {
            return "";
        }

        return value.slice(0, 10);
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <section className="resume-import-section">

            <div className="resume-import-header">

                <div>
                    <h2>
                        Import From Resume
                    </h2>

                    <p>
                        Let AI detect your skills, education,
                        projects, experience and courses automatically.
                    </p>
                </div>

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="resume-file-input"
                    />

                    <button
                        type="button"
                        className="resume-select-button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                    >
                        Choose Resume
                    </button>
                </div>

            </div>


            {/* =================================================
    UPLOAD AREA
================================================= */}

            {!showReview && (

                <div className="resume-upload-area">

                    {!selectedFile && !existingResume ? (

                        <>
                            <h3>
                                No resume selected
                            </h3>

                            <p>
                                Choose a PDF or DOCX resume to begin.
                            </p>
                        </>

                    ) : (

                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "15px",
                                    width: "100%",
                                }}
                            >
                                <h3 style={{ margin: 0, whiteSpace: "nowrap" }}>
                                    {selectedFile
                                        ? "Selected Resume"
                                        : "Current Resume"}
                                </h3>

                                <div
                                    className="selected-resume"
                                    style={{
                                        margin: 0,
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    <span>
                                        📄{" "}
                                        {selectedFile
                                            ? selectedFile.name
                                            : existingResume}
                                    </span>

                                    <small>
                                        {selectedFile
                                            ? `${(
                                                selectedFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)} MB`
                                            : "Current Resume"}
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="resume-analyze-button"
                                    style={{
                                        margin: 0,
                                        flexShrink: 0,
                                    }}
                                    disabled={!selectedFile || analyzing}
                                    onClick={handleAnalyze}
                                >
                                    {analyzing
                                        ? "Analyzing Resume..."
                                        : "Analyze Resume"}
                                </button>
                            </div>
                        </>

                    )}

                </div>
            )}


            {/* =================================================
                ERROR / SUCCESS
            ================================================= */}

            {error && (
                <div className="resume-message resume-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="resume-message resume-success">
                    {success}
                </div>
            )}


            {/* =================================================
                REVIEW SCREEN
            ================================================= */}

            {showReview && resumeData && (
                <div className="resume-review">

                    <div className="resume-review-top">

                        <div>

                            <h3>
                                Review Detected Information
                            </h3>

                            <p>
                                Check what AI detected before
                                adding it to your profile.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="resume-reset-button"
                            onClick={handleReset}
                            disabled={importing}
                        >
                            Choose Another Resume
                        </button>

                    </div>

                    <div className="scrollable">
                        {/* =================================================
                        SKILLS
                    ================================================= */}

                        <div className="resume-review-block">

                            <div className="resume-block-title">

                                <h4>
                                    Skills
                                </h4>

                                <span>
                                    {resumeData.skills.length}
                                </span>

                            </div>

                            {resumeData.skills.length > 0 ? (

                                <div className="resume-skill-list">

                                    {resumeData.skills.map(
                                        (skill) => (

                                            <div
                                                className={`resume-skill-item ${skill.existing
                                                    ? "existing"
                                                    : "new"
                                                    }`}
                                                key={skill.skill_id}
                                            >

                                                <span>
                                                    {skill.skill_name}
                                                </span>

                                                {/* <small>
                                                    {skill.existing
                                                        ? "Already in profile"
                                                        : "New"}
                                                </small> */}

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="resume-empty">
                                    No matching skills detected.
                                </p>
                            )}


                            {resumeData.unmatched_skills.length > 0 && (

                                <div className="resume-additional-skills">
                                    <div>
                                        <strong style={{ marginTop: "5px" }}>
                                            Additional skills detected
                                        </strong>
                                        {resumeData.unmatched_skills.map(
                                            (skill, index) => (

                                                <span key={index}>
                                                    {skill}
                                                </span>
                                            )
                                        )}

                                    </div>

                                </div>
                            )}

                        </div>


                        {/* =================================================
                        EDUCATION
                    ================================================= */}

                        <div className="resume-review-block">

                            <div className="resume-block-title">

                                <h4>
                                    Education
                                </h4>

                                <span>
                                    {resumeData.education.length}
                                </span>

                            </div>

                            {resumeData.education.length > 0 ? (

                                <div className="resume-detail-list">

                                    {resumeData.education.map(
                                        (item, index) => (

                                            <div
                                                className="resume-detail-item"
                                                key={index}
                                            >

                                                <strong>
                                                    {item.degree}
                                                </strong>

                                                {item.field_of_study && (
                                                    <span>
                                                        {item.field_of_study}
                                                    </span>
                                                )}

                                                {item.institution && (
                                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {item.institution}
                                                    </span>
                                                )}

                                                {(item.start_year ||
                                                    item.end_year) && (

                                                        <small>

                                                            {item.start_year || ""}

                                                            {item.start_year &&
                                                                item.end_year &&
                                                                " - "}

                                                            {item.end_year || ""}

                                                        </small>
                                                    )}

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="resume-empty">
                                    No education detected.
                                </p>
                            )}

                        </div>


                        {/* =================================================
                        PROJECTS
                    ================================================= */}

                        <div className="resume-review-block">

                            <div className="resume-block-title">

                                <h4>
                                    Projects
                                </h4>

                                <span>
                                    {resumeData.projects.length}
                                </span>

                            </div>

                            {resumeData.projects.length > 0 ? (

                                <div className="resume-detail-list">

                                    {resumeData.projects.map(
                                        (item, index) => (

                                            <div
                                                className="resume-detail-item"
                                                key={index}
                                            >

                                                <strong>
                                                    <p
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "black",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {item.project_name}</p>
                                                </strong>

                                                {item.description && (
                                                    <p
                                                        style={{
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {item.description}
                                                    </p>
                                                )}

                                                {item.technologies_used && (

                                                    <span>

                                                        {item.technologies_used}
                                                    </span>
                                                )}

                                                {(item.start_date ||
                                                    item.end_date) && (

                                                        <small>

                                                            {formatDate(
                                                                item.start_date
                                                            )}

                                                            {item.start_date &&
                                                                item.end_date &&
                                                                " - "}

                                                            {formatDate(
                                                                item.end_date
                                                            )}

                                                        </small>
                                                    )}

                                                {item.github_repo_url && (
                                                    <a
                                                        href={
                                                            item.github_repo_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        GitHub Repository
                                                    </a>
                                                )}

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="resume-empty">
                                    No projects detected.
                                </p>
                            )}

                        </div>


                        {/* =================================================
                        EXPERIENCE
                    ================================================= */}

                        <div className="resume-review-block">

                            <div className="resume-block-title">

                                <h4>
                                    Experience
                                </h4>

                                <span>
                                    {resumeData.experience.length}
                                </span>

                            </div>

                            {resumeData.experience.length > 0 ? (

                                <div className="resume-detail-list">

                                    {resumeData.experience.map(
                                        (item, index) => (

                                            <div
                                                className="resume-detail-item"
                                                key={index}
                                            >

                                                <strong>
                                                    {item.job_title}
                                                </strong>

                                                {item.company_name && (
                                                    <span>
                                                        {item.company_name}
                                                    </span>
                                                )}

                                                {item.description && (
                                                    <p>
                                                        {item.description}
                                                    </p>
                                                )}

                                                {(item.start_date ||
                                                    item.end_date) && (

                                                        <small>

                                                            {formatDate(
                                                                item.start_date
                                                            )}

                                                            {item.start_date &&
                                                                item.end_date &&
                                                                " - "}

                                                            {formatDate(
                                                                item.end_date
                                                            )}

                                                        </small>
                                                    )}

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="resume-empty">
                                    No work experience detected.
                                </p>
                            )}

                        </div>


                        {/* =================================================
                        INTERNSHIPS
                    ================================================= */}

                        <div className="resume-review-block">

                            <div className="resume-block-title">

                                <h4>
                                    Internships
                                </h4>

                                <span>
                                    {resumeData.internships.length}
                                </span>

                            </div>

                            {resumeData.internships.length > 0 ? (

                                <div className="resume-detail-list">

                                    {resumeData.internships.map(
                                        (item, index) => (

                                            <div
                                                className="resume-detail-item"
                                                key={index}
                                            >

                                                <strong>
                                                    {item.job_title}
                                                </strong>

                                                {item.company_name && (
                                                    <span>
                                                        {item.company_name}
                                                    </span>
                                                )}

                                                {item.description && (
                                                    <p>
                                                        {item.description}
                                                    </p>
                                                )}

                                                {(item.start_date ||
                                                    item.end_date) && (

                                                        <small>

                                                            {formatDate(
                                                                item.start_date
                                                            )}

                                                            {item.start_date &&
                                                                item.end_date &&
                                                                " - "}

                                                            {formatDate(
                                                                item.end_date
                                                            )}

                                                        </small>
                                                    )}

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="resume-empty">
                                    No internships detected.
                                </p>
                            )}

                        </div>


                        {/* =================================================
                        COURSES
                    ================================================= */}

                        <div className="resume-review-block">

                            <div className="resume-block-title">

                                <h4>
                                    Courses
                                </h4>

                                <span>
                                    {resumeData.courses.length}
                                </span>

                            </div>

                            {resumeData.courses.length > 0 ? (

                                <div className="resume-detail-list">

                                    {resumeData.courses.map(
                                        (item, index) => (

                                            <div
                                                className="resume-detail-item"
                                                key={index}
                                            >

                                                <strong>
                                                    {item.course_name}
                                                </strong>

                                                {item.provider && (
                                                    <span>
                                                        {item.provider}
                                                    </span>
                                                )}

                                                {item.description && (
                                                    <p>
                                                        {item.description}
                                                    </p>
                                                )}

                                                {item.completion_date && (
                                                    <small>
                                                        Completed{" "}
                                                        {formatDate(
                                                            item.completion_date
                                                        )}
                                                    </small>
                                                )}

                                                {item.certificate_url && (
                                                    <a
                                                        href={
                                                            item.certificate_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        View Certificate
                                                    </a>
                                                )}

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="resume-empty">
                                    No courses detected.
                                </p>
                            )}

                        </div>





                        {/* =================================================
                        IMPORT BUTTONS
                    ================================================= */}

                        <div className="resume-import-actions">

                            <button
                                type="button"
                                className="resume-cancel-button"
                                onClick={handleReset}
                                disabled={importing}
                            >
                                Discard Analysis
                            </button>

                            <button
                                type="button"
                                className="resume-import-button"
                                onClick={handleImport}
                                disabled={importing}
                            >
                                {importing
                                    ? "Adding to Profile..."
                                    : "Add to Profile"}
                            </button>

                        </div>
                    </div>

                </div>
            )}

        </section>
    );
}

export default ResumeImporter;
