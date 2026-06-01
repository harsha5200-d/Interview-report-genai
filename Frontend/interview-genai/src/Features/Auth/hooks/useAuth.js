import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        const data = await login({ email, password });
        setUser(data.user);
        return data;
    };

    const handleRegister = async ({ username, email, password }) => {
        const data = await register({ username, email, password });
        setUser(data.user);
        return data;
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, handleRegister, handleLogin, handleLogout };
};