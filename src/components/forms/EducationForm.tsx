import { useEffect, useState } from "react";
import axios from "axios";
import type { Education } from "../Account";
import "../../css/accountForm.css"
import {
    Trash2
} from "lucide-react";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

type EducationFormProps = {
    education: Education | null;
    deleteEducation: Education | null;
    onClose: () => void;
    onSuccess: () => void;
};

function EducationForm({
    education, deleteEducation,
    onClose,
    onSuccess
}: EducationFormProps) {

    const isEdit = !!education;

    // -----------------------------
    // FORM STATE
    // -----------------------------

    const [form, setForm] = useState({
        degree: "",
        field_of_study: "",
        institution: "",
        start_year: "",
        end_year: ""
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

                console.error("Failed to load skills", error);

            }

        };

        loadSkills();

    }, []);

    // -----------------------------
    // PREFILL EDIT DATA
    // -----------------------------

    useEffect(() => {

        if (education) {

            setForm({
                degree: education.degree || "",
                field_of_study: education.field_of_study || "",
                institution: education.institution || "",
                start_year: education.start_year?.toString() || "",
                end_year: education.end_year?.toString() || ""
            });

            // If your GET education API returns skill_ids
            setSelectedSkills(education.skill_ids || []);

        } else {

            // Reset form for Add mode

            setForm({
                degree: "",
                field_of_study: "",
                institution: "",
                start_year: "",
                end_year: ""
            });

            setSelectedSkills([]);

        }

    }, [education]);

    // -----------------------------
    // INPUT CHANGE
    // -----------------------------

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>
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

            return [...previous, skillId];

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
                degree: form.degree,
                field_of_study: form.field_of_study,
                institution: form.institution,
                start_year: form.start_year,
                end_year: form.end_year,
                skill_ids: selectedSkills
            };

            if (isEdit) {

                // UPDATE

                await axios.put(
                    `/api/profile/education/${education.education_id}`,
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

            } else {

                // ADD

                await axios.post(
                    "/api/profile/education",
                    data,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

            }

            onSuccess();
            onClose();

        } catch (error) {

            console.error("Education save error:", error);

            alert(
                isEdit
                    ? "Failed to update education"
                    : "Failed to add education"
            );

        } finally {

            setLoading(false);

        }

    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `/api/profile/education/${deleteEducation.education_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            onClose();
            onSuccess();

        } catch (error) {
            console.error("DELETE EDUCATION ERROR:", error);
            alert("Failed to delete education");
        }
    };

    // -----------------------------
    // UI
    // -----------------------------
    if (deleteEducation) {
        return (
            <div className="form-overlay">
                <div className="delete-confirm-popup">

                    <div className="delete-icon-large">
                        <Trash2 size={24} />
                    </div>

                    <h2>Delete Education?</h2>

                    <p>
                        Are you sure you want to delete?
                    </p>

                    <div className="delete-popup-actions">
                        <button
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            className="confirm-delete-button"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>

                </div>
            </div>
        );
    }



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
                                ? "Edit Education"
                                : "Add Education"}
                        </h2>

                        <p>
                            {isEdit
                                ? "Update your education details"
                                : "Add your educational background"}
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

                    {/* DEGREE */}

                    <div className="form-group">

                        <label>
                            Degree
                        </label>

                        <input
                            type="text"
                            name="degree"
                            value={form.degree}
                            onChange={handleChange}
                            placeholder="e.g. B.E. Computer Engineering"
                            required
                        />

                    </div>


                    {/* FIELD OF STUDY */}

                    <div className="form-group">

                        <label>
                            Field of Study
                        </label>

                        <input
                            type="text"
                            name="field_of_study"
                            value={form.field_of_study}
                            onChange={handleChange}
                            placeholder="e.g. Information Technology"
                            required
                        />

                    </div>


                    {/* INSTITUTION */}

                    <div className="form-group">

                        <label>
                            Institution
                        </label>

                        <input
                            type="text"
                            name="institution"
                            value={form.institution}
                            onChange={handleChange}
                            placeholder="e.g. ABC College of Engineering"
                            required
                        />

                    </div>


                    {/* YEARS */}

                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                Start Year
                            </label>

                            <input
                                type="number"
                                name="start_year"
                                value={form.start_year}
                                onChange={handleChange}
                                placeholder="2024"
                                min="1900"
                                max="2100"
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                End Year
                            </label>

                            <input
                                type="number"
                                name="end_year"
                                value={form.end_year}
                                onChange={handleChange}
                                placeholder="2028"
                                min="1900"
                                max="2100"
                            />

                        </div>

                    </div>


                    {/* SKILLS */}

                    <div className="form-group">

                        <label>
                            Skills Gained
                        </label>

                        <p className="form-help">
                            Select the skills you gained through this education.
                        </p>

                        <div className="skill-selection">

                            {skills.map((skill) => (

                                <button
                                    type="button"
                                    key={skill.skill_id}
                                    className={`skill-option ${selectedSkills.includes(
                                        skill.skill_id
                                    )
                                        ? "selected"
                                        : ""
                                        }`}
                                    onClick={() =>
                                        toggleSkill(skill.skill_id)
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
                                    ? "Update Education"
                                    : "Save Education"}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );
}

export default EducationForm;
