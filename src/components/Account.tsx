import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import Navbar from "../components/ui/Navbar";
import "../css/account.css";
import {
    GraduationCap, Briefcase, FolderGit2, BookOpen,
    Pencil,
    Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EducationForm from "../components/forms/EducationForm";
import CourseForm from "../components/forms/CourseForm";
import ExperienceForm from "../components/forms/ExperienceForm";
import ProjectForm from "../components/forms/ProjectForm";
import CredlyPopup from "../components/ui/CredlyPopup";
import ResumeImporter from "../components/ResumeImporter";


type GithubData = {
    github_username: string;
    repository_count: number;
    detected_languages: string[];
    detected_technologies: string[];
    synced_at: string;
};

export type Education = {
    education_id: number;
    degree: string;
    field_of_study: string;
    institution: string;
    start_year: number;
    end_year: number;
    skill_ids?: number[];
};

export type Course = {
    course_id: number;
    course_name: string;
    provider: string;
    description: string;
    completion_date: string;
    certificate_url?: string;
    skill_ids?: number[];
};

export type Experience = {
    experience_id: number;
    experience_type: string;
    job_title: string;
    company_name: string;
    description: string;
    start_date: string;
    end_date?: string;
    skill_ids?: number[];
};

export type Project = {
    project_id: number;
    project_name: string;
    description: string;
    technologies_used: string;
    start_date: string;
    end_date: string;
    github_repo_url?: string;
    project_source?: "Manual" | "GitHub";
    skill_ids?: number[];
};

function Account() {
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [education, setEducation] = useState<Education[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [loading, setLoading] = useState(true);
    const [githubData, setGithubData] =
        useState<GithubData | null>(null);
    const [githubSyncing, setGithubSyncing] =
        useState(false);

    //for form add
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);

    //for form edit
    const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    //for form delete
    const [deleteEducationItem, setDeleteEducationItem] =
        useState<Education | null>(null);
    const [deleteExperience, setDeleteExperience] =
        useState<Experience | null>(null);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [deleteCourse, setDeleteCourse] =
        useState<Course | null>(null);

    //for courses
    const [showCredlyModal, setShowCredlyModal] = useState(false);
    const [credlyUrl, setCredlyUrl] = useState("");
    const [credlyLoading, setCredlyLoading] = useState(false);
    const [credlyCredential, setCredlyCredential] = useState<any>(null);

    const [githubImport, setGithubImport] =
        useState(false);

    const token = localStorage.getItem("token");
    const headers = {
        Authorization: `Bearer ${token}`
    };

    useEffect(() => {
        loadAccountData();
    }, []);

    const handleGithubSync = async () => {

        try {

            setGithubSyncing(true);

            const token =
                localStorage.getItem("token");


            const response = await axios.post(
                "/api/github/sync",
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            console.log("GITHUB SYNC RESPONSE:", response.data);
            setGithubData({
                github_username:
                    response.data.github_username,

                repository_count:
                    response.data.repositories,

                detected_languages:
                    response.data.detected_languages,

                detected_technologies:
                    response.data.detected_technologies,

                synced_at:
                    new Date().toISOString()
            });


            await loadAccountData();

        } catch (error: any) {

            console.error(
                "GitHub sync error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to synchronize GitHub"
            );

        } finally {

            setGithubSyncing(false);
        }
    };

    const loadAccountData = async () => {
        try {
            const [
                educationResponse,
                coursesResponse,
                experienceResponse,
                projectsResponse
            ] = await Promise.all([
                axios.get(
                    "/api/profile/education",
                    { headers }
                ),

                axios.get(
                    "/api/profile/course",
                    { headers }
                ),

                axios.get(
                    "/api/profile/experience",
                    { headers }
                ),

                axios.get(
                    "/api/profile/project",
                    { headers }
                )
            ]);
            setEducation(educationResponse.data);
            setCourses(coursesResponse.data);
            setExperience(experienceResponse.data);
            setProjects(projectsResponse.data);

            const githubResponse = await axios.get(
                "/api/github/sync",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setGithubData(githubResponse.data);
        } catch (error) {
            console.error("ACCOUNT DATA ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">

            <Navbar />

            <main className="dashboard-content account-content">
                <div className="account-header">
                    <h1>Profile</h1>
                    <p>
                        Manage your account and career information
                    </p>
                </div>


                {/* PROFILE */}
                <section className="profile-card">
                    <div className="profile-avatar">
                        {user?.full_name?.split(" ").map((name) => name[0])
                            .join("").slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <div>
                        <div className="profile-card-top">

                            <div className="profile-main">
                                <div className="profile-name-row">
                                    <div>
                                        <h1>{user?.full_name || "Your Name"}</h1>
                                        {/* <p className="profile-subtitle">
                                            {user?.career_goal_name
                                                ? `Aspiring ${user.career_goal_name}`
                                                : "Build your career profile"}
                                        </p> */}
                                    </div>
                                    <button className="profile-edit-button" onClick={() => { navigate("/profile") }}>
                                        ✎ Edit Profile
                                    </button>
                                </div>
                                <p className="profile-about">
                                    {user?.about || "Add a short description about yourself to tell others about your interests, skills and career goals."}
                                </p>
                            </div>
                        </div>

                        <div className="profile-divider"></div>
                        <div className="profile-info-row">
                            <div className="profile-info">
                                <div className="profile-info-icon">
                                    ✉
                                </div>
                                <div>
                                    <span>Email</span>
                                    <strong>{user?.email}</strong>
                                </div>
                            </div>

                            <div className="profile-info">
                                <div className="profile-info-icon">
                                    ◉
                                </div>

                                <div>
                                    <span>GitHub</span>

                                    {user?.github_profile_url ? (
                                        <>
                                            <a
                                                href={user.github_profile_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {user.github_profile_url} ↗
                                            </a>
                                        </>
                                    ) : (
                                        <strong className="not-added">
                                            Add GitHub profile first
                                        </strong>
                                    )}
                                </div>
                            </div>

                            <div className="profile-info">
                                <div className="profile-info-icon">
                                    in
                                </div>
                                <div>
                                    <span>LinkedIn</span>
                                    {user?.linkedin_profile_url ? (
                                        <a
                                            href={user.linkedin_profile_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Profile ↗
                                        </a>
                                    ) : (
                                        <strong className="not-added">Not added</strong>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <ResumeImporter
                    onImported={loadAccountData}
                />

                {/* CAREER GOAL */}
                {/* <section className="career-goal-section">
                    <div className="career-goal-heading">
                        <div>
                            <h2>Career Destination</h2>
                            <p> The career you're currently working towards</p>
                        </div>
                        {user?.career_goal_id && (
                            <span className="goal-active"> ● Active Goal</span>
                        )}
                    </div>
                    {user?.career_goal_id ? (
                        <div className="career-destination-card">
                            <div className="career-destination-info">
                                <span>YOUR CURRENT GOAL</span>
                                <h3>{user.career_goal_name}</h3>
                                <p>Keep building the skills required to reach your target career. </p>
                            </div>

                            <button className="career-view-button" onClick={() =>
                                window.location.href = `/careers/${user.career_goal_id}`
                            }>
                                View Career<span>→</span>
                            </button>
                        </div>
                    ) : (
                        <div className="career-destination-card no-goal">
                            <div className="career-destination-info">
                                <span>NO CAREER GOAL SELECTED</span>
                                <h3> Choose your career destination </h3>
                                <p> Select a career to get a personalized roadmap and track your progress. </p>
                            </div>
                            <button className="career-view-button"
                                onClick={() => window.location.href = "/careers"}
                            >
                                Explore Careers<span>→</span>
                            </button>
                        </div>
                    )}
                </section> */}


                <section className="github-section">
                    {!githubData ? (

                        <div className="github-empty">

                            <div className="github-empty-icon">
                                ◉
                            </div>

                            <div>
                                <h3>Connect your GitHub activity</h3>

                                <p>
                                    Sync your repositories to automatically
                                    detect the technologies you use.
                                </p>
                            </div>

                            {user?.github_profile_url && (
                                <button
                                    className="github-sync-main-button"
                                    onClick={handleGithubSync}
                                    disabled={githubSyncing}
                                >
                                    {githubSyncing
                                        ? "Syncing..."
                                        : "Sync GitHub"}
                                </button>
                            )}

                        </div>

                    ) : (

                        <div className="github-analysis">


                            {/* GitHub overview */}

                            <div className="github-overview">

                                <div className="github-profile">

                                    <div className="github-avatar">
                                        ◉
                                    </div>

                                    <div>
                                        <span>GITHUB PROFILE</span>

                                        <h3>
                                            @{githubData.github_username}
                                        </h3>

                                        <a
                                            href={user?.github_profile_url || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View GitHub Profile ↗
                                        </a>
                                    </div>

                                </div>


                                <div className="github-stat">

                                    <strong>
                                        {githubData.repository_count}
                                    </strong>

                                    <span>
                                        Repositories
                                    </span>

                                </div>


                                <button
                                    className="github-sync-main-button"
                                    onClick={handleGithubSync}
                                    disabled={githubSyncing}
                                >
                                    {githubSyncing
                                        ? "Syncing..."
                                        : "Sync GitHub"}
                                </button>

                            </div>


                            {/* Extracted Skills */}

                            <div className="github-result-block">

                                <div className="github-result-title">

                                    <div>
                                        <h3>Extracted Skills</h3>
                                    </div>
                                    <span>
                                        {
                                            [
                                                ...githubData.detected_languages,
                                                ...githubData.detected_technologies
                                            ].filter(
                                                (skill, index, array) =>
                                                    array.indexOf(skill) === index
                                            ).length
                                        }
                                    </span>

                                </div>
                                {[
                                    ...githubData.detected_languages,
                                    ...githubData.detected_technologies
                                ].filter(
                                    (skill, index, array) =>
                                        array.indexOf(skill) === index
                                ).length > 0 ? (

                                    <div className="github-tags">

                                        {[
                                            ...githubData.detected_languages,
                                            ...githubData.detected_technologies
                                        ]
                                            .filter(
                                                (skill, index, array) =>
                                                    array.indexOf(skill) === index
                                            )
                                            .map((skill) => (

                                                <span
                                                    className="github-tag technology-tag"
                                                    key={skill}
                                                >
                                                    {skill}
                                                </span>

                                            ))}

                                    </div>

                                ) : (

                                    <p className="github-no-data">
                                        No skills detected from GitHub.
                                    </p>

                                )}

                            </div>


                            <div className="github-last-sync">

                                Last synchronized:{" "}

                                {new Date(
                                    githubData.synced_at
                                ).toLocaleString()}

                            </div>

                        </div>

                    )}

                </section>

                {/* EDUCATION */}
                <section className="account-section">
                    <div className="section-header">
                        <div>
                            <h2>Education</h2>
                            <p>Your educational background</p>
                        </div>
                        <button className="add-button" onClick={() => { setSelectedEducation(null); setShowEducationForm(true); }}>
                            + Add Education
                        </button>
                    </div>
                    {education.length === 0 ? (
                        <div className="empty-section">
                            No education added yet.
                        </div>
                    ) : (
                        <div className="account-list">
                            {education.map((item) => (
                                <div
                                    className="account-item"
                                    key={item.education_id}
                                >
                                    <div className="item-icon">
                                        <GraduationCap size={20} />
                                    </div>
                                    <div className="item-content">
                                        <h3>
                                            {item.degree}
                                        </h3>
                                        <p>
                                            {item.field_of_study}
                                        </p>
                                        <span>
                                            {item.institution}
                                        </span>
                                        {/* <span>
                                            {item.start_year}
                                            {" - "}
                                            {item.end_year}
                                        </span> */}
                                    </div>

                                    <div className="item-actions">
                                        <button title="Edit education" className="icon-button edit-icon" onClick={() => { setSelectedEducation(item); setDeleteEducationItem(null); setShowEducationForm(true); }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button title="Delete education" className="icon-button delete-icon" onClick={() => { setDeleteEducationItem(item); setShowEducationForm(true); }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showEducationForm && (
                        <EducationForm
                            education={selectedEducation}
                            deleteEducation={deleteEducationItem}
                            onClose={() => {
                                setShowEducationForm(false);
                                setSelectedEducation(null);
                                setDeleteEducationItem(null);
                            }}
                            onSuccess={loadAccountData}
                        />
                    )}
                </section>

                {/* COURSES */}
                <section className="account-section">
                    <div className="section-header">
                        <div>
                            <h2>Courses & Certifications</h2>
                            <p>Courses and certifications you completed</p>
                        </div>
                        <div>
                            <button
                                className="add-button"
                                onClick={() => {
                                    setSelectedCourse(null);
                                    setDeleteCourse(null);
                                    setShowCourseForm(true);
                                }}
                            >
                                + Add Course
                            </button>
                            <button style={{ marginLeft: "5px" }}
                                className="add-button"
                                onClick={() => setShowCredlyModal(true)}
                            >
                                Import from Credly
                            </button>
                        </div>

                    </div>

                    {courses.length === 0 ? (
                        <div className="empty-section">
                            No courses added yet.
                        </div>
                    ) : (
                        <div className="account-list">
                            {courses.map((item) => (
                                <div
                                    className="account-item"
                                    key={item.course_id}
                                >
                                    <div className="item-icon">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="item-content">

                                        <h3>
                                            {item.course_name}
                                        </h3>

                                        <p>
                                            {item.provider}
                                        </p>



                                    </div>


                                    <div className="item-actions">
                                        <button
                                            title="Edit course"
                                            className="icon-button edit-icon"
                                            onClick={() => {
                                                setSelectedCourse(item);
                                                setDeleteCourse(null);
                                                setShowCourseForm(true);
                                            }}
                                        >
                                            <Pencil size={14} />
                                        </button>


                                        <button
                                            title="Delete course"
                                            className="icon-button delete-icon"
                                            onClick={() => {
                                                setDeleteCourse(item);
                                                setSelectedCourse(null);
                                                setShowCourseForm(true);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                </div>

                            ))}

                        </div>

                    )}
                    {showCourseForm && (

                        <CourseForm
                            course={selectedCourse}
                            deleteCourse={deleteCourse}

                            onClose={() => {
                                setShowCourseForm(false);
                                setSelectedCourse(null);
                                setDeleteCourse(null);
                            }}

                            onSuccess={loadAccountData}
                        />

                    )}
                    {showCredlyModal && (
                        <CredlyPopup
                            onClose={() =>
                                setShowCredlyModal(false)
                            }
                            onSaved={() => {
                                setShowCredlyModal(false);

                                loadAccountData();
                            }}
                        />
                    )}
                </section>

                {/* EXPERIENCE */}
                <section className="account-section">

                    <div className="section-header">

                        <div>
                            <h2>Experience</h2>
                            <p>Your internships and work experience</p>
                        </div>

                        <button className="add-button" onClick={() => { setSelectedExperience(null); setShowExperienceForm(true); }}>
                            + Add Experience
                        </button>

                    </div>

                    {experience.length === 0 ? (

                        <div className="empty-section">
                            No experience added yet.
                        </div>

                    ) : (

                        <div className="account-list">

                            {experience.map((item) => (

                                <div
                                    className="account-item"
                                    key={item.experience_id}
                                >
                                    <div className="item-icon">
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="item-content">

                                        <h3>
                                            {item.job_title}
                                        </h3>

                                        <p>
                                            {item.company_name}
                                        </p>

                                        <span>
                                            {item.experience_type}
                                        </span>
                                        {/* {" • "}
                                            {item.start_date}
                                            {" - "}
                                            {item.end_date || "Present"}
                                        </span> */}

                                    </div>


                                    <div className="item-actions">
                                        <button
                                            title="Edit experience"
                                            className="icon-button edit-icon"
                                            onClick={() => {
                                                setSelectedExperience(item);
                                                setDeleteExperience(null);
                                                setShowExperienceForm(true);
                                            }}
                                        >
                                            <Pencil size={14} />
                                        </button>

                                        <button
                                            title="Delete experience"
                                            className="icon-button delete-icon"
                                            onClick={() => {
                                                setDeleteExperience(item);
                                                setSelectedExperience(null);
                                                setShowExperienceForm(true);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}
                    {showExperienceForm && (
                        <ExperienceForm
                            experience={selectedExperience}
                            deleteExperience={deleteExperience}
                            onClose={() => {
                                setShowExperienceForm(false);
                                setSelectedExperience(null);
                                setDeleteExperience(null);
                            }}
                            onSuccess={loadAccountData}
                        />
                    )}
                </section>

                {/* PROJECTS */}
                <section className="account-section">
                    <div className="section-header">
                        <div>
                            <h2>Projects</h2>
                            <p>Projects you have worked on</p>
                        </div>
                        <div>
                            <button className="add-button" onClick={() => {
                                setSelectedProject(null);
                                setDeleteProject(null);
                                setGithubImport(false);
                                setShowProjectForm(true);
                            }}>
                                + Add Project
                            </button>

                            <button style={{ marginLeft: "5px" }}
                                className="add-button"
                                onClick={() => {
                                    setSelectedProject(null);
                                    setDeleteProject(null);
                                    setGithubImport(true);
                                    setShowProjectForm(true);
                                }}
                            >
                                Import from Github
                            </button></div>

                    </div>

                    {projects.length === 0 ? (

                        <div className="empty-section">
                            No projects added yet.
                        </div>

                    ) : (

                        <div className="account-list">

                            {projects.map((item) => (

                                <div
                                    className="account-item"
                                    key={item.project_id}
                                >
                                    <div className="item-icon">
                                        <FolderGit2 size={20} />
                                    </div>
                                    <div className="item-content">

                                        <h3>
                                            {item.project_name}
                                        </h3>

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

                                        {/* <span>
                                            {item.start_date?.slice(0, 10) || ""}
                                            {" - "}
                                            {item.end_date || "Present"}
                                        </span> */}

                                    </div>


                                    <div className="item-actions">
                                        <button
                                            title="Edit project"
                                            className="icon-button edit-icon"
                                            onClick={() => {
                                                setSelectedProject(item);
                                                setDeleteProject(null);
                                                setGithubImport(false);
                                                setShowProjectForm(true);
                                            }}
                                        >
                                            <Pencil size={14} />
                                        </button>


                                        <button
                                            title="Delete project"
                                            className="icon-button delete-icon"
                                            onClick={() => {
                                                setDeleteProject(item);
                                                setSelectedProject(null);
                                                setGithubImport(false);
                                                setShowProjectForm(true);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                </div>

                            ))}

                        </div>

                    )}
                    {showProjectForm && (

                        <ProjectForm
                            project={selectedProject}
                            deleteProject={deleteProject}
                            githubImport={githubImport}

                            onClose={() => {
                                setShowProjectForm(false);
                                setSelectedProject(null);
                                setDeleteProject(null);
                                setGithubImport(false);
                            }}

                            onSuccess={loadAccountData}
                        />

                    )}

                </section>

            </main>
        </div>
    );
}

export default Account;
