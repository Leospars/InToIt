import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { MOODLE_DEMO } from '../lib/lms';

const D = { bg: '#0a0a0f', surface: '#13131a', card: '#16161f', border: 'rgba(255,255,255,0.08)', text: '#e8e8f0', muted: 'rgba(255,255,255,0.4)' };

type Step = 'choose_lms' | 'connect' | 'pick_course' | 'pick_topics' | 'generating' | 'error';

export function LMSConnect() {
  const store = useStore();
  const { profile, lmsCourses, lmsTopicsMap, lmsConnecting, lmsError, genProgress } = store;
  const hasKey = !!profile.openAiKey;

  const [step, setStep] = useState<Step>(() => {
    if (profile.lmsConfig.connected && Object.keys(profile.loadedCourses).length > 0) return 'pick_course';
    if (profile.lmsConfig.connected) return 'pick_course';
    return 'choose_lms';
  });

  const [lmsType, setLmsType] = useState<'moodle' | 'canvas'>('moodle');
  const [baseUrl, setBaseUrl] = useState(profile.lmsConfig.baseUrl || '');
  const [token, setToken] = useState('');
  const [openAiKey, setOpenAiKey] = useState(profile.openAiKey || '');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [connectError, setConnectError] = useState('');

  // Fetch courses once connected
  useEffect(() => {
    if (profile.lmsConfig.connected && lmsCourses.length === 0) {
      store.fetchLMSCourses();
    }
  }, [profile.lmsConfig.connected]);

  // Auto-fetch topics when course selected
  useEffect(() => {
    if (selectedCourseId && !lmsTopicsMap[selectedCourseId]) {
      store.fetchLMSTopics(selectedCourseId);
    }
  }, [selectedCourseId]);

  async function handleConnect() {
    setConnectError('');
    if (openAiKey) store.setKeys({ openAiKey });
    try {
      await store.connectLMS(lmsType, baseUrl.trim(), token.trim());
      setStep('pick_course');
      await store.fetchLMSCourses();
    } catch (e: any) {
      setConnectError(e?.message ?? 'Connection failed');
    }
  }

  async function handleGenerate() {
    const lmsCourse = lmsCourses.find(c => c.id === selectedCourseId);
    if (!lmsCourse) return;
    if (!profile.openAiKey && !openAiKey) { setConnectError('OpenAI API key required to generate content'); return; }
    if (openAiKey) store.setKeys({ openAiKey });
    setStep('generating');
    try {
      // Ensure topics are fetched
      if (!lmsTopicsMap[selectedCourseId]) await store.fetchLMSTopics(selectedCourseId);
      await store.generateFromLMS(lmsCourse);
      // Success — store navigates to 'home'
    } catch (e: any) {
      setStep('error');
      setConnectError(e?.message ?? 'Generation failed');
    }
  }

  const T = D;
  const topics = lmsTopicsMap[selectedCourseId] ?? [];
  const selectedCourse = lmsCourses.find(c => c.id === selectedCourseId);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Mono', monospace" }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', Impact", fontSize: 52, letterSpacing: 6, color: '#fff', lineHeight: 1 }}>INTOIT</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, marginTop: 4 }}>ADAPTIVE LEARNING — LMS EDITION</div>
      </div>

      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* ── STEP 1: Choose LMS ── */}
        {step === 'choose_lms' && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 36 }}>
            <div style={{ fontFamily: "'Bebas Neue', Impact", fontSize: 22, letterSpacing: 3, color: '#fff', marginBottom: 6 }}>CONNECT YOUR LMS</div>
            <div style={{ color: T.muted, fontSize: 12, marginBottom: 28, lineHeight: 1.7 }}>
              Connect to your university learning platform. INTOIT will scan your courses and generate adaptive content for each topic you need to study.
            </div>

            {/* LMS type selector */}
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 10 }}>SELECT YOUR PLATFORM</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {([
                { type: 'moodle' as const, label: 'Moodle', desc: 'Most universities worldwide', icon: '🎓' },
                { type: 'canvas' as const, label: 'Canvas', desc: 'Common in US/Australia', icon: '📐' },
              ]).map(({ type, label, desc, icon }) => (
                <button key={type} onClick={() => { setLmsType(type); if (type === 'moodle') setBaseUrl(MOODLE_DEMO.baseUrl); else setBaseUrl(''); }}
                  style={{ padding: '16px 14px', borderRadius: 12, border: `1.5px solid ${lmsType === type ? '#6366f1' : T.border}`, background: lmsType === type ? 'rgba(99,102,241,0.12)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontFamily: "'Bebas Neue', Impact", fontSize: 15, letterSpacing: 2, color: lmsType === type ? '#818cf8' : '#fff' }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>

            {/* URL field */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>
                {lmsType === 'moodle' ? 'MOODLE URL' : 'CANVAS URL'}
              </div>
              <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                placeholder={lmsType === 'moodle' ? 'https://sandbox.moodledemo.net' : 'https://canvas.instructure.com'}
                style={{ width: '100%', background: '#0c0c10', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box' }} />
              {lmsType === 'moodle' && (
                <button onClick={() => setBaseUrl(MOODLE_DEMO.baseUrl)} style={{ marginTop: 6, fontSize: 10, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", padding: 0 }}>
                  → Use Moodle demo sandbox
                </button>
              )}
            </div>

            {/* Token field */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>ACCESS TOKEN</div>
              <input value={token} onChange={e => setToken(e.target.value)}
                placeholder={lmsType === 'moodle' ? 'Moodle web service token' : 'Canvas access token'}
                type="password"
                style={{ width: '100%', background: '#0c0c10', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', marginBottom: 4 }} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
                {lmsType === 'moodle'
                  ? MOODLE_DEMO.tokenHint
                  : 'Canvas: Account → Settings → + New Access Token'}
              </div>
            </div>

            {/* OpenAI key */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>OPENAI API KEY <span style={{ color: '#ef4444' }}>*required to generate content</span></div>
              <input value={openAiKey} onChange={e => setOpenAiKey(e.target.value)}
                placeholder="sk-..." type="password"
                style={{ width: '100%', background: '#0c0c10', border: `1px solid ${openAiKey ? 'rgba(16,185,129,0.4)' : T.border}`, borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: "'DM Mono', monospace", boxSizing: 'border-box', marginBottom: 4 }} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>platform.openai.com — stored in browser only</div>
            </div>

            {connectError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#f87171' }}>
                ⚠️ {connectError}
              </div>
            )}

            <button onClick={handleConnect} disabled={!baseUrl || !token || lmsConnecting}
              style={{ width: '100%', padding: 13, borderRadius: 10, background: !baseUrl || !token || lmsConnecting ? 'rgba(255,255,255,0.05)' : '#6366f1', border: 'none', color: !baseUrl || !token || lmsConnecting ? T.muted : '#fff', fontFamily: "'Bebas Neue', Impact", fontSize: 17, letterSpacing: 2, cursor: !baseUrl || !token || lmsConnecting ? 'not-allowed' : 'pointer' }}>
              {lmsConnecting ? '⏳ CONNECTING...' : 'CONNECT →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Pick course ── */}
        {step === 'pick_course' && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>🎓</span>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', Impact", fontSize: 18, letterSpacing: 3, color: '#fff' }}>
                  {profile.lmsConfig.institutionName ?? 'Connected'}
                </div>
                <div style={{ fontSize: 10, color: '#10b981' }}>✓ {profile.lmsConfig.type?.toUpperCase()} CONNECTED</div>
              </div>
              <button onClick={store.disconnectLMS} style={{ marginLeft: 'auto', fontSize: 10, color: T.muted, background: 'none', border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>Disconnect</button>
            </div>

            <div style={{ color: T.muted, fontSize: 12, marginBottom: 24, lineHeight: 1.7 }}>
              Select a course to import. INTOIT will scan its topics and use AI to generate lesson content, quizzes, and analogies for each one.
            </div>

            {lmsConnecting ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: T.muted, fontSize: 12 }}>⏳ Loading your courses...</div>
            ) : lmsCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>No enrolled courses found.</div>
                <button onClick={store.fetchLMSCourses} style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>↺ Retry</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 20 }}>
                {lmsCourses.map(course => {
                  const isSelected = selectedCourseId === course.id;
                  const isLoaded = !!profile.loadedCourses[course.id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)];
                  return (
                    <div key={course.id} onClick={() => setSelectedCourseId(course.id)}
                      style={{ padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${isSelected ? '#6366f1' : T.border}`, background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, color: isSelected ? '#c7d2fe' : '#fff', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{course.name}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{course.shortName}{course.categoryName ? ` · ${course.categoryName}` : ''}</div>
                      </div>
                      {isLoaded && <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '2px 8px', letterSpacing: 1 }}>LOADED</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Topic preview */}
            {selectedCourseId && topics.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 8 }}>TOPICS FOUND ({topics.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {topics.slice(0, 15).map((t, i) => (
                    <div key={t.id} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#6366f1', minWidth: 18 }}>{i + 1}.</span>
                      <span>{t.name}</span>
                    </div>
                  ))}
                  {topics.length > 15 && <div style={{ fontSize: 10, color: T.muted }}>+{topics.length - 15} more topics...</div>}
                </div>
              </div>
            )}

            {selectedCourseId && topics.length === 0 && !lmsConnecting && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: T.muted, fontSize: 12, marginBottom: 20 }}>
                ⏳ Fetching topics...
              </div>
            )}

            {connectError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#f87171' }}>
                ⚠️ {connectError}
              </div>
            )}

            <button onClick={handleGenerate}
              disabled={!selectedCourseId || topics.length === 0 || (!profile.openAiKey && !openAiKey)}
              style={{ width: '100%', padding: 13, borderRadius: 10, background: selectedCourseId && topics.length > 0 && (profile.openAiKey || openAiKey) ? 'linear-gradient(90deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.05)', border: 'none', color: selectedCourseId && topics.length > 0 ? '#fff' : T.muted, fontFamily: "'Bebas Neue', Impact", fontSize: 17, letterSpacing: 2, cursor: selectedCourseId && topics.length > 0 ? 'pointer' : 'not-allowed' }}>
              {!profile.openAiKey && !openAiKey ? '⚠️ OPENAI KEY REQUIRED' : selectedCourseId && topics.length > 0 ? `GENERATE ${topics.length} TOPICS →` : 'SELECT A COURSE FIRST'}
            </button>

            {(!profile.openAiKey && !openAiKey) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>OPENAI API KEY</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={openAiKey} onChange={e => setOpenAiKey(e.target.value)} placeholder="sk-..." type="password"
                    style={{ flex: 1, background: '#0c0c10', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, fontFamily: "'DM Mono', monospace" }} />
                  <button onClick={() => store.setKeys({ openAiKey })} style={{ padding: '8px 14px', borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>Save</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Generating ── */}
        {step === 'generating' && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <div style={{ fontFamily: "'Bebas Neue', Impact", fontSize: 24, letterSpacing: 3, color: '#fff', marginBottom: 8 }}>GENERATING YOUR COURSE</div>
            <div style={{ color: T.muted, fontSize: 12, marginBottom: 28, lineHeight: 1.7 }}>
              AI is reading your {profile.lmsConfig.type?.toUpperCase()} topics and generating lesson content, quizzes, analogies, and ELI5 explanations for each one.
            </div>

            {/* Progress bar */}
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: 99, transition: 'width 0.5s', width: genProgress.total > 0 ? `${(genProgress.current / genProgress.total) * 100}%` : '5%' }} />
            </div>

            <div style={{ fontSize: 13, color: '#818cf8', fontFamily: "'Bebas Neue', Impact", letterSpacing: 2, marginBottom: 6 }}>
              {genProgress.current} / {genProgress.total} TOPICS
            </div>

            {genProgress.currentTopic && (
              <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Mono', monospace" }}>
                Generating: {genProgress.currentTopic}
              </div>
            )}

            <div style={{ marginTop: 24, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 11, color: T.muted, textAlign: 'left', lineHeight: 1.7 }}>
              <div>✅ Lesson content + key formula</div>
              <div>✅ Quiz questions (normal + hard difficulty)</div>
              <div>✅ ELI5 simplified explanation</div>
              <div>✅ Knowledge graph prerequisites</div>
              <div>✅ YouTube search queries</div>
            </div>
          </div>
        )}

        {/* ── STEP: Error ── */}
        {step === 'error' && (
          <div style={{ background: T.card, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: "'Bebas Neue', Impact", fontSize: 22, letterSpacing: 3, color: '#f87171', marginBottom: 8 }}>GENERATION FAILED</div>
            <div style={{ color: T.muted, fontSize: 12, marginBottom: 24 }}>{connectError || genProgress.error}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setStep('pick_course')} style={{ padding: '10px 24px', borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', fontFamily: "'Bebas Neue', Impact", fontSize: 14, letterSpacing: 2, cursor: 'pointer' }}>TRY AGAIN</button>
              <button onClick={() => setStep('choose_lms')} style={{ padding: '10px 24px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer' }}>Back</button>
            </div>
          </div>
        )}

        {/* Already have courses loaded */}
        {step === 'choose_lms' && Object.keys(profile.loadedCourses).length > 0 && (
          <button onClick={() => store.setScreen('home')}
            style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 10, background: 'transparent', border: `1px solid ${D.border}`, color: D.muted, fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer' }}>
            → Continue with existing courses ({Object.keys(profile.loadedCourses).length} loaded)
          </button>
        )}
      </div>
    </div>
  );
}
