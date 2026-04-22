import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ECGLine from '../components/ECGLine';
import PatientHealthTimeline from '../components/PatientHealthTimeline';
import {
  Activity, FileText, Calendar, Pill,
  TrendingUp, Heart, Plus, Upload,
  Clock, CheckCircle, Brain,
  Thermometer, Droplets, Key, Copy, RefreshCw,
  Stethoscope, AlertTriangle, X, Eye,
  ChevronDown, CheckCircle2, Trash2, Video, MapPin, Phone
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const AVAILABLE_DOCTORS = [
  { name: 'Dr. Sarah Chen', specialty: 'Cardiologist', available: ['9:00 AM','10:00 AM','2:00 PM','4:00 PM'] },
  { name: 'Dr. Raj Kumar', specialty: 'Endocrinologist', available: ['10:00 AM','11:30 AM','3:00 PM'] },
  { name: 'Dr. Priya Mehta', specialty: 'General Physician', available: ['8:30 AM','12:00 PM','1:00 PM','5:00 PM'] },
  { name: 'Dr. Aman Verma', specialty: 'Pulmonologist', available: ['9:30 AM','2:30 PM','4:30 PM'] },
  { name: 'Dr. Neha Sharma', specialty: 'Dermatologist', available: ['10:30 AM','1:30 PM','3:30 PM'] },
  { name: 'Dr. Arjun Patel', specialty: 'Psychiatrist', available: ['11:00 AM','2:00 PM','6:00 PM'] },
];

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const SPECIALTY_MAP = {
  'diabetes': { spec: 'Endocrinologist', emoji: '🩺', color: '#00d4ff', desc: 'For blood sugar management and hormonal disorders' },
  'hypertension': { spec: 'Cardiologist', emoji: '❤️', color: '#ff4444', desc: 'For blood pressure and heart health management' },
  'blood pressure': { spec: 'Cardiologist', emoji: '❤️', color: '#ff4444', desc: 'For cardiovascular and blood pressure concerns' },
  'asthma': { spec: 'Pulmonologist', emoji: '🫁', color: '#00ff88', desc: 'For respiratory and lung care' },
  'thyroid': { spec: 'Endocrinologist', emoji: '🩺', color: '#00d4ff', desc: 'For thyroid and hormonal health' },
  'skin': { spec: 'Dermatologist', emoji: '✨', color: '#ec4899', desc: 'For skin conditions and treatments' },
  'eye': { spec: 'Ophthalmologist', emoji: '👁️', color: '#8b5cf6', desc: 'For vision and eye health' },
  'joint': { spec: 'Rheumatologist', emoji: '🦴', color: '#f59e0b', desc: 'For joint pain and autoimmune conditions' },
  'arthritis': { spec: 'Rheumatologist', emoji: '🦴', color: '#f59e0b', desc: 'For arthritis and inflammatory disorders' },
  'kidney': { spec: 'Nephrologist', emoji: '🫘', color: '#00ff88', desc: 'For kidney function and care' },
  'mental': { spec: 'Psychiatrist', emoji: '🧠', color: '#8b5cf6', desc: 'For mental health and emotional wellbeing' },
  'anxiety': { spec: 'Psychiatrist', emoji: '🧠', color: '#8b5cf6', desc: 'For anxiety, stress and mental health' },
  'depression': { spec: 'Psychiatrist', emoji: '🧠', color: '#8b5cf6', desc: 'For mood disorders and mental health' },
  'bone': { spec: 'Orthopedist', emoji: '🦴', color: '#f59e0b', desc: 'For bone, muscle and skeletal care' },
  'digestive': { spec: 'Gastroenterologist', emoji: '🫃', color: '#00ff88', desc: 'For digestive tract and gut health' },
  'stomach': { spec: 'Gastroenterologist', emoji: '🫃', color: '#00ff88', desc: 'For stomach and digestive concerns' },
};

function getSuggestedSpecialties(records, userConditions) {
  const suggestions = new Map();
  const text = [...records.map(r => `${r.title} ${r.description || ''} ${r.type || ''}`), userConditions || ''].join(' ').toLowerCase();
  for (const [keyword, info] of Object.entries(SPECIALTY_MAP)) {
    if (text.includes(keyword)) suggestions.set(info.spec, info);
  }
  return [...suggestions.values()];
}

const AI_QA = [
  { category: 'Vitals', questions: [
    { q: 'Is my blood pressure reading normal?', a: 'Your current reading of 118/76 mmHg is within the normal range (below 120/80). Keep monitoring daily and maintain low sodium intake. If it rises above 130/80 consistently, consult a Cardiologist.' },
    { q: 'What does my heart rate tell me?', a: 'Your heart rate of 72 bpm is healthy (normal: 60–100 bpm). Regular aerobic exercise can lower resting heart rate. If you experience palpitations or rates above 100, seek medical attention.' },
    { q: 'What does my blood oxygen level mean?', a: 'Your SpO₂ of 98% is excellent (normal: 95–100%). Levels below 92% require immediate medical attention. Factors like altitude, smoking, and lung disease can affect it.' },
  ]},
  { category: 'Medications', questions: [
    { q: 'What happens if I miss a medication dose?', a: "Take it as soon as you remember — unless it's almost time for the next dose. Never double up. Missing doses can reduce effectiveness. Set a daily alarm to maintain consistency." },
    { q: 'Can I take my medications together?', a: 'Based on your current prescriptions, consult your doctor before combining medications. Some drugs interact: for example, blood thinners should not be taken with NSAIDs without guidance.' },
    { q: 'How long do I need to take my medications?', a: "Duration depends on your condition. Chronic conditions (diabetes, hypertension) often require lifelong management. Your doctor will advise on review dates. Never stop abruptly without consulting." },
  ]},
  { category: 'Lifestyle', questions: [
    { q: 'What diet changes would help my condition?', a: 'For your health profile: reduce processed foods and sodium, increase leafy greens, omega-3s (fish, flaxseed), and stay hydrated. A Mediterranean diet is strong evidence-based for heart and metabolic health.' },
    { q: 'How much exercise is recommended for me?', a: '150 minutes of moderate exercise per week (e.g., 30 min brisk walk × 5 days) is the standard recommendation. Start slow and increase gradually. Avoid strenuous exercise if BP is uncontrolled.' },
    { q: 'How can I manage stress to improve my health?', a: 'Chronic stress elevates cortisol, affecting BP and blood sugar. Try 10 min daily deep breathing, 7–8 hours sleep, and limit caffeine. Apps like Calm or Headspace can help with guided meditation.' },
  ]},
  { category: 'When to Visit Doctor', questions: [
    { q: 'What symptoms should trigger an emergency visit?', a: 'Seek emergency care for: chest pain, sudden severe headache, difficulty breathing, one-sided weakness/numbness, vision loss, or blood sugar below 70 or above 300 mg/dL. Call 108 (India) or 911 immediately.' },
    { q: 'How often should I get a health check-up?', a: "Annual wellness check-ups are recommended. With chronic conditions, follow your doctor's schedule (often every 3–6 months). Regular labs (HbA1c, lipid panel, CBC) help catch issues early." },
    { q: 'Are my symptoms serious enough to see a doctor?', a: 'Symptoms persisting more than 3–5 days, worsening over time, or affecting daily life should prompt a visit. When in doubt, it\'s always safer to get evaluated. Your health record has been flagged for next review.' },
  ]},
];

const vitalsData = [
  { day: 'Mon', bp: 118, hr: 72, o2: 98 },
  { day: 'Tue', bp: 122, hr: 75, o2: 97 },
  { day: 'Wed', bp: 115, hr: 68, o2: 99 },
  { day: 'Thu', bp: 128, hr: 80, o2: 98 },
  { day: 'Fri', bp: 120, hr: 73, o2: 97 },
  { day: 'Sat', bp: 116, hr: 71, o2: 98 },
  { day: 'Sun', bp: 119, hr: 70, o2: 99 },
];

const medications = [
  { name: 'Metformin', dose: '500mg', freq: 'Twice daily', time: '8 AM / 8 PM', status: 'taken', color: '#00d4ff' },
  { name: 'Lisinopril', dose: '10mg', freq: 'Once daily', time: '9:00 AM', status: 'pending', color: '#8b5cf6' },
  { name: 'Atorvastatin', dose: '20mg', freq: 'Once daily', time: '9:00 PM', status: 'pending', color: '#00ff88' },
];

const WidgetCard = ({ children, title, icon: Icon, color = '#00d4ff', action, style = {} }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card"
    style={{ padding: 24, ...style }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
      </div>
      {action && (
        <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }} onClick={action.fn}>
          {action.icon && <action.icon size={13} />} {action.label}
        </button>
      )}
    </div>
    {children}
  </motion.div>
);

