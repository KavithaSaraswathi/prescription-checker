import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, BadgeCheck, Beaker, Check, ChevronDown, Clock3,
  FileCheck2, FileImage, FileSearch, History, Home, Menu, Microscope,
  Pill, Search, ShieldCheck, Sparkles, Stethoscope, UploadCloud, X,
} from 'lucide-react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'

const scoreMap = {
  likely_authentic: { label: 'Likely authentic', tone: 'good', icon: BadgeCheck },
  needs_review: { label: 'Needs review', tone: 'warning', icon: AlertTriangle },
  high_risk: { label: 'High risk', tone: 'danger', icon: AlertTriangle },
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB'
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function App() {
  const [view, setView] = useState('home')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [historySort, setHistorySort] = useState('newest')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { fetchHistory() }, [])

  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(''); return undefined }
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/history`)
      const data = await response.json()
      setHistory(data.history || [])
    } catch (fetchError) {
      console.error('History load failed', fetchError)
    }
  }

  const chooseFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file such as JPG, PNG, or WEBP.')
      return
    }
    setError('')
    setSelectedFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedFile) return
    setLoading(true)
    setError('')
    const form = new FormData()
    form.append('image', selectedFile)
    form.append('notes', notes)

    try {
      const response = await fetch(`${API_BASE}/api/analyze-prescription`, { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Prescription analysis failed.')
      setResult(data)
      setView('results')
      setToast('Prescription analyzed successfully')
      fetchHistory()
    } catch (submitError) {
      console.error('Upload failed', submitError)
      setError(submitError.message || 'Prescription analysis failed. Please try again.')
      setToast('Analysis could not be completed')
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => { setSelectedFile(null); setError('') }

  const scoreMeta = useMemo(() => scoreMap[result?.authenticity_score] || scoreMap.likely_authentic, [result])
  const ScoreIcon = scoreMeta.icon

  const filteredHistory = useMemo(() => {
    const filtered = history.filter((entry) => {
      const document = entry.document || {}
      const medicines = document.medicines || []
      const haystack = `${entry.image_name || ''} ${medicines.map((item) => item.matched_name || item.drug_name).join(' ')}`.toLowerCase()
      const queryMatch = haystack.includes(historyQuery.toLowerCase())
      const statusMatch = historyFilter === 'all' || entry.authenticity_score === historyFilter
      return queryMatch && statusMatch
    })
    return [...filtered].sort((a, b) => historySort === 'newest'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at))
  }, [history, historyFilter, historyQuery, historySort])

  const navigate = (nextView) => { setView(nextView); setMenuOpen(false) }

  const renderTopbar = () => (
    <header className="topbar">
      <button className="brand" onClick={() => navigate('home')} aria-label="Go to MediVerify home">
        <span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.6} /></span>
        <span>Medi<span>Verify</span></span>
      </button>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
        {[["home", "Home", Home], ["upload", "Upload", UploadCloud], ["results", "Results", FileSearch], ["history", "History", History]].map(([key, label, Icon]) => (
          <button key={key} className={view === key ? 'nav active' : 'nav'} onClick={() => navigate(key)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>
      <button className="header-action" onClick={() => navigate('upload')}><UploadCloud size={16} /> New check</button>
    </header>
  )

  const renderHome = () => (
    <main className="page-shell home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> AI-assisted prescription screening</div>
          <h1>Understand your prescription, <em>with confidence.</em></h1>
          <p className="lead">Turn a handwritten or photographed prescription into a clear review of medicines, dosage ranges, timing, and possible interactions.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => navigate('upload')}>Check a prescription <ArrowRight size={17} /></button>
            <button className="secondary" onClick={() => navigate('history')}>View history</button>
          </div>
          <div className="trust-line"><ShieldCheck size={17} /> Your prescription stays in your local review workflow.</div>
        </div>
        <div className="hero-visual" aria-label="Prescription analysis preview">
          <div className="visual-glow" />
          <div className="prescription-sheet">
            <div className="sheet-top"><span>MEDICAL PRESCRIPTION</span><span className="sheet-dot" /></div>
            <div className="doctor-line"><div className="avatar"><Stethoscope size={19} /></div><div><strong>Dr. Anika Rao</strong><small>General medicine · 06 Sep 2026</small></div></div>
            <div className="scribble scribble-wide" /><div className="scribble scribble-mid" /><div className="scribble scribble-short" />
            <div className="sheet-med"><Pill size={16} /><span>Medicine & dosage review</span><Check size={15} /></div>
            <div className="sheet-footer"><span>Patient copy</span><span>MV · 2026</span></div>
          </div>
          <div className="float-chip chip-detected"><span className="status-dot" /> Prescription detected</div>
          <div className="float-chip chip-medicine"><Pill size={14} /> Medicine identified</div>
          <div className="float-chip chip-check"><BadgeCheck size={14} /> Interaction check complete</div>
        </div>
      </section>
      <section className="feature-section">
        <div className="section-heading"><div><span className="kicker">A clearer way to review</span><h2>Everything you need, in one calm view.</h2></div><span className="section-count">04 / FEATURES</span></div>
        <div className="feature-grid">
          {[[FileCheck2, 'Medicine recognition', 'Matches typed and handwritten names to a local medicine reference.'], [Beaker, 'Dosage review', 'Highlights doses that sit outside the available reference range.'], [AlertTriangle, 'Interaction warnings', 'Surfaces known pairings that may need pharmacist review.'], [History, 'Prescription history', 'Keep every complete prescription check together in one timeline.']].map(([Icon, title, body]) => <article className="feature-card" key={title}><span className="feature-icon"><Icon size={20} /></span><h3>{title}</h3><p>{body}</p><ArrowRight size={17} className="feature-arrow" /></article>)}
        </div>
      </section>
      <section className="how-section"><div className="section-heading"><div><span className="kicker">Simple by design</span><h2>How MediVerify works</h2></div></div><div className="steps"><div><span>01</span><UploadCloud size={21} /><h3>Upload</h3><p>Add a clear prescription photo.</p></div><div><span>02</span><Microscope size={21} /><h3>Analyze</h3><p>AI reads and checks the details.</p></div><div><span>03</span><ShieldCheck size={21} /><h3>Review</h3><p>See medicines, cautions, and context.</p></div></div></section>
      <div className="footer-disclaimer"><ShieldCheck size={17} /><span>AI-assisted screening only — not a substitute for a licensed pharmacist or doctor.</span></div>
    </main>
  )

  const renderUpload = () => (
    <main className="page-shell narrow upload-page">
      <div className="page-intro"><div><span className="kicker">NEW REVIEW</span><h1>Upload your prescription</h1><p>Give MediVerify a clear image and we’ll organize the details for a quick review.</p></div><span className="step-badge">Step 1 <ChevronDown size={15} /></span></div>
      <div className="upload-layout">
        <form onSubmit={handleSubmit} className="upload-card">
          {!selectedFile ? <label className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]) }}><input type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} /><span className="upload-icon"><UploadCloud size={28} /></span><strong>Drop your prescription here</strong><span>or <u>browse files</u></span><small>JPG, PNG, or WEBP · up to 10 MB</small></label> : <div className="file-selected"><div className="file-preview">{previewUrl ? <img src={previewUrl} alt="Selected prescription preview" /> : <FileImage size={30} />}</div><div className="file-details"><strong>{selectedFile.name}</strong><span>{formatBytes(selectedFile.size)} · Ready to analyze</span><div className="file-ready"><Check size={13} /> Image selected</div></div><button type="button" className="icon-button" onClick={clearFile} aria-label="Remove selected image"><X size={18} /></button></div>}
          {selectedFile && previewUrl && <img src={previewUrl} alt="Prescription preview" className="large-preview" />}
          <div className="notes-field"><label htmlFor="notes">Optional context <span>Recommended if the image is unclear</span></label><textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="4" placeholder="Add patient notes or context for this review" /></div>
          <button type="submit" className="primary analyze-button" disabled={!selectedFile || loading}>{loading ? <><span className="spinner" /> Analyzing prescription...</> : <>Analyze prescription <ArrowRight size={17} /></>}</button>
          {error && <p className="upload-error" role="alert"><AlertTriangle size={17} /> {error}</p>}
        </form>
        <aside className="upload-aside"><div className="aside-icon"><ShieldCheck size={21} /></div><h3>Designed for careful review</h3><p>Results help you prepare questions for a qualified pharmacist or doctor. They do not replace clinical advice.</p><div className="aside-rule" /><div className="aside-stat"><strong>100%</strong><span>of your check is saved as one complete record.</span></div></aside>
      </div>
    </main>
  )

  const renderResults = () => {
    if (!result) return <main className="page-shell empty-state"><FileSearch size={32} /><h2>No analysis yet</h2><p>Upload a prescription to see the review dashboard.</p><button className="primary" onClick={() => navigate('upload')}>Start a check <ArrowRight size={17} /></button></main>
    return <main className="page-shell results-page"><div className="page-intro"><div><span className="kicker">ANALYSIS REPORT</span><h1>Prescription review</h1><p>One complete review, organized for fast scanning.</p></div><button className="secondary" onClick={() => navigate('upload')}><UploadCloud size={16} /> New analysis</button></div><section className="status-banner"><div className={`status-icon ${scoreMeta.tone}`}><ScoreIcon size={23} /></div><div><span className="status-label">Safety status</span><h2>{scoreMeta.label}</h2><p>{result.risk_explanation}</p></div><div className="confidence"><strong>{result.confidence_score ? `${Math.round(result.confidence_score * 100)}%` : '—'}</strong><span>analysis confidence</span></div></section><section className="results-grid"><div className="main-result-column"><div className="result-section"><div className="result-heading"><div><span className="kicker">MEDICINES</span><h2>Detected medicines</h2></div><span className="result-count">{result.medicines?.length || 0} found</span></div><div className="medicine-grid">{result.medicines?.map((medicine, index) => <article className="medicine-card" key={`${medicine.matched_name}-${index}`}><div className="medicine-card-top"><span className="medicine-symbol"><Pill size={18} /></span><span className={medicine.match_status === 'not_matched' ? 'mini-status caution' : 'mini-status good'}>{medicine.match_status === 'not_matched' ? 'Review match' : 'Recognized'}</span></div><h3>{medicine.matched_name}</h3>{medicine.match_status === 'not_matched' && <p className="match-warning">Confirm this medicine with a pharmacist.</p>}<div className="medicine-facts"><span><small>Dosage</small><strong>{medicine.dosage}</strong></span><span><small>Frequency</small><strong>{medicine.frequency}</strong></span><span><small>Duration</small><strong>{medicine.duration}</strong></span></div><div className="confidence-line"><span>Reading confidence</span><strong>{Math.round((medicine.confidence || 0) * 100)}%</strong></div><div className="confidence-bar"><span style={{ width: `${Math.round((medicine.confidence || 0) * 100)}%` }} /></div></article>)}</div></div><div className="result-section interaction-section"><div className="result-heading"><div><span className="kicker">SAFETY CHECK</span><h2>Interaction warnings</h2></div><AlertTriangle size={20} className="heading-alert" /></div>{result.drug_interactions?.length ? result.drug_interactions.map((warning, index) => <div className="warning-card" key={`${warning.drug_a}-${warning.drug_b}-${index}`}><div className="warning-mark"><AlertTriangle size={18} /></div><div><strong>{warning.drug_a} + {warning.drug_b}</strong><p>{warning.warning}</p><small>{warning.description}</small></div></div>) : <div className="clear-state"><BadgeCheck size={20} /><span>No known interactions were detected in the current local dataset.</span></div>}</div></div><aside className="result-side-column"><div className="side-card insight-card"><span className="side-card-icon"><Stethoscope size={19} /></span><span className="kicker">POSSIBLE CONDITION INSIGHTS</span><h3>What this combination may suggest</h3><p>{result.possible_condition}</p><small>AI-generated inference — not a medical diagnosis.</small></div><div className="side-card timing-card"><span className="side-card-icon"><Clock3 size={19} /></span><span className="kicker">TIMING GUIDE</span><h3>When to take each medicine</h3><ul>{result.medicines?.map((medicine, index) => <li key={`${medicine.matched_name}-timing-${index}`}><strong>{medicine.matched_name}</strong><span>{medicine.frequency}, {medicine.food_instruction}, for {medicine.duration}</span></li>)}</ul></div><div className="side-card raw-card"><span className="kicker">EXTRACTED TEXT</span><pre>{result.raw_extracted_text || 'No extracted text available yet.'}</pre></div></aside></section><div className="footer-disclaimer"><ShieldCheck size={17} /><span>{result.disclaimer}</span></div></main>
  }

  const renderHistory = () => <main className="page-shell history-page"><div className="page-intro"><div><span className="kicker">YOUR RECORDS</span><h1>Prescription history</h1><p>Every review, kept together as one complete document.</p></div><button className="primary" onClick={() => navigate('upload')}><UploadCloud size={17} /> New check</button></div><div className="history-toolbar"><div className="search-box"><Search size={18} /><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search by file or medicine..." /></div><select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option value="all">All statuses</option><option value="likely_authentic">Likely authentic</option><option value="needs_review">Needs review</option><option value="high_risk">High risk</option></select><select value={historySort} onChange={(event) => setHistorySort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>{filteredHistory.length ? <div className="history-table"><div className="history-table-head"><span>Prescription</span><span>Medicines</span><span>Confidence</span><span>Status</span><span /></div>{filteredHistory.map((entry) => { const document = entry.document || {}; const medicines = document.medicines || []; const meta = scoreMap[entry.authenticity_score] || scoreMap.likely_authentic; return <article className="history-row" key={entry.id}><div className="history-file"><span className="history-file-icon"><FileImage size={18} /></span><div><strong>{entry.image_name || `Prescription ${entry.id}`}</strong><small>{new Date(entry.created_at).toLocaleString()}</small></div></div><span className="medicine-total"><strong>{medicines.length}</strong> detected</span><span className="history-confidence">{entry.confidence_score ? `${Math.round(entry.confidence_score * 100)}%` : '—'}</span><span className={`history-status ${meta.tone}`}><span /> {meta.label}</span><button className="view-button" onClick={() => { setResult(document); navigate('results') }}>View results <ArrowRight size={15} /></button></article> })}</div> : <div className="empty-history"><span><History size={25} /></span><h2>{history.length ? 'No matching records' : 'Your history is clear'}</h2><p>{history.length ? 'Try another search or filter.' : 'Analyzed prescriptions will appear here as complete records.'}</p>{!history.length && <button className="secondary" onClick={() => navigate('upload')}>Analyze your first prescription <ArrowRight size={16} /></button>}</div>}</main>

  return <div className="app-shell">{renderTopbar()}{view === 'home' && renderHome()}{view === 'upload' && renderUpload()}{view === 'results' && renderResults()}{view === 'history' && renderHistory()}{toast && <div className="toast"><Check size={17} /> {toast}</div>}</div>
}

export default App
