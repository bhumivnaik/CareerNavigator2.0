import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
    user_id: number;
    full_name: string;
    email: string;
    github_profile_url?: string | null;
    linkedin_profile_url?: string | null;
    profile_completed: boolean;
    about?: string;
    career_goal_id?: number | null;
    career_goal_name?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        let cancelled = false;

        axios.get("/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {

                // Do not restore the user if logout happened
                // while the request was running.
                const currentToken = localStorage.getItem("token");

                if (!cancelled && currentToken === token) {
                    setUser(response.data);
                }

            })
            .catch(() => {

                const currentToken = localStorage.getItem("token");

                if (!cancelled && currentToken === token) {
                    localStorage.removeItem("token");
                    setUser(null);
                }

            });

        return () => {
            cancelled = true;
        };

    }, []);

    const login = (user: User) => {
        setUser(user);
    };

    const logout = () => {

        // Remove authentication first
        localStorage.removeItem("token");

        // Immediately clear user
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggedIn: user !== null,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};
