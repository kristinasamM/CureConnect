import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ParticleField from '../components/ParticleField';
import {
  Heart, Mail, Lock, User, Phone, Eye, EyeOff,
  ArrowRight, Loader, AlertCircle, CheckCircle2
} from 'lucide-react';

// ─── MOCK AUTH — works completely without backend ───────────────────────────
const DEMO_USERS_KEY = 'cc_demo_users';

function getDemoUsers() {
  try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]'); }
  catch { return []; }
}

function saveDemoUser(userData) {
  const users = getDemoUsers();
  users.push(userData);
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

// ─── Stand-alone InputField (MUST be outside component to avoid re-mount) ───
function InputField({ icon: Icon, placeholder, type = 'text', value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={16} style={{
        position: 'absolute', left: 14, top: '50%',
        transform: 'translateY(-50%)',
        color: 'rgba(240,244,255,0.35)',
        zIndex: 1, pointerEvents: 'none',
      }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="input-glass"
        style={{ paddingLeft: 42 }}
        autoComplete="off"
      />
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register } = useAuth();

  const defaultRole = params.get('role') || 'patient';
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState(defaultRole);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospital, setHospital] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Try real backend first
      if (mode === 'login') {
        const user = await login(email, password);
        navigate(user.role === 'doctor' ? '/doctor' : '/patient');
        return;
      } else {
        const userData = { name, email, password, role, phone, specialization, hospital, licenseNumber, bloodGroup, gender };
        const user = await register(userData);
        navigate(user.role === 'doctor' ? '/doctor' : '/patient');
        return;
      }
    } catch (backendErr) {
      // Backend offline — use demo/offline mode
      try {
        if (mode === 'login') {
          // Check demo users
          const users = getDemoUsers();
          const found = users.find(u => u.email === email && u.password === password);
          if (found) {
            const { password: _, ...safeUser } = found;
            localStorage.setItem('cc_user', JSON.stringify(safeUser));
            localStorage.setItem('cc_token', 'demo_token_' + Date.now());
            // Trigger auth context update via page reload with token stored
            window.location.href = safeUser.role === 'doctor' ? '/doctor' : '/patient';
            return;
          }
          setError('Invalid email or password. New here? Switch to "Create Account".');
        } else {
          // Register in demo mode
          if (!name || !email || !password) {
            setError('Name, email and password are required.');
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
          }
          const users = getDemoUsers();
          if (users.find(u => u.email === email)) {
            setError('Email already registered. Please sign in.');
            setLoading(false);
            return;
          }
          const newUser = {
            _id: 'demo_' + Date.now(),
            name, email, password, role, phone,
            specialization, hospital, licenseNumber, bloodGroup, gender,
            healthScore: 72,
            avatar: '',
            token: 'demo_token_' + Date.now(),
          };
          saveDemoUser(newUser);
          const { password: _, ...safeUser } = newUser;
          localStorage.setItem('cc_user', JSON.stringify(safeUser));
          localStorage.setItem('cc_token', safeUser.token);
          setSuccess('Account created! Taking you to your dashboard...');
          setTimeout(() => {
            window.location.href = role === 'doctor' ? '/doctor' : '/patient';
          }, 1000);
        }
      } catch (demoErr) {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = role === 'doctor';
  const accentColor = isDoctor ? '#8b5cf6' : '#00d4ff';
  const accentGrad = isDoctor
    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
    : 'linear-gradient(135deg, #00d4ff, #00ff88)';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="bg-grid" />
      <ParticleField count={35} color={isDoctor ? '139, 92, 246' : '0, 212, 255'} />

      {/* Form panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: 480 }}
        >
          {/* Back */}
          <button
            onClick={() => navigate('/select')}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(240,244,255,0.4)',
              fontSize: 14, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: 32,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            ← Change Role
          </button>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{
              width: 44, height: 44,
              background: accentGrad,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={22} color="#000" fill="#000" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, background: accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CureConnect
              </p>
              <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
                {isDoctor ? '// Doctor Portal' : '// Patient OS'}
              </p>
            </div>
          </div>

          {/* Role toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}>
            {['patient', 'doctor'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  fontFamily: 'Outfit, sans-serif', transition: 'all 0.25s',
                  background: role === r
                    ? (r === 'doctor' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #00d4ff, #00ff88)')
                    : 'transparent',
                  color: role === r ? '#000' : 'rgba(240,244,255,0.5)',
                }}
              >
                {r === 'patient' ? '🫀 Patient' : '🩺 Doctor'}
              </button>
            ))}
          </div>

          {/* Mode tabs */}
          <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '13px', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: 15,
                  fontWeight: mode === m ? 700 : 400,
                  color: mode === m ? accentColor : 'rgba(240,244,255,0.4)',
                  borderBottom: mode === m ? `2px solid ${accentColor}` : '2px solid transparent',
                  fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', marginBottom: -1,
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Register-only fields */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {/* Name */}
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="input-glass"
                    style={{ paddingLeft: 42 }}
                  />
                </div>

                {/* Phone */}
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input-glass"
                    style={{ paddingLeft: 42 }}
                  />
                </div>

                {/* Doctor / Patient extra fields */}
                {isDoctor ? (
                  <>
                    <input className="input-glass" placeholder="Specialization (e.g. Cardiology)" value={specialization} onChange={e => setSpecialization(e.target.value)} />
                    <input className="input-glass" placeholder="Hospital / Clinic" value={hospital} onChange={e => setHospital(e.target.value)} />
                    <input className="input-glass" placeholder="Medical License Number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                  </>
                ) : (
                  <>
                    <select className="input-glass" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}
                      style={{ background: 'rgba(10,22,40,0.9)', color: bloodGroup ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <option value="">Blood Group (optional)</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select className="input-glass" value={gender} onChange={e => setGender(e.target.value)}
                      style={{ background: 'rgba(10,22,40,0.9)' }}>
                      <option value="">Gender (optional)</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </>
                )}
              </motion.div>
            )}

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-glass"
                style={{ paddingLeft: 42 }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input-glass"
                style={{ paddingLeft: 42, paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,244,255,0.4)', zIndex: 1 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px',
                    background: 'rgba(255,68,68,0.1)',
                    border: '1px solid rgba(255,68,68,0.25)',
                    borderRadius: 10, color: '#ff6b6b', fontSize: 13, lineHeight: 1.5,
                  }}
                >
                  <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    background: 'rgba(0,255,136,0.1)',
                    border: '1px solid rgba(0,255,136,0.25)',
                    borderRadius: 10, color: '#00ff88', fontSize: 13,
                  }}
                >
                  <CheckCircle2 size={16} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                padding: '14px',
                background: accentGrad,
                border: 'none', borderRadius: 12,
                color: '#000', fontWeight: 800, fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'Outfit, sans-serif',
                opacity: loading ? 0.7 : 1, marginTop: 6,
                boxShadow: `0 8px 30px ${accentColor}40`,
              }}
            >
              {loading ? (
                <><Loader size={18} style={{ animation: 'spin-slow 1s linear infinite' }} /> Processing...</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
              )}
            </motion.button>
          </form>

          {/* Offline hint */}
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
              ✅ Works offline — no server required to explore
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
