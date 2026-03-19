import { createContext, useContext, useState, useEffect } from "react";

const API_BASE  = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY  = "sp_token";
const SELLER_KEY = "sp_seller";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [seller,  setSeller]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(SELLER_KEY)); } catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Persist to localStorage ────────────────────────────────────────────
  useEffect(() => {
    if (token && seller) {
      localStorage.setItem(TOKEN_KEY,  token);
      localStorage.setItem(SELLER_KEY, JSON.stringify(seller));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SELLER_KEY);
    }
  }, [token, seller]);

  // ── Authenticated fetch helper ─────────────────────────────────────────
  async function authFetch(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error("Session expired. Please log in again.");
    }
    return res;
  }

  // ── Login ──────────────────────────────────────────────────────────────
  async function login(email, password) {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Login failed.");
      setToken(data.token);
      setSeller(data.seller);
      return { success: true, seller: data.seller };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────
  async function register({ fullName, businessName, email, phone, password }) {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName, businessName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Registration failed.");
      setToken(data.token);
      setSeller(data.seller);
      return { success: true, seller: data.seller };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  function logout() {
    setToken("");
    setSeller(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SELLER_KEY);
  }

  // ── Refresh seller from server ─────────────────────────────────────────
  // Correct endpoint: GET /api/auth/me (not /api/seller/me which doesn't exist)
  async function refreshSeller() {
    if (!token) return;
    try {
      const res  = await authFetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.seller) {
        setSeller(data.seller);
        localStorage.setItem(SELLER_KEY, JSON.stringify(data.seller));
      }
    } catch (err) {
      console.warn("refreshSeller error:", err.message);
    }
  }

  const isLoggedIn = !!token && !!seller;

  return (
    <AuthContext.Provider value={{
      seller,
      setSeller,       // ← exported so Settings can update seller after PATCH
      token,
      loading,
      error,
      login,
      register,
      logout,
      authFetch,
      isLoggedIn,
      refreshSeller,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
