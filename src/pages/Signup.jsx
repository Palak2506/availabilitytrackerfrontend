import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, Users, CalendarCheck } from "lucide-react";

const ROLES = [
  {
    value: "USER",
    label: "I'm a mentee",
    description: "Looking for guidance",
    icon: (
      <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M10 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path d="M2 14a5 5 0 0110 0"/>
      </svg>
    ),
  },
  {
    value: "MENTOR",
    label: "I'm a mentor",
    description: "Ready to guide others",
    icon: (
      <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M10 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path d="M2 14a5 5 0 0110 0"/>
        <path d="M12 7a3 3 0 00-3-3"/>
        <path d="M14 12a3 3 0 00-3-3"/>
      </svg>
    ),
  },
];

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      fontFamily: 'var(--font-sans)',
      background: '#F8F8F7',
    }}>
      {/* Left — Hero / Brand panel */}
      <div style={{
        flex: '1 1 50%',
        background: 'linear-gradient(145deg, #1A1A2E 0%, #2d2d4e 50%, #4338CA 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.12)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(165,180,252,0.10)',
          filter: 'blur(50px)',
        }} />

        {/* Logo */}
        <img
          src="/mentorque-logo.png.jpeg"
          alt="MentorQue"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            objectFit: 'cover',
            marginBottom: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        />

        {/* Brand name */}
        <div style={{
          fontSize: '36px',
          fontWeight: 300,
          color: '#fff',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
        }}>
          MentorQue
        </div>
        <div style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '40px',
          letterSpacing: '0.06em',
        }}>
          Availability Tracker
        </div>

        {/* Feature highlights */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '320px',
          width: '100%',
        }}>
          {[
            { icon: <Clock size={18} />, text: 'See when your mentor is available' },
            { icon: <Users size={18} />, text: 'Get matched with the right mentor for you' },
            { icon: <CalendarCheck size={18} />, text: 'Book and manage your sessions easily' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
              border: '0.5px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.25)',
          fontFamily: 'var(--font-mono)',
        }}>
          © {new Date().getFullYear()} MentorQue
        </div>
      </div>

      {/* Right — Auth form */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 40px',
        minWidth: '0',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Welcome section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 300,
              color: '#1A1A2E',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}>
              Create your account
            </div>
            <div style={{
              fontSize: '13px',
              color: '#9CA3AF',
            }}>
              Choose your role and get started
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: '#fff',
            border: '0.5px solid #E5E5E3',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(26,26,46,0.06)',
          }}>
            {error && (
              <div style={{
                background: '#FEE2E2',
                border: '0.5px solid #FCA5A5',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#991B1B',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            {/* Role selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    borderRadius: '12px',
                    border: role === r.value ? '2px solid #4338CA' : '1.5px solid #E5E5E3',
                    background: role === r.value ? '#EEF2FF' : '#FAFAFA',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '6px',
                    color: role === r.value ? '#4338CA' : '#9CA3AF',
                  }}>
                    {r.icon}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: role === r.value ? '#4338CA' : '#1A1A2E',
                    marginBottom: '2px',
                  }}>
                    {r.label}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: role === r.value ? '#6366F1' : '#9CA3AF',
                    lineHeight: '1.3',
                  }}>
                    {r.description}
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: '5px',
                  letterSpacing: '0.02em',
                }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input"
                  style={{ width: '100%', fontSize: '14px', padding: '9px 14px' }}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: '5px',
                  letterSpacing: '0.02em',
                }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  style={{ width: '100%', fontSize: '14px', padding: '9px 14px' }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: '5px',
                  letterSpacing: '0.02em',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input"
                  style={{ width: '100%', fontSize: '14px', padding: '9px 14px' }}
                  placeholder="At least 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '14px',
                  marginTop: '2px',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? "Creating account…" : `Sign up as ${role === "MENTOR" ? "Mentor" : "Mentee"}`}
              </button>
            </form>

            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '0.5px solid #F1F0EE',
              fontSize: '13px',
              color: '#9CA3AF',
              textAlign: 'center',
            }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: '#4338CA',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
