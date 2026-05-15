import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Sign In state
  const [tab, setTab] = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Create Account state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("analyst");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);
  const [forgotError, setForgotError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);
    try {
      await api.post("/auth/register", {
        username: regUsername,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });
      setRegSuccess("Account created! You can now sign in.");
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setTimeout(() => setTab("signin"), 2000);
    } catch (err) {
      setRegError(
        err.response?.data?.detail ||
          "Registration failed. Username may already exist.",
      );
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotResult(null);
    setForgotLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        username: forgotUsername,
      });
      setForgotResult(res.data.temp_password);
    } catch (err) {
      setForgotError(
        err.response?.data?.detail ||
          "Username not found. Please check and try again.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotUsername("");
    setForgotResult(null);
    setForgotError("");
  };

  const s = {
    page: {
      minHeight: "100vh",
      background: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    },
    card: {
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "16px",
      padding: "2.5rem",
      width: "100%",
      maxWidth: "420px",
    },
    logo: {
      textAlign: "center",
      marginBottom: "1.5rem",
    },
    logoImg: {
      width: "56px",
      height: "56px",
      marginBottom: "0.5rem",
    },
    logoText: {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: "1.8rem",
      fontWeight: 700,
      color: "#f1f5f9",
    },
    logoSL: { color: "#f59e0b" },
    tagline: { color: "#64748b", fontSize: "0.85rem" },
    tabs: {
      display: "flex",
      background: "#0f172a",
      borderRadius: "8px",
      padding: "4px",
      marginBottom: "1.5rem",
    },
    tabBtn: (active) => ({
      flex: 1,
      padding: "0.5rem",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "0.9rem",
      background: active ? "#1e293b" : "transparent",
      color: active ? "#f59e0b" : "#64748b",
      transition: "all 0.2s",
    }),
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "0.4rem",
      marginTop: "1rem",
    },
    input: {
      width: "100%",
      background: "#0f172a",
      border: "1px solid #475569",
      borderRadius: "8px",
      color: "#f1f5f9",
      padding: "0.65rem 0.9rem",
      fontSize: "0.95rem",
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      background: "#0f172a",
      border: "1px solid #475569",
      borderRadius: "8px",
      color: "#f1f5f9",
      padding: "0.65rem 0.9rem",
      fontSize: "0.95rem",
      outline: "none",
      boxSizing: "border-box",
      cursor: "pointer",
    },
    btn: {
      width: "100%",
      background: "#f59e0b",
      color: "#0f172a",
      border: "none",
      borderRadius: "8px",
      padding: "0.75rem",
      fontSize: "1rem",
      fontWeight: 700,
      cursor: "pointer",
      marginTop: "1.5rem",
    },
    error: {
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: "8px",
      color: "#fca5a5",
      padding: "0.75rem",
      fontSize: "0.85rem",
      marginBottom: "0.5rem",
    },
    success: {
      background: "rgba(16,185,129,0.1)",
      border: "1px solid rgba(16,185,129,0.3)",
      borderRadius: "8px",
      color: "#6ee7b7",
      padding: "0.75rem",
      fontSize: "0.85rem",
      marginBottom: "0.5rem",
    },
    forgotLink: {
      display: "block",
      textAlign: "right",
      color: "#64748b",
      fontSize: "0.8rem",
      marginTop: "0.5rem",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 0,
      textDecoration: "underline",
    },
    footer: {
      textAlign: "center",
      marginTop: "2rem",
      color: "#475569",
      fontSize: "0.75rem",
      lineHeight: 1.6,
    },
    // Modal
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "16px",
      padding: "2rem",
      width: "100%",
      maxWidth: "380px",
    },
    modalTitle: {
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: "1.3rem",
      fontWeight: 700,
      color: "#f59e0b",
      marginBottom: "0.5rem",
    },
    modalSubtitle: {
      color: "#94a3b8",
      fontSize: "0.85rem",
      marginBottom: "1.25rem",
    },
    tempPassBox: {
      background: "#0f172a",
      border: "1px solid #f59e0b",
      borderRadius: "8px",
      padding: "1rem",
      textAlign: "center",
      margin: "1rem 0",
    },
    tempPass: {
      fontFamily: "monospace",
      fontSize: "1.4rem",
      fontWeight: 700,
      color: "#f59e0b",
      letterSpacing: "0.1em",
    },
    modalBtnRow: {
      display: "flex",
      gap: "0.75rem",
      marginTop: "1rem",
    },
    cancelBtn: {
      flex: 1,
      padding: "0.6rem",
      background: "transparent",
      border: "1px solid #334155",
      borderRadius: "8px",
      color: "#94a3b8",
      cursor: "pointer",
      fontSize: "0.9rem",
    },
    submitBtn: {
      flex: 1,
      padding: "0.6rem",
      background: "#f59e0b",
      border: "none",
      borderRadius: "8px",
      color: "#0f172a",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "0.9rem",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <img
            src="/cricksl-favicon.png"
            alt="CrickSL"
            style={s.logoImg}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div style={s.logoText}>
            Crick<span style={s.logoSL}>SL</span>
          </div>
          <div style={s.tagline}>T20 Cricket Decision Support System</div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={s.tabBtn(tab === "signin")}
            onClick={() => {
              setTab("signin");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            style={s.tabBtn(tab === "register")}
            onClick={() => {
              setTab("register");
              setRegError("");
              setRegSuccess("");
            }}
          >
            Create Account
          </button>
        </div>

        {/* Sign In Form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn}>
            {error && <div style={s.error}>{error}</div>}
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              style={s.forgotLink}
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister}>
            {regError && <div style={s.error}>{regError}</div>}
            {regSuccess && <div style={s.success}>{regSuccess}</div>}
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              required
            />
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
            />
            <label style={s.label}>Role</label>
            <select
              style={s.select}
              value={regRole}
              onChange={(e) => setRegRole(e.target.value)}
            >
              <option value="analyst">Analyst</option>
              <option value="coach">Coach</option>
              <option value="player">Player</option>
            </select>
            <button style={s.btn} type="submit" disabled={regLoading}>
              {regLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        <div style={s.footer}>
          © 2026 CrickSL. All rights reserved.
          <br />
          Sri Lanka Cricket Analytics Platform
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div style={s.overlay} onClick={closeForgot}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>🔑 Reset Password</div>

            {!forgotResult ? (
              <>
                <div style={s.modalSubtitle}>
                  Enter your username and we'll generate a temporary password
                  for you.
                </div>
                {forgotError && <div style={s.error}>{forgotError}</div>}
                <form onSubmit={handleForgotPassword}>
                  <label style={s.label}>Username</label>
                  <input
                    style={s.input}
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                  />
                  <div style={s.modalBtnRow}>
                    <button
                      type="button"
                      style={s.cancelBtn}
                      onClick={closeForgot}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={s.submitBtn}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Generating…" : "Get Temp Password"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div style={s.modalSubtitle}>
                  Your temporary password has been generated. Use it to sign in,
                  then change your password from account settings.
                </div>
                <div style={s.tempPassBox}>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    TEMPORARY PASSWORD
                  </div>
                  <div style={s.tempPass}>{forgotResult}</div>
                </div>
                <div
                  style={{
                    color: "#f59e0b",
                    fontSize: "0.8rem",
                    marginBottom: "1rem",
                  }}
                >
                  ⚠️ This password is valid for one login. You will be prompted
                  to change it.
                </div>
                <button
                  style={{ ...s.submitBtn, width: "100%" }}
                  onClick={() => {
                    closeForgot();
                    setPassword(forgotResult);
                    setUsername(forgotUsername);
                  }}
                >
                  Sign In Now
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