const HealthMeter = ({ score }) => {
  const c = 2 * Math.PI * 50;
  const color = score >= 80 ? '#00ff88' : score >= 60 ? '#00d4ff' : '#f59e0b';
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <motion.circle cx="70" cy="70" r="50" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 70 70)" filter={`drop-shadow(0 0 8px ${color})`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 900, color }}>{score}</span>
        <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>SCORE</span>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [accessCode, setAccessCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [selectedQ, setSelectedQ] = useState(null);
  const [sosCountdown, setSosCountdown] = useState(null);
  const [medStatus, setMedStatus] = useState(
    medications.reduce((acc, m, i) => ({ ...acc, [i]: m.status === 'taken' }), {})
  );
  const [showBooking, setShowBooking] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [bookForm, setBookForm] = useState({ doctor: '', specialty: '', date: '', time: '', type: 'video', reason: '' });
  const [bookSuccess, setBookSuccess] = useState(false);

  useEffect(() => {
    const userId = user?._id || 'demo';
    const stored = JSON.parse(localStorage.getItem(`cc_appointments_${userId}`) || '[]');
    setBookedAppointments(stored);
  }, [user]);

  const handleBookAppointment = () => {
    if (!bookForm.doctor || !bookForm.date || !bookForm.time) return;
    const userId = user?._id || 'demo';
    const doctorInfo = AVAILABLE_DOCTORS.find(d => d.name === bookForm.doctor);
    const newAppt = {
      id: Date.now(),
      doctor: bookForm.doctor,
      specialty: doctorInfo?.specialty || bookForm.specialty,
      date: new Date(bookForm.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: bookForm.time, type: bookForm.type, reason: bookForm.reason,
      status: 'confirmed', bookedAt: new Date().toLocaleDateString('en-IN'),
    };
    const updated = [newAppt, ...bookedAppointments];
    localStorage.setItem(`cc_appointments_${userId}`, JSON.stringify(updated));
    setBookedAppointments(updated);
    setBookSuccess(true);
    setTimeout(() => { setBookSuccess(false); setShowBooking(false); setBookForm({ doctor: '', specialty: '', date: '', time: '', type: 'video', reason: '' }); }, 1800);
  };

  const cancelAppointment = (id) => {
    const userId = user?._id || 'demo';
    const updated = bookedAppointments.filter(a => a.id !== id);
    localStorage.setItem(`cc_appointments_${userId}`, JSON.stringify(updated));
    setBookedAppointments(updated);
  };

  useEffect(() => {
    const userId = user?._id || 'demo';
    const stored = localStorage.getItem(`cc_docs_${userId}`);
    if (stored) setDocuments(JSON.parse(stored));
    const code = localStorage.getItem(`cc_code_${userId}`);
    if (code) setAccessCode(code);
    else {
      const newCode = genCode();
      localStorage.setItem(`cc_code_${userId}`, newCode);
      const codemap = JSON.parse(localStorage.getItem('cc_codemap') || '{}');
      codemap[newCode] = userId;
      localStorage.setItem('cc_codemap', JSON.stringify(codemap));
      setAccessCode(newCode);
    }
  }, [user]);

  const regenerateCode = () => {
    const userId = user?._id || 'demo';
    const oldCode = accessCode;
    const newCode = genCode();
    localStorage.setItem(`cc_code_${userId}`, newCode);
    const codemap = JSON.parse(localStorage.getItem('cc_codemap') || '{}');
    delete codemap[oldCode];
    codemap[newCode] = userId;
    localStorage.setItem('cc_codemap', JSON.stringify(codemap));
    setAccessCode(newCode);
    setCodeCopied(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(accessCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const userId = user?._id || 'demo';
    let processed = 0;
    const newDocs = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newDocs.push({ id: Date.now() + Math.random(), name: file.name, type: file.type, size: (file.size / 1024).toFixed(1) + ' KB', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), data: ev.target.result, category: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'Image' : 'Document' });
        processed++;
        if (processed === files.length) {
          const updated = [...documents, ...newDocs];
          setDocuments(updated);
          localStorage.setItem(`cc_docs_${userId}`, JSON.stringify(updated));
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const deleteDocument = (id) => {
    const userId = user?._id || 'demo';
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem(`cc_docs_${userId}`, JSON.stringify(updated));
  };

  const openDocument = (doc) => {
    if (doc.data) {
      const win = window.open();
      win.document.write(`<iframe src="${doc.data}" style="width:100%;height:100vh;border:none;"></iframe>`);
    }
  };

  const triggerSOS = () => {
    setSosCountdown(5);
    const iv = setInterval(() => setSosCountdown(c => {
      if (c <= 1) { clearInterval(iv); setSosCountdown(null); return null; }
      return c - 1;
    }), 1000);
  };

  const vitals = [
    { icon: Heart, label: 'Heart Rate', value: '72', unit: 'bpm', color: '#ff4444' },
    { icon: Activity, label: 'Blood Pressure', value: '118/76', unit: 'mmHg', color: '#00d4ff' },
    { icon: Droplets, label: 'Blood Oxygen', value: '98', unit: '%', color: '#00ff88' },
    { icon: Thermometer, label: 'Temperature', value: '98.4', unit: '°F', color: '#f59e0b' },
  ];

  const specialtySuggestions = getSuggestedSpecialties(documents, user?.chronicConditions?.join(' ') || 'diabetes hypertension');

  // ── Responsive grid helper
  const col = (desktop, mobile = '1fr') => isMobile ? mobile : desktop;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#030712' }}>
      <div className="bg-grid" />
      <Sidebar role="patient" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar role="patient" onMenuToggle={() => setSidebarOpen(v => !v)} />

      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 260,
        marginTop: 68,
        padding: isMobile ? '20px 14px 80px' : '32px 32px 80px',
        position: 'relative', zIndex: 1,
      }}>

        {/* Welcome row */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
                Good morning, <span style={{ background: 'linear-gradient(135deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {user?.name?.split(' ')[0] || 'Patient'}
                </span> 👋
              </h1>
              <p style={{ color: 'rgba(240,244,255,0.45)', marginTop: 6, fontSize: 14 }}>
                Health score: {user?.healthScore || 78}/100 · 1 appointment today
              </p>
            </div>
            <motion.button
              onClick={triggerSOS}
              animate={sosCountdown ? { scale: [1,1.08,1], boxShadow: ['0 0 30px rgba(255,68,68,0.4)','0 0 60px rgba(255,68,68,0.8)','0 0 30px rgba(255,68,68,0.4)'] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg,#ff4444,#ff6b6b)', border: 'none', borderRadius: 50, color: '#fff', fontWeight: 800, fontSize: isMobile ? 13 : 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(255,68,68,0.4)', fontFamily: 'Outfit, sans-serif', alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: 'center' }}
            >
              <AlertTriangle size={16} />
              {sosCountdown ? `SOS in ${sosCountdown}s` : 'EMERGENCY SOS'}
            </motion.button>
          </div>
          <div style={{ marginTop: 16 }}><ECGLine color="#00d4ff" height={44} /></div>
        </motion.div>

        {/* Row 1: Score + Vitals */}
        <div style={{ display: 'grid', gridTemplateColumns: col('1fr 2fr'), gap: 16, marginBottom: 16 }}>
          <WidgetCard title="Health Score" icon={Activity} color="#00ff88">
            <HealthMeter score={user?.healthScore || 78} />
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <span className="badge badge-green">Good Condition</span>
            </div>
          </WidgetCard>

          <WidgetCard title="Today's Vitals" icon={Heart} color="#ff4444">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {vitals.map(v => (
                <motion.div key={v.label} whileHover={{ scale: 1.02 }} style={{ padding: '12px 14px', background: `${v.color}08`, border: `1px solid ${v.color}20`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${v.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <v.icon size={16} color={v.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)' }}>{v.label}</p>
                    <p style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: v.color }}>{v.value} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(240,244,255,0.4)' }}>{v.unit}</span></p>
                  </div>
                </motion.div>
              ))}
            </div>
          </WidgetCard>
        </div>

        {/* Row 2: Documents + Access Code */}
        <div style={{ display: 'grid', gridTemplateColumns: col('2fr 1fr'), gap: 16, marginBottom: 16 }}>
          <WidgetCard title="Health Locker — My Documents" icon={FileText} color="#00d4ff"
            action={{ label: 'Upload File', icon: Upload, fn: () => fileInputRef.current?.click() }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            {uploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'rgba(0,212,255,0.08)', borderRadius: 10, marginBottom: 12 }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(0,212,255,0.3)', borderTop: '2px solid #00d4ff', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                <span style={{ fontSize: 13, color: 'rgba(0,212,255,0.8)' }}>Uploading document...</span>
              </div>
            )}
            {documents.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', border: '1px dashed rgba(0,212,255,0.2)', borderRadius: 14, cursor: 'pointer', gap: 10 }}>
                <Upload size={28} color="rgba(0,212,255,0.4)" />
                <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: 14, textAlign: 'center' }}>Upload prescriptions, lab reports, X-rays...</p>
                <p style={{ color: 'rgba(240,244,255,0.25)', fontSize: 12 }}>PDF, JPG, PNG, DOC supported</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {documents.map(doc => (
                  <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(0,212,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                      {doc.category === 'PDF' ? '📄' : doc.category === 'Image' ? '🖼️' : '📋'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>{doc.date} · {doc.size}</p>
                    </div>
                    <button onClick={() => openDocument(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,212,255,0.6)', padding: 4 }}><Eye size={15} /></button>
                    <button onClick={() => deleteDocument(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,68,68,0.5)', padding: 4 }}><Trash2 size={15} /></button>
                  </motion.div>
                ))}
              </div>
            )}
            {documents.length > 0 && (
              <button onClick={() => fileInputRef.current?.click()} style={{ marginTop: 12, width: '100%', padding: '9px', border: '1px dashed rgba(0,212,255,0.2)', background: 'none', borderRadius: 10, color: 'rgba(0,212,255,0.6)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Outfit, sans-serif' }}>
                <Plus size={14} /> Add more documents
              </button>
            )}
          </WidgetCard>

          <WidgetCard title="Doctor Access Code" icon={Key} color="#8b5cf6">
            <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              Share this code with your doctor to grant access to your health documents.
            </p>
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10, letterSpacing: 2 }}>YOUR PRIVATE ACCESS CODE</p>
              <p style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, letterSpacing: '4px', color: '#8b5cf6', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>{accessCode}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyCode} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: codeCopied ? 'rgba(0,255,136,0.15)' : 'rgba(139,92,246,0.15)', border: `1px solid ${codeCopied ? 'rgba(0,255,136,0.3)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 10, color: codeCopied ? '#00ff88' : '#8b5cf6', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, transition: 'all 0.2s' }}>
                {codeCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={regenerateCode} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(240,244,255,0.5)', cursor: 'pointer' }}><RefreshCw size={15} /></button>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.8)' }}>⚠️ Only share with your trusted doctor.</p>
            </div>
          </WidgetCard>
        </div>

        {/* Row 3: Specialists + Medications */}
        <div style={{ display: 'grid', gridTemplateColumns: col('1fr 1fr'), gap: 16, marginBottom: 16 }}>
          <WidgetCard title="Recommended Specialists" icon={Stethoscope} color="#00ff88">
            <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
              Based on your health records and conditions:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(specialtySuggestions.length > 0 ? specialtySuggestions : [
                { spec: 'General Physician', emoji: '👨‍⚕️', color: '#00d4ff', desc: 'For routine check-ups and initial consultations' },
                { spec: 'Cardiologist', emoji: '❤️', color: '#ff4444', desc: 'For heart health based on your BP readings' },
              ]).map((s, i) => (
                <motion.div key={s.spec} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{s.emoji}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.spec}</p>
                    <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', marginTop: 2 }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </WidgetCard>

          <WidgetCard title="Medications" icon={Pill} color="#8b5cf6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {medications.map((med, i) => (
                <motion.div key={i} whileHover={{ x: 3 }} style={{ padding: '13px', background: `${med.color}08`, border: `1px solid ${med.color}20`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: med.color, boxShadow: `0 0 8px ${med.color}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{med.name} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(240,244,255,0.5)' }}>{med.dose}</span></p>
                    <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>{med.freq} · {med.time}</p>
                  </div>
                  <button onClick={() => setMedStatus(s => ({ ...s, [i]: !s[i] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                    {medStatus[i] ? <CheckCircle size={20} color="#00ff88" /> : <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${med.color}` }} />}
                  </button>
                </motion.div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'rgba(0,255,136,0.8)' }}>✅ {Object.values(medStatus).filter(Boolean).length}/{medications.length} medications taken today</p>
            </div>
          </WidgetCard>
        </div>

        {/* Row 4: Chart + Appointments */}
        <div style={{ display: 'grid', gridTemplateColumns: col('2fr 1fr'), gap: 16, marginBottom: 16 }}>
          <WidgetCard title="Weekly Health Trends" icon={TrendingUp} color="#00d4ff">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={vitalsData}>
                <defs>
                  <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(6,13,28,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10, color: '#f0f4ff', fontSize: 13 }} />
                <Area type="monotone" dataKey="bp" name="Systolic BP" stroke="#00d4ff" fill="url(#bpGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="hr" name="Heart Rate" stroke="#ff4444" fill="none" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </WidgetCard>

          <WidgetCard title="Appointments" icon={Calendar} color="#8b5cf6" action={{ label: 'Book New', icon: Plus, fn: () => setShowBooking(true) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
              {bookedAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <Calendar size={28} style={{ color: 'rgba(240,244,255,0.2)', marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.35)' }}>No appointments booked</p>
                  <button onClick={() => setShowBooking(true)} style={{ marginTop: 10, padding: '8px 18px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#8b5cf6', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Book your first</button>
                </div>
              ) : bookedAppointments.map((appt) => (
                <motion.div key={appt.id} whileHover={{ x: 3 }} style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{appt.doctor}</p>
                      <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)' }}>{appt.specialty}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{appt.date}</span>
                        <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 600 }}>{appt.time}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span className="badge badge-green">confirmed</span>
                      <button onClick={() => cancelAppointment(appt.id)} style={{ fontSize: 11, color: 'rgba(255,68,68,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </WidgetCard>

          {/* Booking Modal */}
          <AnimatePresence>
            {showBooking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', background: 'rgba(3,7,18,0.88)', backdropFilter: 'blur(10px)', zIndex: 500 }}
                onClick={e => { if (e.target === e.currentTarget) setShowBooking(false); }}>
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="glass-card"
                  style={{ width: '100%', maxWidth: isMobile ? '100%' : 500, maxHeight: '90vh', overflowY: 'auto', padding: isMobile ? '24px 16px' : 28, border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 80px rgba(139,92,246,0.15)', borderRadius: isMobile ? '20px 20px 0 0' : 16 }}>
                  {bookSuccess ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 60 }}>✅</motion.div>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#00ff88', marginTop: 16 }}>Appointment Booked!</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Book Appointment</h3>
                        <button onClick={() => setShowBooking(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,244,255,0.4)', fontSize: 20 }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 6 }}>SELECT DOCTOR</label>
                          <select className="input-glass" value={bookForm.doctor}
                            onChange={e => { const doc = AVAILABLE_DOCTORS.find(d => d.name === e.target.value); setBookForm(f => ({ ...f, doctor: e.target.value, specialty: doc?.specialty || '', time: '' })); }}
                            style={{ background: 'rgba(10,22,40,0.9)' }}>
                            <option value="">Choose a doctor...</option>
                            {AVAILABLE_DOCTORS.map(d => <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 6 }}>SELECT DATE</label>
                          <input type="date" className="input-glass" min={new Date().toISOString().split('T')[0]} value={bookForm.date} onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} style={{ background: 'rgba(10,22,40,0.9)', colorScheme: 'dark' }} />
                        </div>
                        {bookForm.doctor && (
                          <div>
                            <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 6 }}>AVAILABLE SLOTS</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {AVAILABLE_DOCTORS.find(d => d.name === bookForm.doctor)?.available.map(slot => (
                                <button key={slot} onClick={() => setBookForm(f => ({ ...f, time: slot }))}
                                  style={{ padding: '8px 14px', background: bookForm.time === slot ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${bookForm.time === slot ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: bookForm.time === slot ? '#8b5cf6' : 'rgba(240,244,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: bookForm.time === slot ? 700 : 400, transition: 'all 0.15s', minHeight: 44 }}>
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 6 }}>TYPE</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[{ id: 'video', label: '📹 Video' }, { id: 'call', label: '📞 Voice' }, { id: 'in-person', label: '🏥 In-Person' }].map(t => (
                              <button key={t.id} onClick={() => setBookForm(f => ({ ...f, type: t.id }))}
                                style={{ flex: 1, padding: '10px 6px', background: bookForm.type === t.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${bookForm.type === t.id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: bookForm.type === t.id ? '#8b5cf6' : 'rgba(240,244,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: bookForm.type === t.id ? 700 : 400, minHeight: 44 }}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 6 }}>REASON (OPTIONAL)</label>
                          <textarea className="input-glass" placeholder="Describe your symptoms..." value={bookForm.reason} onChange={e => setBookForm(f => ({ ...f, reason: e.target.value }))} style={{ minHeight: 70, resize: 'vertical', fontFamily: 'Outfit, sans-serif', fontSize: 13 }} />
                        </div>
                        <button onClick={handleBookAppointment} disabled={!bookForm.doctor || !bookForm.date || !bookForm.time}
                          style={{ padding: '14px', background: (!bookForm.doctor || !bookForm.date || !bookForm.time) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: 12, color: (!bookForm.doctor || !bookForm.date || !bookForm.time) ? 'rgba(240,244,255,0.3)' : '#fff', fontWeight: 800, fontSize: 16, cursor: (!bookForm.doctor || !bookForm.date || !bookForm.time) ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Calendar size={17} /> Confirm Booking
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 5: AI Q&A */}
        <WidgetCard title="AI Health Assistant" icon={Brain} color="#8b5cf6">
          <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', marginBottom: 20 }}>
            Select a question to get an AI-powered answer tailored to your health profile.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: col('repeat(2, 1fr)'), gap: 12, marginBottom: 20 }}>
            {AI_QA.map(cat => (
              <div key={cat.category}>
                <button
                  onClick={() => setOpenCategory(openCategory === cat.category ? null : cat.category)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: openCategory === cat.category ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${openCategory === cat.category ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, cursor: 'pointer', color: openCategory === cat.category ? '#8b5cf6' : 'rgba(240,244,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', minHeight: 48 }}
                >
                  {cat.category}
                  <ChevronDown size={15} style={{ transform: openCategory === cat.category ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }} />
                </button>
                <AnimatePresence>
                  {openCategory === cat.category && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {cat.questions.map((qa, qi) => (
                          <button key={qi} onClick={() => setSelectedQ(selectedQ?.q === qa.q ? null : qa)}
                            style={{ textAlign: 'left', padding: '10px 14px', background: selectedQ?.q === qa.q ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedQ?.q === qa.q ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, cursor: 'pointer', color: 'rgba(240,244,255,0.8)', fontSize: 13, fontFamily: 'Outfit, sans-serif', lineHeight: 1.5, transition: 'all 0.2s', minHeight: 44 }}>
                            {selectedQ?.q === qa.q ? '▼ ' : '▷ '}{qa.q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <AnimatePresence>
            {selectedQ && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{ padding: '20px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, position: 'relative' }}>
                <button onClick={() => setSelectedQ(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,244,255,0.4)' }}><X size={16} /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>{selectedQ.q}</p>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.75)', lineHeight: 1.75 }}>{selectedQ.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </WidgetCard>

        {/* ── Row 6: Health Timeline ── */}
        <WidgetCard title="Patient Health Timeline" icon={Activity} color="#00ff88" style={{ marginTop: 20 }}>
          <PatientHealthTimeline />
        </WidgetCard>

      </main>
    </div>
  );
}
