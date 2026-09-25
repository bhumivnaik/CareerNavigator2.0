import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authContext";
import "../css/profile.css"

function Profile() {
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [form, setForm] = useState({
        fullname: user?.full_name || "",
        githubUrl: user?.github_profile_url || "",
        linkedinUrl: user?.linkedin_profile_url || "",
        about: user?.about || "",
    });

    useEffect(() => {
        if (user) {
            setForm({
                fullname: user.full_name,
                githubUrl: user.github_profile_url || "",
                linkedinUrl: user.linkedin_profile_url || "",
                about: user?.about || "",
            });
        }
    }, [user]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            await axios.put("/api/profile",
                {
                    full_name: form.fullname,
                    github_profile_url: form.githubUrl,
                    linkedin_profile_url: form.linkedinUrl,
                    about: form.about
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Updating user in AuthContext
            login({
                ...user!,
                full_name: form.fullname,
                github_profile_url: form.githubUrl,
                linkedin_profile_url: form.linkedinUrl,
                about: form.about,
            });

            navigate("/skills-setup");

        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                "Failed to update profile"
            );
        }
    }

    function handleUserInput(e: ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <>
            <div className="profile-setup">
                <div className="profile-header">
                    <h1>Build Your Career Profile</h1>
                    <p>Tell us about yourself and the skills you already have.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="fullname">Full Name</label>
                    <input
                        type="text" id="fullname" name="fullname"
                        value={form.fullname}
                        onChange={handleUserInput}
                        autoComplete="off"
                        required
                    />

                    <label htmlFor="email">Email</label>
                    <input
                        type="email" id="email" name="email"
                        value={user?.email}
                        disabled
                    />

                    <label htmlFor="githubUrl">GitHub Profile URL<span> (Optional)</span></label>
                    <input
                        type="text" id="githubUrl" name="githubUrl"
                        value={form.githubUrl}
                        onChange={handleUserInput}
                        autoComplete="off" placeholder="GitHub Profile URL"
                    />

                    <label htmlFor="about">About You</label>
                    <input
                        type="text" id="about" name="about"
                        value={form.about}
                        onChange={handleUserInput}
                        autoComplete="off" placeholder="Tell us about yourself..."
                        required
                    />

                    <label htmlFor="linkedinUrl">LinkedIn Profile URL<span> (Optional)</span></label>
                    <input
                        type="text" id="linkedinUrl" name="linkedinUrl"
                        value={form.linkedinUrl}
                        onChange={handleUserInput}
                        autoComplete="off" placeholder="LinkedIn Profile URL"
                    />

                    <button type="submit">Continue</button>
                </form>
            </div>
        </>
    )
}

export default Profile

