import { useEffect, useState } from "react";
import axios from "axios";
import { X, Trash2 } from "lucide-react";
import type { Course } from "../Account";

type Skill = {
    skill_id: number;
    skill_name: string;
    category: string;
};

// type Course = {
//     course_id: number;
//     course_name: string;
//     provider: string;
//     description: string;
//     completion_date: string;
//     certificate_url?: string;
//     skills?: number[];

// };

type CourseFormProps = {
    course: Course | null;
    deleteCourse: Course | null;
    onClose: () => void;
    onSuccess: () => void;
};

function CourseForm({
    course,
    deleteCourse,
    onClose,
    onSuccess
}: CourseFormProps) {

    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<number[]>([]);

    const [form, setForm] = useState({
        course_name: "",
        provider: "",
        description: "",
        completion_date: "",
        certificate_url: ""
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Fetch all skills
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
                    "LOAD SKILLS ERROR:",
                    error
                );

            }

        };

        loadSkills();

    }, []);


    // Fill form when editing
    useEffect(() => {

        if (course) {

            setForm({
                course_name: course.course_name || "",
                provider: course.provider || "",
                description: course.description || "",
                completion_date: course.completion_date
                    ? course.completion_date.substring(0, 10)
                    : "",
                certificate_url: course.certificate_url || ""
            });

            setSelectedSkills(
                (course.skill_ids || []).map(
                    (skill) => Number(skill)
                )
            );

        } else {

            setForm({
                course_name: "",
                provider: "",
                description: "",
                completion_date: "",
                certificate_url: ""
            });

            setSelectedSkills([]);

        }

    }, [course]);


    // Handle input changes
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };


    // Select / remove skill
    const toggleSkill = (skillId: number) => {

        if (selectedSkills.includes(skillId)) {

            setSelectedSkills(
                selectedSkills.filter(
                    (id) => id !== skillId
                )
            );

        } else {

            setSelectedSkills([
                ...selectedSkills,
                skillId
            ]);

        }

    };


    // Save / Update course
    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!form.course_name.trim()) {
            return;
        }

        try {

            setSaving(true);

            const token = localStorage.getItem("token");

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const data = {
                course_name: form.course_name,
                provider: form.provider,
                description: form.description,
                completion_date:
                    form.completion_date || null,
                certificate_url:
                    form.certificate_url || null,
                skill_ids: selectedSkills
            };


            if (course) {

                await axios.put(
                    `/api/profile/course/${course.course_id}`,
                    data,
                    { headers }
                );

            } else {

                await axios.post(
                    "/api/profile/course",
                    data,
                    { headers }
                );

            }


            onClose();
            onSuccess();

        } catch (error) {

            console.error(
                "SAVE COURSE ERROR:",
                error
            );

            alert(
                course
                    ? "Failed to update course"
                    : "Failed to add course"
            );

        } finally {

            setSaving(false);

        }

    };


    // Delete course
    const handleDelete = async () => {

        if (!deleteCourse) {
            return;
        }

        try {

            setDeleting(true);

            const token = localStorage.getItem("token");

            await axios.delete(
                `/api/profile/course/${deleteCourse.course_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            onClose();
            onSuccess();

        } catch (error) {

            console.error(
                "DELETE COURSE ERROR:",
                error
            );

            alert("Failed to delete course");

        } finally {

            setDeleting(false);

        }

    };


    // Delete confirmation popup
    if (deleteCourse) {

        return (
            <div className="form-overlay">

                <div className="delete-confirm-popup">

                    <div className="delete-icon-large">
                        <Trash2 size={24} />
                    </div>

                    <h2>
                        Delete Course?
                    </h2>

                    <p>
                        Are you sure you want to delete
                        this course?
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
                            {course
                                ? "Edit Course"
                                : "Add Course"}
                        </h2>

                        <p>
                            {course
                                ? "Update your course details"
                                : "Add a course or certification to your profile"}
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

                    {/* Course Name */}
                    <div className="form-group">

                        <label>
                            Course Name
                        </label>

                        <input
                            type="text"
                            name="course_name"
                            value={form.course_name}
                            onChange={handleChange}
                            placeholder="Enter course name"
                            required
                        />

                    </div>


                    {/* Provider */}
                    <div className="form-group">

                        <label>
                            Provider
                        </label>

                        <input
                            type="text"
                            name="provider"
                            value={form.provider}
                            onChange={handleChange}
                            placeholder="e.g. Coursera, Udemy, Google"
                        />

                    </div>


                    {/* Description */}
                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe what you learned"
                            rows={4}
                        />

                    </div>


                    {/* Completion Date */}
                    <div className="form-group">

                        <label>
                            Completion Date
                        </label>

                        <input
                            type="date"
                            name="completion_date"
                            value={form.completion_date}
                            onChange={handleChange}
                        />

                    </div>


                    {/* Certificate URL */}
                    <div className="form-group">

                        <label>
                            Certificate URL
                        </label>

                        <input
                            type="url"
                            name="certificate_url"
                            value={form.certificate_url}
                            onChange={handleChange}
                            placeholder="https://..."
                        />

                    </div>


                    {/* Skills */}
                    <div className="form-group">

                        <label>
                            Skills Learned
                        </label>

                        <div className="skill-selection">

                            {skills.map((skill) => (

                                <button
                                    type="button"
                                    key={skill.skill_id}
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
                                    {skill.skill_name}
                                </button>

                            ))}

                        </div>

                    </div>


                    {/* Selected Skills */}
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
                                                key={skillId}
                                            >

                                                {skill.skill_name}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleSkill(
                                                            skillId
                                                        )
                                                    }
                                                >
                                                    <X size={12} />
                                                </button>

                                            </span>
                                        );

                                    }
                                )}

                            </div>

                        </div>

                    )} */}


                    {/* Form buttons */}
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
                                : course
                                    ? "Update Course"
                                    : "Save Course"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default CourseForm;
