import { useEffect, useState } from "react";
import axios from "axios";
import {
    X,
    Trash2,
    LucideFolderGit
} from "lucide-react";
import type { Project } from "../Account";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

// type Project = {
//     project_id: number;
//     project_name: string;
//     description: string;
//     technologies_used: string;
//     start_date: string;
//     end_date: string;
//     github_repo_url?: string;
//     project_source?: "Manual" | "GitHub";
//     skills?: number[];
// };

type GithubRepository = {
    name: string;
    description: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    languages: string[];
    technologies: string[];
};

type ProjectFormProps = {
    project: Project | null;
    deleteProject: Project | null;
    githubImport?: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

function ProjectForm({
    project,
    deleteProject,
    githubImport = false,
    onClose,
    onSuccess
}: ProjectFormProps) {

    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkills, setSelectedSkills] =
        useState<number[]>([]);

    const [form, setForm] = useState({
        project_name: "",
        description: "",
        technologies_used: "",
        start_date: "",
        end_date: ""
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [
        githubRepositories,
        setGithubRepositories
    ] = useState<GithubRepository[]>([]);

    const [
        loadingGithub,
        setLoadingGithub
    ] = useState(false);

    const [
        selectedGithubProject,
        setSelectedGithubProject
    ] = useState<GithubRepository | null>(null);


    // Load skills
    useEffect(() => {

        const loadSkills = async () => {

            try {

                const token =
                    localStorage.getItem("token");

                const response = await axios.get(
                    "/api/skills",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setSkills(response.data);

            } catch (error) {

                console.error(
                    "LOAD SKILLS ERROR:",
                    error
                );

            }

        };

        loadSkills();

    }, []);


    // Load project data for edit
    useEffect(() => {

        if (project) {

            setForm({
                project_name:
                    project.project_name || "",

                description:
                    project.description || "",

                technologies_used:
                    project.technologies_used || "",

                start_date:
                    project.start_date
                        ? project.start_date.substring(0, 10)
                        : "",

                end_date:
                    project.end_date
                        ? project.end_date.substring(0, 10)
                        : ""
            });

            setSelectedSkills(
                (project.skill_ids || []).map(
                    (skill) => Number(skill)
                )
            );

        } else {

            setForm({
                project_name: "",
                description: "",
                technologies_used: "",
                start_date: "",
                end_date: ""
            });

            setSelectedSkills([]);

        }

    }, [project]);


    // Load GitHub repositories
    useEffect(() => {

        if (!githubImport) {
            return;
        }

        const loadGithubRepositories =
            async () => {

                try {

                    setLoadingGithub(true);

                    const token =
                        localStorage.getItem("token");

                    const response =
                        await axios.get(
                            "/api/github/repositories",
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    setGithubRepositories(
                        response.data
                    );

                } catch (error) {

                    console.error(
                        "LOAD GITHUB PROJECTS ERROR:",
                        error
                    );

                    alert(
                        "Failed to load GitHub repositories"
                    );

                } finally {

                    setLoadingGithub(false);

                }

            };

        loadGithubRepositories();

    }, [githubImport]);


    // Input change
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {

        setForm({
            ...form,
            [e.target.name]:
                e.target.value
        });

    };


    // Toggle skill
    const toggleSkill = (
        skillId: number
    ) => {

        if (
            selectedSkills.includes(skillId)
        ) {

            setSelectedSkills(
                selectedSkills.filter(
                    (id) =>
                        id !== skillId
                )
            );

        } else {

            setSelectedSkills([
                ...selectedSkills,
                skillId
            ]);

        }

    };


    // Save manual project
    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!form.project_name.trim()) {
            return;
        }

        try {

            setSaving(true);

            const token =
                localStorage.getItem("token");

            const headers = {
                Authorization:
                    `Bearer ${token}`
            };

            const data = {
                project_name:
                    form.project_name,

                description:
                    form.description,

                technologies_used:
                    form.technologies_used,

                start_date:
                    form.start_date || null,

                end_date:
                    form.end_date || null,

                skill_ids:
                    selectedSkills
            };


            if (project) {

                await axios.put(
                    `/api/profile/project/${project.project_id}`,
                    data,
                    { headers }
                );

            } else {

                await axios.post(
                    "/api/profile/project",
                    data,
                    { headers }
                );

            }

            onClose();
            onSuccess();

        } catch (error) {

            console.error(
                "SAVE PROJECT ERROR:",
                error
            );

            alert(
                project
                    ? "Failed to update project"
                    : "Failed to add project"
            );

        } finally {

            setSaving(false);

        }

    };


    // Import selected GitHub project
    const handleGithubImport =
        async () => {

            if (!selectedGithubProject) {
                return;
            }

            try {

                setSaving(true);

                const token =
                    localStorage.getItem("token");

                await axios.post(
                    "/api/profile/project/github",
                    selectedGithubProject,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                onClose();
                onSuccess();

            } catch (error: any) {

                console.error(
                    "IMPORT GITHUB PROJECT ERROR:",
                    error
                );

                if (
                    error.response?.status === 409
                ) {

                    alert(
                        "This GitHub project is already imported."
                    );

                } else {

                    alert(
                        "Failed to import GitHub project."
                    );

                }

            } finally {

                setSaving(false);

            }

        };


    // Delete project
    const handleDelete = async () => {

        if (!deleteProject) {
            return;
        }

        try {

            setDeleting(true);

            const token =
                localStorage.getItem("token");

            await axios.delete(
                `/api/profile/project/${deleteProject.project_id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            onClose();
            onSuccess();

        } catch (error) {

            console.error(
                "DELETE PROJECT ERROR:",
                error
            );

            alert(
                "Failed to delete project"
            );

        } finally {

            setDeleting(false);

        }

    };


    // Delete confirmation
    if (deleteProject) {

        return (
            <div className="form-overlay">

                <div className="delete-confirm-popup">

                    <div className="delete-icon-large">
                        <Trash2 size={24} />
                    </div>

                    <h2>
                        Delete Project?
                    </h2>

                    <p>
                        Are you sure you want to
                        delete this project?
                    </p>

                    <div className="delete-popup-actions">

                        <button
                            className="cancel-button"
                            onClick={onClose}
                            disabled={deleting}
                        >
                            Cancel
                        </button>

                        <button
                            className="confirm-delete-button"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete"}
                        </button>

                    </div>

                </div>

            </div>
        );

    }


    // GitHub import popup
    if (githubImport) {

        return (
            <div className="form-overlay">

                <div
                    className="form-modal"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

                    {/* HEADER */}

                    <div className="form-modal-header">

                        <div>

                            <h2>
                                Import from GitHub
                            </h2>

                            <p>
                                Select a repository
                                to add to your projects
                            </p>

                        </div>

                        <button
                            className="close-form-button"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>

                    </div>


                    {loadingGithub ? (

                        <div className="empty-section">
                            Loading GitHub repositories...
                        </div>

                    ) : githubRepositories.length === 0 ? (

                        <div className="empty-section">
                            No public repositories found.
                        </div>

                    ) : (

                        <div className="github-project-list">

                            {githubRepositories.map(
                                (repo) => {

                                    const technologies = [
                                        ...(repo.languages || []),
                                        ...(repo.technologies || [])
                                    ].filter(
                                        (
                                            item,
                                            index,
                                            array
                                        ) =>
                                            array.indexOf(
                                                item
                                            ) === index
                                    );

                                    const isSelected =
                                        selectedGithubProject
                                            ?.html_url ===
                                        repo.html_url;

                                    return (
                                        <div
                                            key={
                                                repo.html_url
                                            }
                                            className={
                                                isSelected
                                                    ? "github-project-card selected"
                                                    : "github-project-card"
                                            }
                                            onClick={() =>
                                                setSelectedGithubProject(
                                                    repo
                                                )
                                            }
                                        >

                                            <div className="github-project-info">

                                                <div className="github-project-title">

                                                    <LucideFolderGit
                                                        size={18}
                                                    />

                                                    <h3>
                                                        {
                                                            repo.name
                                                        }
                                                    </h3>

                                                </div>

                                                <p>
                                                    {
                                                        repo.description ||
                                                        "No description available."
                                                    }
                                                </p>

                                                <div className="github-project-tags">

                                                    {technologies
                                                        .slice(
                                                            0,
                                                            8
                                                        )
                                                        .map(
                                                            (
                                                                tech
                                                            ) => (
                                                                <span
                                                                    className="github-tag"
                                                                    key={
                                                                        tech
                                                                    }
                                                                >
                                                                    {
                                                                        tech
                                                                    }
                                                                </span>
                                                            )
                                                        )}

                                                </div>

                                            </div>

                                        </div>
                                    );

                                }
                            )}

                        </div>

                    )}


                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="save-button"
                            onClick={
                                handleGithubImport
                            }
                            disabled={
                                !selectedGithubProject ||
                                saving
                            }
                        >
                            {saving
                                ? "Importing..."
                                : "Import Project"}
                        </button>

                    </div>

                </div>

            </div>
        );

    }


    // Normal Add / Edit form
    return (
        <div className="form-overlay">

            <div
                className="form-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                {/* HEADER */}

                <div className="form-modal-header">

                    <div>

                        <h2>
                            {project
                                ? "Edit Project"
                                : "Add Project"}
                        </h2>

                        <p>
                            {project
                                ? "Update your project details"
                                : "Add a project to your profile"}
                        </p>

                    </div>

                    <button
                        className="close-form-button"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>

                </div>


                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label>
                            Project Name
                        </label>

                        <input
                            type="text"
                            name="project_name"
                            value={
                                form.project_name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter project name"
                            required
                        />

                    </div>

                    {project?.project_source === "GitHub" &&
                        project?.github_repo_url && (

                            <div className="form-group">

                                <label>
                                    GitHub Repository
                                </label>

                                <input
                                    type="text"
                                    value={project.github_repo_url}
                                    disabled
                                    className="disabled-input"
                                />

                            </div>

                        )}
                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={
                                form.description
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Describe your project"
                            rows={4}
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Technologies Used
                        </label>

                        <input
                            type="text"
                            name="technologies_used"
                            value={
                                form.technologies_used
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="e.g. ReactJS, NodeJS, MySQL"
                        />

                    </div>


                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                Start Date
                            </label>

                            <input
                                type="date"
                                name="start_date"
                                value={
                                    form.start_date
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                End Date
                            </label>

                            <input
                                type="date"
                                name="end_date"
                                value={
                                    form.end_date
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                    </div>


                    <div className="form-group">

                        <label>
                            Skills Used
                        </label>

                        <div className="skill-selection">

                            {skills.map(
                                (skill) => (

                                    <button
                                        type="button"
                                        key={
                                            skill.skill_id
                                        }
                                        className={
                                            selectedSkills.includes(
                                                skill.skill_id
                                            )
                                                ? "skill-option selected"
                                                : "skill-option"
                                        }
                                        onClick={() =>
                                            toggleSkill(
                                                skill.skill_id
                                            )
                                        }
                                    >
                                        {
                                            skill.skill_name
                                        }
                                    </button>

                                )
                            )}

                        </div>

                    </div>


                    {/* {selectedSkills.length > 0 && (

                        <div className="selected-skills">

                            <label>
                                Selected Skills
                            </label>

                            <div className="selected-skill-tags">

                                {selectedSkills.map(
                                    (skillId) => {

                                        const skill =
                                            skills.find(
                                                (item) =>
                                                    item.skill_id ===
                                                    skillId
                                            );

                                        if (!skill) {
                                            return null;
                                        }

                                        return (
                                            <span
                                                className="skill-tag"
                                                key={
                                                    skillId
                                                }
                                            >

                                                {
                                                    skill.skill_name
                                                }

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleSkill(
                                                            skillId
                                                        )
                                                    }
                                                >
                                                    <X
                                                        size={12}
                                                    />
                                                </button>

                                            </span>
                                        );

                                    }
                                )}

                            </div>

                        </div>

                    )} */}



                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="save-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : project
                                    ? "Update Project"
                                    : "Save Project"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default ProjectForm;
