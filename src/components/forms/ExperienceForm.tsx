import { useEffect, useState } from "react";
import axios from "axios";
import type { Experience } from "../Account";
import "../../css/accountForm.css";
import {
    Trash2
} from "lucide-react";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

type ExperienceFormProps = {
    experience: Experience | null;
    deleteExperience: Experience | null;
    onClose: () => void;
    onSuccess: () => void;
};

function ExperienceForm({
    experience,
    deleteExperience,
    onClose,
    onSuccess
}: ExperienceFormProps) {

    const isEdit = !!experience;

    // -----------------------------
    // FORM STATE
    // -----------------------------

    const [form, setForm] = useState({
        experience_type: "Job",
        job_title: "",
        company_name: "",
        description: "",
        start_date: "",
        end_date: ""
    });

    // -----------------------------
    // SKILL STATE
    // -----------------------------

    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<number[]>([]);

    const [loading, setLoading] = useState(false);

    // -----------------------------
    // LOAD SKILLS
    // -----------------------------

    useEffect(() => {

        const loadSkills = async () => {

            try {

                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "/api/skills",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setSkills(response.data);

            } catch (error) {

                console.error(
                    "Failed to load skills",
                    error
                );

            }

        };

        loadSkills();

    }, []);

    // -----------------------------
    // PREFILL EDIT DATA
    // -----------------------------

    useEffect(() => {

        if (experience) {

            setForm({
                experience_type:
                    experience.experience_type || "Job",

                job_title:
                    experience.job_title || "",

                company_name:
                    experience.company_name || "",

                description:
                    experience.description || "",

                start_date:
                    experience.start_date
                        ? experience.start_date.substring(0, 10)
                        : "",

                end_date:
                    experience.end_date
                        ? experience.end_date.substring(0, 10)
                        : ""
            });

            // If GET experience API returns skill_ids
            setSelectedSkills(
                (experience.skill_ids || []).map((skill) => Number(skill))
            );

        } else {

            // Reset form for Add mode

            setForm({
                experience_type: "Job",
                job_title: "",
                company_name: "",
                description: "",
                start_date: "",
                end_date: ""
            });

            setSelectedSkills([]);

        }

    }, [experience]);

    // -----------------------------
    // INPUT CHANGE
    // -----------------------------

    const handleChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLTextAreaElement>
            | React.ChangeEvent<HTMLSelectElement>
    ) => {

        setForm({
            ...form,
            [event.target.name]: event.target.value
        });

    };

    // -----------------------------
    // SKILL SELECTION
    // -----------------------------

    const toggleSkill = (skillId: number) => {

        setSelectedSkills((previous) => {

            if (previous.includes(skillId)) {

                return previous.filter(
                    (id) => id !== skillId
                );

            }

            return [
                ...previous,
                skillId
            ];

        });

    };

    // -----------------------------
    // SUBMIT
    // -----------------------------

    const handleSubmit = async (
        event: React.FormEvent
    ) => {

        event.preventDefault();

        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const data = {
                experience_type:
                    form.experience_type,

                job_title:
                    form.job_title,

                company_name:
                    form.company_name,

                description:
                    form.description,

                start_date:
                    form.start_date || null,

                end_date:
                    form.end_date || null,

                skill_ids:
                    selectedSkills
            };

            if (isEdit) {

                // UPDATE

                await axios.put(
                    `/api/profile/experience/${experience.experience_id}`,
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            } else {

                // ADD

                await axios.post(
                    "/api/profile/experience",
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            }

            onSuccess();
            onClose();

        } catch (error) {

            console.error(
                "Experience save error:",
                error
            );

            alert(
                isEdit
                    ? "Failed to update experience"
                    : "Failed to add experience"
            );

        } finally {

            setLoading(false);

        }

    };

    // -----------------------------
    // DELETE
    // -----------------------------

    const handleDelete = async () => {

        if (!deleteExperience) {
            return;
        }

        try {

            setLoading(true);

            const token =
                localStorage.getItem("token");

            await axios.delete(
                `/api/profile/experience/${deleteExperience.experience_id}`,
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
                "DELETE EXPERIENCE ERROR:",
                error
            );

            alert(
                "Failed to delete experience"
            );

        } finally {

            setLoading(false);

        }

    };

    // -----------------------------
    // DELETE CONFIRMATION
    // -----------------------------

    if (deleteExperience) {

        return (

            <div className="form-overlay">

                <div className="delete-confirm-popup">

                    <div className="delete-icon-large">
                        <Trash2 size={24} />
                    </div>

                    <h2>
                        Delete Experience?
                    </h2>

                    <p>
                        Are you sure you want to
                        delete this experience?
                    </p>

                    <div className="delete-popup-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="confirm-delete-button"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading
                                ? "Deleting..."
                                : "Delete"}
                        </button>

                    </div>

                </div>

            </div>

        );
    }

    // -----------------------------
    // ADD / EDIT FORM
    // -----------------------------

    return (

        <div
            className="form-overlay"
            onClick={onClose}
        >

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
                            {isEdit
                                ? "Edit Experience"
                                : "Add Experience"}
                        </h2>

                        <p>
                            {isEdit
                                ? "Update your work experience"
                                : "Add your work experience"}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="close-form-button"
                    >
                        ×
                    </button>

                </div>


                {/* FORM */}

                <form
                    className="account-form"
                    onSubmit={handleSubmit}
                >

                    {/* EXPERIENCE TYPE */}

                    <div className="form-group">

                        <label>
                            Experience Type
                        </label>

                        <select
                            name="experience_type"
                            value={
                                form.experience_type
                            }
                            onChange={handleChange}
                            required
                        >

                            <option value="Job">
                                Job
                            </option>

                            <option value="Internship">
                                Internship
                            </option>

                        </select>

                    </div>


                    {/* JOB TITLE */}

                    <div className="form-group">

                        <label>
                            Job Title
                        </label>

                        <input
                            type="text"
                            name="job_title"
                            value={
                                form.job_title
                            }
                            onChange={handleChange}
                            placeholder="e.g. Frontend Developer Intern"
                            required
                        />

                    </div>


                    {/* COMPANY */}

                    <div className="form-group">

                        <label>
                            Company Name
                        </label>

                        <input
                            type="text"
                            name="company_name"
                            value={
                                form.company_name
                            }
                            onChange={handleChange}
                            placeholder="e.g. ABC Technologies"
                        />

                    </div>


                    {/* DESCRIPTION */}

                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={
                                form.description
                            }
                            onChange={handleChange}
                            placeholder="Describe your role and responsibilities..."
                            rows={4}
                        />

                    </div>


                    {/* DATES */}

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
                                onChange={handleChange}
                                required
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
                                onChange={handleChange}
                            />

                        </div>

                    </div>


                    {/* SKILLS */}

                    <div className="form-group">

                        <label>
                            Skills Gained
                        </label>

                        <p className="form-help">
                            Select the skills you gained
                            through this experience.
                        </p>

                        <div className="skill-selection">

                            {skills.map((skill) => (

                                <button
                                    type="button"
                                    key={
                                        skill.skill_id
                                    }
                                    className={`skill-option ${selectedSkills.includes(
                                        skill.skill_id
                                    )
                                        ? "selected"
                                        : ""
                                        }`}
                                    onClick={() =>
                                        toggleSkill(
                                            skill.skill_id
                                        )
                                    }
                                >
                                    {skill.skill_name}
                                </button>

                            ))}

                        </div>

                    </div>


                    {/* ACTIONS */}

                    <div className="form-actions">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="cancel-button"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="save-button"
                        >
                            {loading
                                ? "Saving..."
                                : isEdit
                                    ? "Update Experience"
                                    : "Save Experience"}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

export default ExperienceForm;
