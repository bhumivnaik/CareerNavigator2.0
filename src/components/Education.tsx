import {
    useEffect,
    useState,
    type ChangeEvent,
    type FormEvent
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/edu.css";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};


type EducationRecord = {
    education_id: number;
    degree: string;
    institution: string;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    skills: Skill[];
};


function Education() {

    const navigate = useNavigate();


    // ============================
    // STATES
    // ============================

    const [skills, setSkills] = useState<Skill[]>([]);

    const [selectedSkills, setSelectedSkills] =
        useState<Skill[]>([]);

    const [selectedSkillId, setSelectedSkillId] =
        useState("");


    const [educationList, setEducationList] =
        useState<EducationRecord[]>([]);


    const [form, setForm] = useState({
        degree: "",
        institution: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        description: ""
    });


    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);


    // ============================
    // LOAD DATA
    // ============================

    useEffect(() => {

        async function loadData() {

            try {

                const token =
                    localStorage.getItem("token");


                const headers = {
                    Authorization: `Bearer ${token}`
                };


                // Get all skills
                const skillsResponse =
                    await axios.get(
                        "/api/skills",
                        { headers }
                    );


                setSkills(skillsResponse.data);


                // Get user's education
                const educationResponse =
                    await axios.get(
                        "/api/education",
                        { headers }
                    );


                setEducationList(
                    educationResponse.data
                );


            } catch (error) {

                console.error(error);

                alert(
                    "Failed to load education data"
                );

            } finally {

                setLoading(false);

            }

        }


        loadData();

    }, []);


    // ============================
    // INPUT CHANGE
    // ============================

    function handleInput(
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) {

        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));

    }


    // ============================
    // SKILL SELECT
    // ============================

    function handleSkillSelect(
        e: ChangeEvent<HTMLSelectElement>
    ) {

        const skillId =
            Number(e.target.value);


        if (!skillId) {
            return;
        }


        const skill =
            skills.find(
                (item) =>
                    item.skill_id === skillId
            );


        if (!skill) {
            return;
        }


        const alreadySelected =
            selectedSkills.some(
                (item) =>
                    item.skill_id === skillId
            );


        if (!alreadySelected) {

            setSelectedSkills(
                (prev) => [
                    ...prev,
                    skill
                ]
            );

        }


        setSelectedSkillId("");

    }


    // ============================
    // REMOVE SKILL
    // ============================

    function removeSkill(skillId: number) {

        setSelectedSkills(
            (prev) =>
                prev.filter(
                    (skill) =>
                        skill.skill_id !== skillId
                )
        );

    }


    // ============================
    // ADD EDUCATION
    // ============================

    async function handleSubmit(
        e: FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();


        if (
            !form.degree ||
            !form.institution
        ) {

            alert(
                "Please enter degree and institution"
            );

            return;
        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem("token");


            const skillIds =
                selectedSkills.map(
                    (skill) =>
                        skill.skill_id
                );


            const response =
                await axios.post(
                    "/api/education",

                    {
                        degree:
                            form.degree,

                        institution:
                            form.institution,

                        field_of_study:
                            form.field_of_study,

                        start_date:
                            form.start_date,

                        end_date:
                            form.end_date,

                        description:
                            form.description,

                        skill_ids:
                            skillIds
                    },

                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            alert(response.data.message);


            // Reload education
            const educationResponse =
                await axios.get(
                    "/api/education",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            setEducationList(
                educationResponse.data
            );


            // Reset form

            setForm({
                degree: "",
                institution: "",
                field_of_study: "",
                start_date: "",
                end_date: "",
                description: ""
            });


            setSelectedSkills([]);

            setSelectedSkillId("");


        } catch (error: any) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Failed to save education"
            );

        } finally {

            setSaving(false);

        }

    }


    // ============================
    // DELETE EDUCATION
    // ============================

    async function handleDelete(
        educationId: number
    ) {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this education?"
            );


        if (!confirmDelete) {
            return;
        }


        try {

            const token =
                localStorage.getItem("token");


            await axios.delete(
                `/api/education/${educationId}`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            setEducationList(
                (prev) =>
                    prev.filter(
                        (education) =>
                            education.education_id !==
                            educationId
                    )
            );


        } catch (error: any) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Failed to delete education"
            );

        }

    }


    // ============================
    // LOADING
    // ============================

    if (loading) {

        return (
            <div className="education-page">

                <div className="education-card">

                    <p>
                        Loading education...
                    </p>

                </div>

            </div>
        );

    }


    // ============================
    // UI
    // ============================

    return (

        <div className="education-page">

            <div className="education-card">


                {/* HEADER */}

                <div className="education-header">

                    <h1>
                        Your Education
                    </h1>

                    <p>
                        Add your educational background
                        and the skills you gained from it.
                    </p>

                </div>


                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="education-form"
                >


                    {/* DEGREE */}

                    <div className="form-group">

                        <label htmlFor="degree">
                            Degree / Qualification
                        </label>

                        <input
                            type="text"
                            id="degree"
                            name="degree"
                            value={form.degree}
                            onChange={handleInput}
                            placeholder="e.g. Bachelor of Engineering"
                            required
                        />

                    </div>


                    {/* INSTITUTION */}

                    <div className="form-group">

                        <label htmlFor="institution">
                            Institution
                        </label>

                        <input
                            type="text"
                            id="institution"
                            name="institution"
                            value={form.institution}
                            onChange={handleInput}
                            placeholder="e.g. XYZ University"
                            required
                        />

                    </div>


                    {/* FIELD */}

                    <div className="form-group">

                        <label htmlFor="field_of_study">
                            Field of Study
                            <span>
                                {" "} (Optional)
                            </span>
                        </label>

                        <input
                            type="text"
                            id="field_of_study"
                            name="field_of_study"
                            value={
                                form.field_of_study
                            }
                            onChange={handleInput}
                            placeholder="e.g. Computer Engineering"
                        />

                    </div>


                    {/* DATES */}

                    <div className="date-row">

                        <div className="form-group">

                            <label htmlFor="start_date">
                                Start Date
                            </label>

                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={
                                    form.start_date
                                }
                                onChange={
                                    handleInput
                                }
                            />

                        </div>


                        <div className="form-group">

                            <label htmlFor="end_date">
                                End Date
                            </label>

                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={
                                    form.end_date
                                }
                                onChange={
                                    handleInput
                                }
                            />

                        </div>

                    </div>


                    {/* DESCRIPTION */}

                    <div className="form-group">

                        <label htmlFor="description">
                            Description
                            <span>
                                {" "} (Optional)
                            </span>
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={
                                form.description
                            }
                            onChange={
                                handleInput
                            }
                            placeholder="Add relevant details about your education..."
                            rows={4}
                        />

                    </div>


                    {/* SKILLS */}

                    <div className="education-skills">

                        <label htmlFor="education-skill">

                            Skills gained from this
                            education

                        </label>


                        <select
                            id="education-skill"
                            value={
                                selectedSkillId
                            }
                            onChange={
                                handleSkillSelect
                            }
                        >

                            <option value="">
                                Select a skill
                            </option>


                            {skills.map(
                                (skill) => (

                                    <option
                                        key={
                                            skill.skill_id
                                        }
                                        value={
                                            skill.skill_id
                                        }
                                    >
                                        {
                                            skill.skill_name
                                        }
                                    </option>

                                )
                            )}

                        </select>


                        <div className="education-selected-skills">

                            {selectedSkills.map(
                                (skill) => (

                                    <div
                                        className="education-skill-tag"
                                        key={
                                            skill.skill_id
                                        }
                                    >

                                        <span>
                                            {
                                                skill.skill_name
                                            }
                                        </span>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeSkill(
                                                    skill.skill_id
                                                )
                                            }
                                        >
                                            ×
                                        </button>

                                    </div>

                                )
                            )}

                        </div>

                    </div>


                    {/* ADD BUTTON */}

                    <button
                        type="submit"
                        className="add-education-button"
                        disabled={saving}
                    >

                        {saving
                            ? "Saving..."
                            : "+ Add Education"
                        }

                    </button>

                </form>


                {/* SAVED EDUCATION */}

                {educationList.length > 0 && (

                    <div className="saved-education">

                        <h2>
                            Added Education
                        </h2>


                        {educationList.map(
                            (education) => (

                                <div
                                    className="education-item"
                                    key={
                                        education.education_id
                                    }
                                >

                                    <div className="education-item-header">

                                        <div>

                                            <h3>
                                                {
                                                    education.degree
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    education.institution
                                                }
                                            </p>

                                        </div>


                                        <button
                                            type="button"
                                            className="delete-education"
                                            onClick={() =>
                                                handleDelete(
                                                    education.education_id
                                                )
                                            }
                                        >
                                            Delete
                                        </button>

                                    </div>


                                    {education.field_of_study && (

                                        <p className="education-field">

                                            {
                                                education.field_of_study
                                            }

                                        </p>

                                    )}


                                    {(education.start_date ||
                                        education.end_date) && (

                                            <p className="education-date">

                                                {
                                                    education.start_date
                                                }

                                                {" — "}

                                                {
                                                    education.end_date ||
                                                    "Present"
                                                }

                                            </p>

                                        )}


                                    {education.description && (

                                        <p className="education-description">

                                            {
                                                education.description
                                            }

                                        </p>

                                    )}


                                    {education.skills &&
                                        education.skills.length > 0 && (

                                            <div className="saved-skills">

                                                {education.skills.map(
                                                    (skill) => (

                                                        <span
                                                            className="saved-skill-tag"
                                                            key={
                                                                skill.skill_id
                                                            }
                                                        >
                                                            {
                                                                skill.skill_name
                                                            }
                                                        </span>

                                                    )
                                                )}

                                            </div>

                                        )}

                                </div>

                            )
                        )}

                    </div>

                )}


                {/* NAVIGATION */}

                <div className="education-navigation">

                    <button
                        type="button"
                        className="education-back"
                        onClick={() =>
                            navigate(
                                "/skills-setup"
                            )
                        }
                    >
                        ← Back
                    </button>


                    <button
                        type="button"
                        className="education-continue"
                        onClick={() =>
                            navigate("/projects")
                        }
                    >
                        Continue →
                    </button>

                </div>


            </div>

        </div>

    );

}


export default Education;
