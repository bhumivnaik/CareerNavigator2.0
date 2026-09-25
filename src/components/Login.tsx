import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "../context/authContext";
import "../css/auth.css"
import { Eye, EyeOff } from "lucide-react";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const response = await axios.post(
                "/api/auth/login",
                {
                    email: form.email,
                    password: form.password
                }
            );

            localStorage.setItem("token", response.data.token);
            const userResponse = await axios.get(
                "/api/auth/me",
                {
                    headers: {
                        Authorization: `Bearer ${response.data.token}`
                    }
                }
            );
            login(userResponse.data);

            alert(response.data.message);
            if (userResponse.data.profile_completed) {
                navigate("/dashboard");
            } else {
                navigate("/profile");
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Login Failed");
        }
    }

    function handleUserInput(e: ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <>
            <div className="container">
                <div className="login">
                    <form onSubmit={handleSubmit}>
                        <h1>Sign In</h1>
                        <input
                            type="email" id="email" name="email"
                            value={form.email}
                            onChange={handleUserInput}
                            autoComplete="off" placeholder="Email"
                            required
                        />

                        <div className="password-box">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password" name="password"
                                value={form.password} onChange={handleUserInput}
                                autoComplete="off"
                                placeholder="Password"
                                required
                            />
                            <button type="button" className="eye-button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (<EyeOff size={20} />) : (<Eye size={20} />)}
                            </button>
                        </div>

                        <button type="submit" className="button">Login</button>
                        <p>Don't have an account? <Link to="/register"> Register</Link></p>
                    </form>
                </div>
                <div className="logobox">

                </div>
            </div>
        </>
    )
}

export default Login

