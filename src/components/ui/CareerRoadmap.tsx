import { useEffect, useState } from "react";
import axios from "axios";
import "../../css/roadmap.css";
import { BookOpen, PlayCircle, ExternalLink } from "lucide-react";

type RoadmapSkill = {
    skill_id: number;
    skill_name: string;
    category: string;
    description: string;
    documentation_url: string | null;
    youtube_url: string | null;
    learning_topics: string;
    skill_level: "Beginner" | "Intermediate" | "Advanced";
    roadmap_stage: number;
    sequence_order: number;
    status: "completed" | "not_started" | "verified";



    verification_repository?: string;
    verification_confidence?: number;
    verification_evidence?: string;
};

type CareerPath = {
    user_career_id: number;
    career_id: number;
    career_name: string;
    description: string;
    category: string;
};

type CareerRoadmapProps = {
    careerId: number;
};



function CareerRoadmap({ careerId }: CareerRoadmapProps) {
    const [roadmap, setRoadmap] = useState<RoadmapSkill[]>([]);
    const [loading, setLoading] = useState(true);

    const [openSkillId, setOpenSkillId] = useState<number | null>(null);

    const [, setCareerPaths] = useState<CareerPath[]>([]);
    const [isCareerPath, setIsCareerPath] = useState(false);

    const [verifySkill, setVerifySkill] = useState<RoadmapSkill | null>(null);
    const [repositoryUrl, setRepositoryUrl] = useState("");
    const [verificationResult, setVerificationResult] = useState<{
        verified: boolean;
        confidence?: number;
        evidence?: string;
    } | null>(null);
    const [verifying, setVerifying] = useState(false);


    useEffect(() => {
        async function loadRoadmap() {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `/api/careers/${careerId}/roadmap`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log("CAREER ROADMAP:", response.data);
                setRoadmap(response.data);

                // ================= USER CAREER PATHS =================

                const pathsResponse = await axios.get(
                    "/api/careers/paths",
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                console.log(
                    "USER CAREER PATHS:",
                    pathsResponse.data
                );

                setCareerPaths(pathsResponse.data);

                // Check whether this career is selected
                const selected = pathsResponse.data.some(
                    (path: CareerPath) =>
                        Number(path.career_id) === Number(careerId)
                );

                setIsCareerPath(selected);

                console.log(
                    "IS THIS CAREER PATH:",
                    selected
                );

            } catch (error) {
                console.error("CAREER ROADMAP API ERROR:", error);
            } finally {
                setLoading(false);
            }
        }
        loadRoadmap();
    }, [careerId]);

    if (loading) {
        return (
            <div className="roadmap-loading">
                Loading roadmap...
            </div>
        );
    }

    if (roadmap.length === 0) {
        return (
            <div className="roadmap-empty">
                No roadmap available for this career.
            </div>
        );
    }

    const toggleSkill = (skillId: number) => {
        setOpenSkillId(openSkillId === skillId ? null : skillId);
    };

    const openVerifyPopup = (skill: RoadmapSkill) => {
        setVerifySkill(skill);
        setRepositoryUrl("");
        setVerificationResult(null);
    };

    const closeVerifyPopup = () => {
        setVerifySkill(null);
        setRepositoryUrl("");
        setVerificationResult(null);
    };

    const handleVerifySkill = async () => {
        if (!repositoryUrl.trim()) {
            setVerificationResult({
                verified: false,
                evidence: "Please enter a GitHub repository URL."
            });
            return;
        }

        if (!repositoryUrl.startsWith("https://github.com/")) {
            setVerificationResult({
                verified: false,
                evidence: "Please enter a valid GitHub repository URL."
            });
            return;
        }

        try {
            setVerifying(true);
            setVerificationResult(null);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                "/api/skill-verification/verify",
                {
                    skill_id: verifySkill?.skill_id,
                    repository_url: repositoryUrl
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("VERIFICATION RESULT:", response.data);

            if (response.data.verified) {

                setRoadmap((currentRoadmap) =>
                    currentRoadmap.map((skill) =>
                        skill.skill_id === verifySkill?.skill_id
                            ? {
                                ...skill,
                                status: "verified",
                                verification_repository: repositoryUrl,
                                verification_confidence:
                                    response.data.confidence,
                                verification_evidence:
                                    response.data.evidence
                            }
                            : skill
                    )
                );

                // Verification succeeded.
                // Close popup instead of showing result inside it.
                closeVerifyPopup();

            } else {

                // Only failed verification stays inside popup.
                setVerificationResult({
                    verified: false,
                    confidence: response.data.confidence,
                    evidence: response.data.evidence
                });
            }

        } catch (error: any) {

            console.error(
                "VERIFICATION ERROR:",
                error
            );

            setVerificationResult({
                verified: false,
                evidence:
                    error.response?.data?.message ||
                    "Something went wrong while verifying the skill."
            });

        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="career-roadmap">
            <div className="roadmap-line">
                {["Beginner", "Intermediate", "Advanced"].map((level) => {
                    const levelSkills = roadmap.filter((skill) => skill.skill_level === level);
                    if (levelSkills.length === 0) return null;
                    return (
                        <div className={`roadmap-level-group level-${level.toLowerCase()}`} key={level}>
                            <div className="roadmap-level-title"> {level} </div>
                            <div className="roadmap-level-skills">
                                {levelSkills.map((skill) => {
                                    const index = roadmap.findIndex(
                                        (item) => item.skill_id === skill.skill_id
                                    );
                                    const isOpen = openSkillId === skill.skill_id;

                                    return (
                                        <div className="roadmap-item" key={skill.skill_id} >
                                            <div
                                                className={`roadmap-node ${skill.status === "completed" ||
                                                    skill.status === "verified"
                                                    ? "completed"
                                                    : "not-started"
                                                    }`}
                                            >
                                                {skill.status === "completed" ||
                                                    skill.status === "verified"
                                                    ? "✓"
                                                    : index + 1}
                                            </div>
                                            <div className="roadmap-card">
                                                <div className="roadmap-card-header">
                                                    <div className="sub">
                                                        <div className="roadmap-stage"> Stage {skill.roadmap_stage}  </div>
                                                        <h3>{skill.skill_name}</h3>
                                                    </div>
                                                    <div className="roadmap-card-actions">
                                                        {/* <p>{skill.skill_level} level </p> */}
                                                        <span
                                                            className={`roadmap-status ${skill.status === "verified"
                                                                ? "status-verified"
                                                                : skill.status === "completed"
                                                                    ? "status-completed"
                                                                    : "status-not-started"
                                                                }`}
                                                        >
                                                            {skill.status === "verified"
                                                                ? "Verified"
                                                                : skill.status === "completed"
                                                                    ? "Completed"
                                                                    : "Not Started"}
                                                        </span>
                                                        {isCareerPath && (<button type="button" className={`roadmap-toggle ${isOpen ? "open" : ""}`} onClick={() => toggleSkill(skill.skill_id)} aria-label={isOpen ? `Close ${skill.skill_name} details` : `Open ${skill.skill_name} details`} >
                                                            {isOpen ? "⌃" : "⌄"}
                                                        </button>)}
                                                    </div>
                                                </div>

                                                {isCareerPath && isOpen && (
                                                    <div className="roadmap-details">
                                                        {/* Description */}
                                                        <div className="roadmap-detail-section">
                                                            <h4>About this skill</h4>
                                                            <p>
                                                                {skill.description ||
                                                                    "No description available for this skill."}
                                                            </p>
                                                        </div>


                                                        {/* Learning Topics */}
                                                        {skill.learning_topics && (
                                                            <div className="roadmap-learning-topics">

                                                                <h4>What you'll learn</h4>

                                                                <ul>
                                                                    {skill.learning_topics
                                                                        .split("|")
                                                                        .map((topic, index) => (
                                                                            <li key={index}>
                                                                                {topic}
                                                                            </li>
                                                                        ))}
                                                                </ul>

                                                            </div>
                                                        )}


                                                        {/* Resources */}
                                                        {(skill.documentation_url || skill.youtube_url) && (
                                                            <div>
                                                                <h4>Learning Resources</h4>
                                                                <div className="roadmap-resources">

                                                                    {skill.documentation_url && (
                                                                        <a
                                                                            href={skill.documentation_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="roadmap-resource"
                                                                        >
                                                                            <div className="resource-icon">
                                                                                <BookOpen size={18} strokeWidth={1.8} />
                                                                            </div>

                                                                            <div className="resource-content">
                                                                                <span className="resource-title">
                                                                                    Documentation
                                                                                </span>

                                                                                <span className="resource-description">
                                                                                    Read the official documentation and learn the
                                                                                    concepts in detail.
                                                                                </span>
                                                                            </div>

                                                                            <ExternalLink
                                                                                className="resource-arrow"
                                                                                size={16}
                                                                                strokeWidth={1.8}
                                                                            />
                                                                        </a>
                                                                    )}

                                                                    {skill.youtube_url && (
                                                                        <a
                                                                            href={skill.youtube_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="roadmap-resource"
                                                                        >
                                                                            <div className="resource-icon">
                                                                                <PlayCircle size={18} strokeWidth={1.8} />
                                                                            </div>

                                                                            <div className="resource-content">
                                                                                <span className="resource-title">
                                                                                    Learn on YouTube
                                                                                </span>

                                                                                <span className="resource-description">
                                                                                    Watch tutorials and follow practical
                                                                                    explanations to build your skills.
                                                                                </span>
                                                                            </div>

                                                                            <ExternalLink
                                                                                className="resource-arrow"
                                                                                size={16}
                                                                                strokeWidth={1.8}
                                                                            />
                                                                        </a>
                                                                    )}

                                                                </div>
                                                            </div>
                                                        )}


                                                        {/* Skill Verification */}
                                                        <div className="skill-verification">
                                                            {skill.status === "verified" ? (
                                                                <div className="verification-completed">
                                                                    <div className="verification-completed-header">
                                                                        <div>
                                                                            <h4>Skill Verified</h4>

                                                                            <p>
                                                                                This skill has been verified through your GitHub repository.
                                                                            </p>
                                                                        </div>

                                                                        <span className="verified-label">
                                                                            ✓ Verified
                                                                        </span>
                                                                    </div>

                                                                    {skill.verification_repository && (
                                                                        <div className="verification-repository">

                                                                            <span className="verification-info-label">
                                                                                Repository
                                                                            </span>

                                                                            <a
                                                                                href={skill.verification_repository}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                            >
                                                                                {skill.verification_repository}
                                                                                <ExternalLink
                                                                                    size={13}
                                                                                    strokeWidth={1.8}
                                                                                />
                                                                            </a>

                                                                        </div>
                                                                    )}

                                                                    <div className="verification-meta">
                                                                        {skill.verification_confidence !== undefined && (
                                                                            <div className="verification-confidence">
                                                                                <span className="verification-info-label">
                                                                                    Confidence
                                                                                </span>

                                                                                <strong>
                                                                                    {skill.verification_confidence}%
                                                                                </strong>
                                                                            </div>
                                                                        )}

                                                                        {skill.verification_evidence && (
                                                                            <div className="verification-evidence">

                                                                                <span className="verification-info-label">
                                                                                    Verification Evidence
                                                                                </span>

                                                                                <p>
                                                                                    {skill.verification_evidence}
                                                                                </p>

                                                                            </div>
                                                                        )}

                                                                    </div>

                                                                </div>

                                                            ) : (

                                                                <>
                                                                    <div className="skill-verification-content">

                                                                        <h4>
                                                                            Verify this skill
                                                                        </h4>

                                                                        <p>
                                                                            Show a GitHub repository where you have
                                                                            implemented {skill.skill_name}.
                                                                        </p>

                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className="verify-skill-button"
                                                                        onClick={() => openVerifyPopup(skill)}
                                                                    >
                                                                        Verify Skill
                                                                    </button>
                                                                </>

                                                            )}

                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {verifySkill && (
                                                <div
                                                    className="verification-overlay"
                                                    onClick={closeVerifyPopup}
                                                >
                                                    <div
                                                        className="verification-modal"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >

                                                        <div className="verification-modal-header">

                                                            <div>
                                                                <span className="verification-label">
                                                                    SKILL VERIFICATION
                                                                </span>

                                                                <h3>
                                                                    Verify {verifySkill.skill_name}
                                                                </h3>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="verification-close"
                                                                onClick={closeVerifyPopup}
                                                                aria-label="Close verification popup"
                                                            >
                                                                ×
                                                            </button>

                                                        </div>

                                                        <div className="verification-modal-body">

                                                            <p>
                                                                Add a GitHub repository where you have
                                                                actually implemented this skill.
                                                            </p>

                                                            <label htmlFor="repository-url">
                                                                GitHub Repository URL
                                                            </label>

                                                            <input
                                                                id="repository-url"
                                                                type="url"
                                                                placeholder="https://github.com/username/repository"
                                                                value={repositoryUrl}
                                                                onChange={(event) =>
                                                                    setRepositoryUrl(event.target.value)
                                                                }
                                                            />

                                                            <small>
                                                                The repository will be analyzed to verify
                                                                your use of {verifySkill.skill_name}.
                                                            </small>

                                                            {verificationResult && (
                                                                <div className="verification-result verification-failed">
                                                                    <div className="verification-result-icon">
                                                                        !
                                                                    </div>
                                                                    <div className="verification-result-content">
                                                                        <h4>
                                                                            Skill Not Verified
                                                                        </h4>

                                                                        <p>
                                                                            {verificationResult.evidence}
                                                                        </p>

                                                                    </div>

                                                                </div>
                                                            )}

                                                        </div>

                                                        <div className="verification-modal-actions">

                                                            <button
                                                                type="button"
                                                                className="verification-cancel"
                                                                onClick={closeVerifyPopup}
                                                            >
                                                                Cancel
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="verification-submit"
                                                                onClick={handleVerifySkill}
                                                                disabled={verifying}
                                                            >
                                                                {verifying ? "Verifying..." : "Verify Skill"}
                                                            </button>

                                                        </div>

                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div >
        </div >
    );
}

export default CareerRoadmap;
