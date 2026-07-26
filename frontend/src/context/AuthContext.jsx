import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(() => {
    const saved = localStorage.getItem("tuitiontrack_teacher");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tuitiontrack_token");
    if (!token) return setLoading(false);
    api.get("/auth/me")
      .then(({ data }) => {
        setTeacher(data.teacher);
        localStorage.setItem("tuitiontrack_teacher", JSON.stringify(data.teacher));
      })
      .catch(() => setTeacher(null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (endpoint, form) => {
    const { data } = await api.post(`/auth/${endpoint}`, form);
    localStorage.setItem("tuitiontrack_token", data.token);
    localStorage.setItem("tuitiontrack_teacher", JSON.stringify(data.teacher));
    setTeacher(data.teacher);
  };

  const login = (form) => authenticate("login", form);
  const register = async (form) => {
    await api.post("/auth/register", form);
    return authenticate("login", { email: form.email, password: form.password });
  };
  const logout = () => {
    localStorage.removeItem("tuitiontrack_token");
    localStorage.removeItem("tuitiontrack_teacher");
    setTeacher(null);
  };

  const value = useMemo(() => ({ teacher, loading, login, register, logout }), [teacher, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
