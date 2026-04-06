import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, ScanFace, FileText, CheckCircle2, ChevronRight, Lock, 
  PlayCircle, Zap, Send, AlertCircle, BarChart3, 
  CreditCard, User, Building, Briefcase, Loader2, Video,
  Mail, ShieldCheck, Smartphone, Star, ArrowLeft, Key, LogOut, Inbox,
  Copy, Landmark, Clock, Send as SendIcon, Users, Check, XCircle, GraduationCap, Database
} from 'lucide-react';

// --- KONFIGURASI API GEMINI ---
const apiKey = ""; // Kunci API akan diinjeksikan secara otomatis oleh environment

export default function App() {
  const [appState, setAppState] = useState('landing'); 
  // States: landing, setup, interview, analyzing, report, checkout, payment_instructions, sending_notification, pending_verification, success, login, premium_dashboard, admin_dashboard
  
  // State Pengguna & SaaS
  const [isPremium, setIsPremium] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // State ADMIN & DATABASE SIMULASI
  const [pendingApprovals, setPendingApprovals] = useState([]); // Daftar antrean pembayaran
  const [approvedUsers, setApprovedUsers] = useState([]); // Daftar { email, password, type } pengguna aktif

  // State untuk Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // State untuk Setup Wawancara
  const [jobRole, setJobRole] = useState('Product Manager');
  const [company, setCompany] = useState('TechCorp');
  const [cvContext, setCvContext] = useState('Pengalaman 3 tahun di bidang pengembangan produk, memimpin tim lintas fungsi, dan meningkatkan retensi pengguna sebesar 20%.');
  
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewTurn, setInterviewTurn] = useState(0);
  const chatEndRef = useRef(null);
  
  const MAX_TURNS = isPremium ? 10 : 2; 
  const [report, setReport] = useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- FUNGSI API GEMINI ---
  const callGeminiAPI = async (promptText, systemInstruction, history = []) => {
    try {
      setIsLoading(true);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const contents = history.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: promptText }] });

      const payload = { contents, systemInstruction: { parts: [{ text: systemInstruction }] } };
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, terjadi kesalahan saat memproses respons.";
    } catch (error) {
      console.error("API Error:", error);
      return "Koneksi ke AI terputus. Silakan periksa jaringan Anda atau coba lagi. (" + error.message + ")";
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async () => {
    setAppState('interview');
    setMessages([]);
    setInterviewTurn(0);
    const systemPrompt = `Anda adalah seorang HRD Senior yang profesional dan kritis dari perusahaan ${company}. Anda sedang mewawancarai kandidat untuk posisi ${jobRole}. Profil kandidat: ${cvContext}. Tugas Anda saat ini: Sapalah kandidat, lalu ajukan 1 pertanyaan wawancara behavioral (berbasis metode STAR) yang tajam untuk memulai sesi. Jangan memberikan feedback atau saran di tahap ini. Gunakan Bahasa Indonesia yang profesional dan sedikit mengintimidasi.`;
    const initialPrompt = "Halo, saya siap untuk wawancara. Silakan mulai.";
    const aiResponse = await callGeminiAPI(initialPrompt, systemPrompt);
    setMessages([{ role: 'ai', text: aiResponse }]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const newMessages = [...messages, { role: 'user', text: currentInput }];
    setMessages(newMessages);
    setCurrentInput('');
    setInterviewTurn(prev => prev + 1);

    if (interviewTurn >= MAX_TURNS - 1) {
      setAppState('analyzing');
      const systemPrompt = `Anda adalah evaluator AI ahli untuk wawancara kerja. Berdasarkan riwayat wawancara berikut untuk posisi ${jobRole} di ${company}, berikan laporan ringkas. Format Laporan (Gunakan Markdown tebal untuk judul): **1. HR-Probability Score:** (Berikan estimasi persentase peluang lolos, misal: 75%) **2. Kekuatan Utama:** (1 paragraf singkat) **3. Area Perbaikan (Metode STAR):** (1 paragraf singkat tentang apa yang kurang spesifik dari jawaban mereka) Gunakan bahasa Indonesia yang profesional.`;
      const reportResponse = await callGeminiAPI("Sesi selesai. Buatkan laporan evaluasi kinerja saya secara detail.", systemPrompt, newMessages);
      setReport(reportResponse);
      setAppState('report');
    } else {
      const systemPrompt = `Anda adalah HRD dari perusahaan ${company} yang sedang mewawancarai posisi ${jobRole}. Kandidat baru saja menjawab pertanyaan Anda. Tugas: Tanggapi jawaban kandidat secara profesional (bisa pujian kecil atau catatan kritis jika kurang jelas), lalu ajukan pertanyaan lanjutan (follow-up question) yang lebih sulit. Jangan berikan evaluasi akhir.`;
      const aiResponse = await callGeminiAPI(currentInput, systemPrompt, messages);
      setMessages([...newMessages, { role: 'ai', text: aiResponse }]);
    }
  };

  // --- ALUR PEMBAYARAN B2C & B2B ---
  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!userEmail) return;
    setAppState('payment_instructions');
  };

  const handleNotifyAdmin = () => {
    setAppState('sending_notification');
    
    // Simulasi menambahkan email ke antrean Admin Dashboard
    setTimeout(() => {
      setPendingApprovals(prev => [...prev, { 
        email: userEmail, 
        date: new Date().toLocaleString('id-ID'),
        status: 'Menunggu Verifikasi Mutasi' 
      }]);
      setAppState('pending_verification');
    }, 2500);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Disalin ke clipboard: ' + text);
  };

  // --- ALUR ADMIN (OWNER DASHBOARD) ---
  const handleApprovePayment = (emailToApprove) => {
    const newPassword = generateRandomPassword();
    
    // Pindahkan dari antrean ke daftar user yang disetujui
    setApprovedUsers(prev => [...prev, { email: emailToApprove, password: newPassword, type: 'PRO' }]);
    setPendingApprovals(prev => prev.filter(item => item.email !== emailToApprove));
    
    // Simulasi sukses kirim email
    alert(`✅ Pembayaran disetujui!\n\nEmail otomatis telah dikirim ke: ${emailToApprove}\nPassword yang digenerate sistem: ${newPassword}\n\n(Catat password ini untuk testing login)`);
  };

  // --- ALUR LOGIN ---
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      // 1. Cek jika Admin/Owner yang Login
      if (loginEmail === 'hardihanto@gmail.com' && loginPassword === 'admin123') {
        setIsPremium(false);
        setUserEmail(loginEmail);
        setAppState('admin_dashboard');
        return;
      }
      
      // 2. Cek jika Pengguna (B2C/B2B) yang sudah di-approve
      const validUser = approvedUsers.find(u => u.email === loginEmail && u.password === loginPassword);
      
      if (validUser) {
        setIsPremium(true);
        setUserEmail(loginEmail);
        setAppState('premium_dashboard');
      } else {
        setLoginError('Kredensial tidak ditemukan, password salah, atau akun belum diverifikasi admin.');
      }
    }, 1000);
  };

  const handleLogout = () => {
    setIsPremium(false);
    setAppState('landing');
    setLoginEmail('');
    setLoginPassword('');
    setUserEmail('');
  };


  // --- RENDER VIEWS ---

  if (appState === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
        {/* Navbar */}
        <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-indigo-500" />
            <span className="font-bold tracking-tight text-white">InterviewMaster<span className="text-indigo-500">.ai</span></span>
          </div>
          <div className="flex items-center gap-4">
            {isPremium || userEmail === 'hardihanto@gmail.com' ? (
               <button onClick={() => setAppState(userEmail === 'hardihanto@gmail.com' ? 'admin_dashboard' : 'premium_dashboard')} className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700 flex items-center gap-2">
                 {userEmail === 'hardihanto@gmail.com' ? <Database size={16}/> : <User size={16}/>} Dashboard
               </button>
            ) : (
               <button onClick={() => setAppState('login')} className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent hover:bg-slate-900 transition-colors">
                 <Lock size={14}/> Login Area
               </button>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-16 px-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-0 w-full h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20 z-10 relative">
            <Bot size={40} className="text-white" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded border-2 border-slate-950">V 2.0</div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-center z-10 max-w-3xl leading-tight">
            Ubah Kecemasan Wawancara Menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Tawaran Kerja Nyata.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl text-center z-10 leading-relaxed">
            Platform simulasi wawancara kerja berbasis AI yang mengevaluasi metode STAR, kesesuaian kultur, dan intonasi secara *real-time*.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 z-10 w-full max-w-md mx-auto">
            <button onClick={() => setAppState('setup')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2">
              <PlayCircle size={20} /> Coba Gratis
            </button>
            <button onClick={() => alert('Fitur Hubungi Sales B2B')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-slate-700">
              <GraduationCap size={20} /> Solusi Kampus
            </button>
          </div>
        </div>

        {/* B2B & University Section */}
        <div className="py-16 bg-slate-900 border-y border-slate-800 relative z-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">Dipercaya Oleh Talenta & Institusi</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><User size={20}/></div>
                  <h3 className="font-bold text-lg">Untuk Individu (B2C)</h3>
                  <p className="text-sm text-slate-400">Latihan mandiri menghadapi HRD perusahaan impian dengan AI interaktif. Bayar per bulan untuk akses tak terbatas.</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><GraduationCap size={20}/></div>
                  <h3 className="font-bold text-lg">Untuk Universitas (B2B)</h3>
                  <p className="text-sm text-slate-400">Berikan akses Premium massal untuk seluruh mahasiswa tingkat akhir Anda melalui sistem *White-label* kami.</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400"><Building size={20}/></div>
                  <h3 className="font-bold text-lg">Untuk Perusahaan (B2B)</h3>
                  <p className="text-sm text-slate-400">Gunakan engine AI kami sebagai tahap screening otomatis pertama untuk ribuan pelamar masuk Anda.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- HALAMAN LOGIN (GATED ACCESS) ---
  if (appState === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 flex flex-col items-center justify-center relative">
        <button onClick={() => setAppState('landing')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition">
          <ArrowLeft size={20} /> Beranda
        </button>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
               <Lock size={28} className="text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Login Portal</h2>
          <p className="text-sm text-slate-400 text-center mb-8">Masuk sebagai Pengguna Pro atau Administrator Sistem.</p>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none" 
                />
              </div>
            </div>
            <button type="submit" disabled={isLoading || !loginEmail || !loginPassword} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={18}/> : 'Masuk Sistem'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            <p className="mb-2">Info Testing Prototype:</p>
            <p>Admin Login: <span className="font-mono text-slate-300">hardihanto@gmail.com</span></p>
            <p>Pass: <span className="font-mono text-slate-300">admin123</span></p>
          </div>
        </div>
      </div>
    );
  }

  // --- HALAMAN SETUP WAWANCARA ---
  if (appState === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 flex flex-col items-center justify-center relative">
        <button onClick={() => setAppState('landing')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl z-10 mt-12 md:mt-0">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><ScanFace className="text-indigo-500" /> Kalibrasi Konteks AI</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><Briefcase size={16} className="text-slate-500"/> Posisi yang Dilamar</label>
              <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><Building size={16} className="text-slate-500"/> Perusahaan Tujuan</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><FileText size={16} className="text-slate-500"/> Ringkasan Pengalaman / CV</label>
              <textarea value={cvContext} onChange={e => setCvContext(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none resize-none" />
            </div>
          </div>
          <button onClick={startInterview} className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
            {isLoading ? <Loader2 className="animate-spin" /> : <PlayCircle />} Mulai Wawancara {isPremium && 'Pro'}
          </button>
        </div>
      </div>
    );
  }

  // --- HALAMAN WAWANCARA ---
  if (appState === 'interview') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col md:flex-row p-4 md:p-6 gap-6">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative aspect-video md:aspect-[3/4] shadow-xl">
             <div className="absolute top-4 left-4 flex gap-2 z-20">
                <span className="bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-2 font-medium backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> REC
                </span>
                {isPremium && <span className="bg-indigo-500/20 text-indigo-400 text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 flex items-center gap-1 font-bold backdrop-blur-md">PRO MODE</span>}
             </div>
             <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-800 to-slate-900"></div>
               <User size={80} className="text-slate-600 mb-4 z-10" />
               <div className="absolute top-0 w-full h-1 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
             </div>
             <div className="absolute inset-0 border-[2px] border-indigo-500/10 rounded-3xl pointer-events-none"></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Detail Sesi</h3>
            <div className="space-y-2">
              <p className="text-white font-medium flex items-center gap-3"><Building size={18} className="text-indigo-500"/> HRD {company}</p>
              <p className="text-sm text-slate-400 flex items-center gap-3"><Briefcase size={18} className="text-slate-600"/> {jobRole}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Progres</span>
                <span className="text-xs text-indigo-400 font-bold">{interviewTurn} / {MAX_TURNS}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${(interviewTurn / MAX_TURNS) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl h-[70vh] md:h-auto">
          <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center"><Bot size={20} className="text-indigo-400" /></div>
              <div>
                <h3 className="font-bold text-white text-sm">AI HRD</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block"></span> Online</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl p-5 rounded-bl-sm border border-slate-700 flex items-center gap-3">
                  <Loader2 className="animate-spin text-indigo-400" size={18} />
                  <span className="text-sm text-slate-400 italic">Menganalisis...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
              <div className="relative">
                <textarea 
                  value={currentInput} onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder="Ketik jawaban Anda (Metode STAR)..." disabled={isLoading} rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none disabled:opacity-50"
                />
                <button type="submit" disabled={isLoading || !currentInput.trim()} className="absolute right-3 bottom-3 bg-indigo-600 hover:bg-indigo-500 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}} />
      </div>
    );
  }

  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-indigo-500 mb-6" size={48} />
        <h2 className="text-3xl font-extrabold text-white mb-3">Memproses Evaluasi...</h2>
      </div>
    );
  }

  // --- HALAMAN EVALUASI (PAYWALL JIKA TRIAL) ---
  if (appState === 'report') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 flex flex-col items-center py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-10 text-center">Hasil Kinerja Anda</h1>
        <div className="w-full max-w-5xl grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><BarChart3 size={20} /></div><h3 className="text-xl font-bold">Analisis AI</h3></div>
             <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
               <pre className="whitespace-pre-wrap font-sans text-sm md:text-base text-slate-300">{report}</pre>
             </div>
          </div>
          <div className="lg:col-span-2 bg-gradient-to-b from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl flex flex-col">
            {!isPremium ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase mb-6 w-max border border-indigo-500/30"><Lock size={12} /> Terbatas (Demo)</div>
                <h3 className="text-2xl font-bold mb-3 text-white">Ingin jaminan lolos?</h3>
                <p className="text-slate-400 text-sm mb-8">Buka akses premium untuk berlatih tanpa batasan hingga skor sempurna.</p>
                <div className="border-t border-slate-800/80 pt-8 mt-auto">
                  <div className="flex items-end gap-1 mb-5"><span className="text-3xl font-black text-white">Rp 99.000</span><span className="text-sm text-slate-500 mb-1">/bulan</span></div>
                  <button onClick={() => setAppState('checkout')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><CreditCard size={18} /> Upgrade Sekarang</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CheckCircle2 className="text-emerald-400 mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Simulasi Pro Selesai</h3>
                <button onClick={() => setAppState('premium_dashboard')} className="w-full bg-slate-800 border border-slate-700 text-white py-3 rounded-xl font-bold mt-6">Kembali ke Dashboard</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- HALAMAN CHECKOUT (INPUT EMAIL) ---
  if (appState === 'checkout') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 flex items-center justify-center relative">
        <button onClick={() => setAppState('landing')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Batal
        </button>

        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Bot size={24} className="text-indigo-500" />
            <span className="font-bold text-lg">InterviewMaster.ai Pro</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Pendaftaran Akun Pro</h2>
          <p className="text-slate-400 text-sm mb-8">Masukkan alamat email Anda. Akses login (username & password) akan dikirimkan ke email ini setelah Admin memverifikasi pembayaran Anda.</p>
          
          <form onSubmit={handleProceedToPayment} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email Aktif</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="admin@contoh.com" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 focus:outline-none" 
                />
              </div>
            </div>

            <button type="submit" disabled={!userEmail} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              Lanjut ke Pembayaran <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- HALAMAN INSTRUKSI PEMBAYARAN (MENAMPILKAN REKENING) ---
  if (appState === 'payment_instructions') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 flex flex-col items-center py-12 relative">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-slate-800/50 p-6 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Selesaikan Pembayaran</h2>
              <p className="text-sm text-slate-400">Total Tagihan: <span className="text-indigo-400 font-bold">Rp 99.000</span></p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <div className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold inline-flex items-center gap-1 border border-amber-500/30">
                <Clock size={12}/> Menunggu Transfer
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-sm text-slate-400 mb-4">Silakan transfer tepat <strong className="text-white">Rp 99.000</strong> ke salah satu rekening atau E-Wallet di bawah ini atas nama <strong className="text-white">Hardi Hanto</strong>:</p>
              
              <div className="space-y-4">
                {/* Bank BCA */}
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400"><Landmark size={24}/></div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Bank BCA</div>
                      <div className="font-mono text-lg text-white">5745452563</div>
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard('5745452563')} className="text-slate-400 hover:text-white p-2" title="Salin Rekening"><Copy size={18}/></button>
                </div>

                {/* Bank BSI */}
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400"><Landmark size={24}/></div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Bank BSI</div>
                      <div className="font-mono text-lg text-white">9897867570</div>
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard('9897867570')} className="text-slate-400 hover:text-white p-2" title="Salin Rekening"><Copy size={18}/></button>
                </div>

                {/* QRIS / E-Wallet */}
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-400"><Smartphone size={24}/></div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">DANA / ShopeePay</div>
                      <div className="font-mono text-lg text-white">081929009212</div>
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard('081929009212')} className="text-slate-400 hover:text-white p-2" title="Salin Nomor"><Copy size={18}/></button>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-indigo-300">
              <AlertCircle size={16} className="inline mr-2 mb-0.5"/> 
              Setelah mentransfer, klik tombol <strong>"Konfirmasi Pembayaran"</strong>. Sistem akan mengirim notifikasi antrean ke Admin. Bukti pembayaran akan dicek manual sebelum Admin men-generate akses login Anda.
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
               <button onClick={handleNotifyAdmin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2">
                 Konfirmasi Pembayaran <SendIcon size={18} />
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- HALAMAN MENGIRIM NOTIFIKASI KE ADMIN ---
  if (appState === 'sending_notification') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-indigo-500 mb-6" size={48} />
        <h2 className="text-2xl font-bold text-white mb-2">Mengirim Notifikasi ke Admin...</h2>
        <p className="text-slate-400 max-w-md">Menghubungi hardihanto@gmail.com untuk meminta verifikasi mutasi Anda.</p>
      </div>
    );
  }

  // --- HALAMAN MENUNGGU VERIFIKASI (PENDING MANUAL VERIFICATION) ---
  if (appState === 'pending_verification') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-amber-500">
          <Clock className="text-amber-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Menunggu Verifikasi Admin</h2>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          Permintaan Anda telah masuk ke dalam antrean sistem. Admin (<strong>hardihanto@gmail.com</strong>) akan segera mengecek mutasi bank Anda.
          <br /><br />
          Jika pembayaran valid, Anda akan menerima email berisi kredensial rahasia di: <strong className="text-white">{userEmail}</strong>.
        </p>

        <button onClick={() => setAppState('landing')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 px-8 rounded-xl font-bold transition-all">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // --- HALAMAN ADMIN DASHBOARD (OWNER PANEL) ---
  if (appState === 'admin_dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 relative">
        <nav className="max-w-6xl mx-auto py-6 flex justify-between items-center border-b border-slate-800 mb-8">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-indigo-500" />
            <span className="text-xl font-bold tracking-tight text-white">Owner Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400">Logged in as SuperAdmin</p>
              <p className="text-sm font-bold text-white">hardihanto@gmail.com</p>
            </div>
            <button onClick={handleLogout} className="bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-8">Dashboard Master SaaS</h1>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="text-slate-500 text-sm font-bold mb-2 flex items-center gap-2"><Users size={16}/> Total Pengguna Aktif</div>
              <div className="text-3xl font-black text-white">{approvedUsers.length}</div>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="text-slate-500 text-sm font-bold mb-2 flex items-center gap-2"><Clock size={16}/> Antrean Verifikasi</div>
              <div className="text-3xl font-black text-amber-400">{pendingApprovals.length}</div>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 md:col-span-2 bg-indigo-500/10 border-indigo-500/30">
              <div className="text-indigo-300 text-sm font-bold mb-2 flex items-center gap-2"><Landmark size={16}/> Estimasi Pendapatan Kotor</div>
              <div className="text-3xl font-black text-indigo-400">Rp {(approvedUsers.length * 99000).toLocaleString('id-ID')}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-10">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-400"/> Menunggu Verifikasi (Pending)
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Tanggal Permintaan</th>
                    <th className="px-6 py-4">Email Calon Pengguna</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        Tidak ada antrean pembayaran saat ini.
                      </td>
                    </tr>
                  ) : (
                    pendingApprovals.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">{user.date}</td>
                        <td className="px-6 py-4 font-bold text-white">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs">Cek Mutasi</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleApprovePayment(user.email)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 ml-auto transition-colors">
                            <Check size={14} /> Approve & Generate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400"/> Database Pengguna Aktif
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Email Pengguna</th>
                    <th className="px-6 py-4">Tipe Akun</th>
                    <th className="px-6 py-4">Password Akses</th>
                    <th className="px-6 py-4 text-right">Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {approvedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        Belum ada pengguna aktif.
                      </td>
                    </tr>
                  ) : (
                    approvedUsers.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                           <User size={14} className="text-slate-500"/> {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded text-xs font-bold">{user.type}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-emerald-400">{user.password}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => {
                            setApprovedUsers(prev => prev.filter(u => u.email !== user.email));
                          }} className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 ml-auto">
                            <XCircle size={14} /> Cabut Akses
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- HALAMAN PREMIUM DASHBOARD (GATED UNTUK USER) ---
  if (appState === 'premium_dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 relative">
        <nav className="max-w-6xl mx-auto py-6 flex justify-between items-center border-b border-slate-800 mb-8">
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-indigo-500" />
            <span className="text-xl font-bold tracking-tight">InterviewMaster<span className="text-indigo-500">.ai</span></span>
            <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded font-bold ml-2 shadow-[0_0_10px_rgba(79,70,229,0.5)]">PRO</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-bold text-white">{loginEmail}</p>
            </div>
            <button onClick={handleLogout} className="bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Ruang Pelatihan Eksekutif 🚀</h1>
          <p className="text-slate-400 mb-10">Batas sesi dicabut. Akses analitik penuh. Sistem siap untuk melatih Anda memenangkan tawaran kerja.</p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                  <PlayCircle size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Simulasi Mendalam (Sesi 10 Pertanyaan)</h3>
                <p className="text-indigo-200/70 text-sm mb-6 max-w-md">Latihan wawancara intensif. AI akan menekan Anda dengan pertanyaan lanjutan yang sangat tajam layaknya HRD dan User (Direksi).</p>
                <button onClick={() => setAppState('setup')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg flex items-center gap-2">
                  Setup Simulasi Baru <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-colors">
               <div>
                 <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4"><BarChart3 size={20} /></div>
                 <h3 className="text-lg font-bold text-white mb-2">Laporan Analitik</h3>
                 <p className="text-slate-400 text-sm">Lihat metrik perkembangan skor STAR Anda dari waktu ke waktu.</p>
               </div>
            </div>

            <div className="col-span-1 md:col-span-3 bg-slate-900 border border-slate-800 p-8 rounded-3xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors">
               <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0"><FileText size={24} /></div>
                 <div>
                   <h3 className="text-lg font-bold text-white mb-1">Optimasi CV Automatis (Segera Hadir)</h3>
                   <p className="text-slate-400 text-sm">Sesuaikan CV Anda agar 99% lolos sistem *Applicant Tracking System* (ATS) berbasis keyword.</p>
                 </div>
               </div>
               <div className="hidden md:flex text-sm font-bold text-slate-500 items-center gap-1 border border-slate-800 px-3 py-1.5 rounded-full">Coming Soon</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
