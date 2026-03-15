"use strict";
/**
 * frontend/src/hooks/useBrain.ts  v2
 *
 * Complete knowledge graph hook.
 * Covers all three layers + BKT scores + mistake pattern tracking.
 *
 * Drop-in usage:
 *   const brain = useBrain()
 *
 *   // On every question answer:
 *   const intervention = await brain.logAnswer({
 *     questionRef: "q:12",
 *     conceptSlug: "retrieval-chunking",
 *     isCorrect: false,
 *     difficulty: 3,
 *     wrongAnswer: "cosine similarity is not symmetric",  // ← key for mistake tracking
 *     mistakeType: "confuses_concepts",                   // ← optional classification
 *   })
 *   // intervention is non-null when BKT triggers — show InterventionCard
 *   // brain.activeCourseOutline is auto-fetched on wrong answers
 *
 *   // On content view:
 *   await brain.logView("lesson:3", "prompt-chaining")
 *
 *   // Force intervention for any concept:
 *   const result = await brain.generate("rag-basics")
 *
 *   // For D3 Atlas mastery coloring:
 *   const score = brain.getBKT("vector-similarity")  // 0-1
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBrain = useBrain;
var react_1 = require("react");
var auth_context_1 = require("../context/auth-context");
var API = (_a = import.meta.env.VITE_API_URL) !== null && _a !== void 0 ? _a : "http://localhost:8000";
// ── Safe fetch ────────────────────────────────────────────────
function call(path_1) {
    return __awaiter(this, arguments, void 0, function (path, options, token) {
        var headers, res, text, data, msg;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    headers = __assign({ "Content-Type": "application/json" }, options.headers);
                    if (token)
                        headers["Authorization"] = "Bearer ".concat(token);
                    return [4 /*yield*/, fetch("".concat(API).concat(path), __assign(__assign({}, options), { headers: headers }))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.text()];
                case 2:
                    text = _a.sent();
                    if (!text.trim())
                        throw new Error("Empty response (HTTP ".concat(res.status, ") from ").concat(path));
                    try {
                        data = JSON.parse(text);
                    }
                    catch (_b) {
                        throw new Error("Bad JSON from ".concat(path, ": ").concat(text.slice(0, 120)));
                    }
                    if (!res.ok) {
                        msg = data === null || data === void 0 ? void 0 : data.detail;
                        throw new Error(typeof msg === "string" ? msg : "Request failed (".concat(res.status, ")"));
                    }
                    return [2 /*return*/, data];
            }
        });
    });
}
function getQueue() {
    try {
        return JSON.parse(localStorage.getItem("brain_queue") || "[]");
    }
    catch (_a) {
        return [];
    }
}
function saveQueue(q) {
    try {
        localStorage.setItem("brain_queue", JSON.stringify(q.slice(-50)));
    }
    catch (_a) { }
}
// ── Main hook ─────────────────────────────────────────────────
function useBrain() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g;
    var session = (0, auth_context_1.useAuth)().session;
    var token = session === null || session === void 0 ? void 0 : session.access_token;
    var _h = (0, react_1.useState)(null), profile = _h[0], setProfile = _h[1];
    var _j = (0, react_1.useState)([]), conceptStates = _j[0], setConceptStates = _j[1];
    var _k = (0, react_1.useState)([]), mistakes = _k[0], setMistakes = _k[1];
    var _l = (0, react_1.useState)(null), graphData = _l[0], setGraphData = _l[1];
    var _m = (0, react_1.useState)(null), activeIntervention = _m[0], setActiveIntervention = _m[1];
    var _o = (0, react_1.useState)(null), activeCourseOutline = _o[0], setActiveCourseOutline = _o[1];
    var _p = (0, react_1.useState)(null), currentSessionId = _p[0], setCurrentSessionId = _p[1];
    var _q = (0, react_1.useState)(false), loading = _q[0], setLoading = _q[1];
    var _r = (0, react_1.useState)(null), error = _r[0], setError = _r[1];
    var flushingRef = (0, react_1.useRef)(false);
    // ── Offline queue flush ─────────────────────────────────────
    var flushQueue = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var q, remaining, _i, q_1, ev, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!token || flushingRef.current)
                        return [2 /*return*/];
                    q = getQueue();
                    if (q.length === 0)
                        return [2 /*return*/];
                    flushingRef.current = true;
                    remaining = [];
                    _i = 0, q_1 = q;
                    _b.label = 1;
                case 1:
                    if (!(_i < q_1.length)) return [3 /*break*/, 6];
                    ev = q_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, call(ev.path, { method: "POST", body: JSON.stringify(ev.body) }, token)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    remaining.push(ev);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    saveQueue(remaining);
                    flushingRef.current = false;
                    return [2 /*return*/];
            }
        });
    }); }, [token]);
    (0, react_1.useEffect)(function () {
        var handler = function () { return flushQueue(); };
        window.addEventListener("online", handler);
        return function () { return window.removeEventListener("online", handler); };
    }, [flushQueue]);
    // ── Load state ──────────────────────────────────────────────
    var loadState = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, p, c, m, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            call("/brain/state", {}, token),
                            call("/brain/state/concepts", {}, token),
                            call("/brain/mistakes", {}, token),
                        ])];
                case 2:
                    _a = _b.sent(), p = _a[0], c = _a[1], m = _a[2];
                    setProfile(p);
                    setConceptStates(c);
                    setMistakes(m);
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    console.warn("[brain] loadState:", e_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [token]);
    var loadGraph = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var g, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, call("/brain/graph")];
                case 1:
                    g = _a.sent();
                    setGraphData(g);
                    return [2 /*return*/, g];
                case 2:
                    e_2 = _a.sent();
                    console.warn("[brain] loadGraph:", e_2.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    // ── Session ─────────────────────────────────────────────────
    var startSession = (0, react_1.useCallback)(function (type, focusSlug) { return __awaiter(_this, void 0, void 0, function () {
        var r, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/, null];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, call("/brain/session/start", { method: "POST", body: JSON.stringify({ session_type: type, focus_concept_slug: focusSlug }) }, token)];
                case 2:
                    r = _a.sent();
                    setCurrentSessionId(r.session_id);
                    return [2 /*return*/, r];
                case 3:
                    e_3 = _a.sent();
                    console.warn("[brain] startSession:", e_3.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [token]);
    var endSession = (0, react_1.useCallback)(function (sessionId) { return __awaiter(_this, void 0, void 0, function () {
        var sid, e_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sid = sessionId || currentSessionId;
                    if (!token || !sid)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, call("/brain/session/end?session_id=".concat(sid), { method: "POST" }, token)];
                case 2:
                    _a.sent();
                    setCurrentSessionId(null);
                    return [4 /*yield*/, loadState()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_4 = _a.sent();
                    console.warn("[brain] endSession:", e_4.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [token, currentSessionId, loadState]);
    // ── Event logging ────────────────────────────────────────────
    var _enqueue = function (path, body) {
        var q = getQueue();
        q.push({ path: path, body: body, queued_at: Date.now() });
        saveQueue(q);
    };
    /**
     * Log any learning event.
     * Returns Intervention if BKT triggers an AI response.
     */
    var logEvent = (0, react_1.useCallback)(function (payload) { return __awaiter(_this, void 0, void 0, function () {
        var r, e_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token) {
                        _enqueue("/brain/event", __assign(__assign({}, payload), { session_id: currentSessionId }));
                        return [2 /*return*/, null];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, call("/brain/event", { method: "POST", body: JSON.stringify(__assign(__assign({}, payload), { session_id: currentSessionId })) }, token)];
                case 2:
                    r = _a.sent();
                    if (r.intervention)
                        setActiveIntervention(r.intervention);
                    // Async refresh — don't await to avoid blocking
                    loadState().catch(console.warn);
                    return [2 /*return*/, r.intervention];
                case 3:
                    e_5 = _a.sent();
                    // Queue for retry if offline
                    _enqueue("/brain/event", __assign(__assign({}, payload), { session_id: currentSessionId }));
                    console.warn("[brain] logEvent (queued):", e_5.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [token, currentSessionId, loadState]);
    /**
     * Log a question answer with full mistake context.
     * Key improvement: passes wrongAnswer text for mistake pattern tracking.
     * Auto-fetches course outline in the background on wrong answers.
     */
    var logAnswer = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        var intervention;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, logEvent(__assign(__assign(__assign({ event_type: "question_answered", concept_slug: params.conceptSlug, content_ref: params.questionRef, is_correct: params.isCorrect }, (params.difficulty !== undefined && { difficulty: params.difficulty })), (params.wrongAnswer !== undefined && { wrong_answer: params.wrongAnswer })), (params.mistakeType !== undefined && { mistake_type: params.mistakeType })))
                    // Auto-fetch course outline on wrong answer (non-blocking)
                ];
                case 1:
                    intervention = _a.sent();
                    // Auto-fetch course outline on wrong answer (non-blocking)
                    if (!params.isCorrect) {
                        getCourseOutline(params.conceptSlug, params.questionRef).catch(console.warn);
                    }
                    return [2 /*return*/, intervention];
            }
        });
    }); }, [logEvent]);
    var logView = (0, react_1.useCallback)(function (contentRef, conceptSlug) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, logEvent({
                        event_type: "content_viewed",
                        concept_slug: conceptSlug,
                        content_ref: contentRef,
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [logEvent]);
    // ── AI generation ────────────────────────────────────────────
    /**
     * Force an AI intervention for a concept.
     * Builds full RAG context from KG before calling Gemini.
     */
    var generate = (0, react_1.useCallback)(function (conceptSlug_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([conceptSlug_1], args_1, true), void 0, function (conceptSlug, trigger) {
            var r, e_6;
            if (trigger === void 0) { trigger = "manual"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!token)
                            return [2 /*return*/, null];
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, call("/brain/generate", { method: "POST", body: JSON.stringify({ concept_slug: conceptSlug, trigger: trigger }) }, token)];
                    case 2:
                        r = _a.sent();
                        setActiveIntervention(r);
                        return [2 /*return*/, r];
                    case 3:
                        e_6 = _a.sent();
                        setError(e_6.message);
                        return [2 /*return*/, null];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, [token]);
    /**
     * Get an adaptive quiz question.
     * Pass type='bkt_adaptive' to auto-set difficulty from BKT score.
     */
    var getQuestion = (0, react_1.useCallback)(function (conceptSlug_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([conceptSlug_1], args_1, true), void 0, function (conceptSlug, difficulty, type) {
            var e_7;
            if (difficulty === void 0) { difficulty = 3; }
            if (type === void 0) { type = "bkt_adaptive"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!token)
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, call("/brain/quiz/question", { method: "POST", body: JSON.stringify({ concept_slug: conceptSlug, difficulty: difficulty, question_type: type }) }, token)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_7 = _a.sent();
                        console.warn("[brain] getQuestion:", e_7.message);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }, [token]);
    /**
     * Get personalized course outline.
     * Auto-called when user gets a question wrong.
     * Pass wrongQuestionRef for context-aware "why you're stuck" explanation.
     */
    var getCourseOutline = (0, react_1.useCallback)(function (conceptSlug, wrongQuestionRef) { return __awaiter(_this, void 0, void 0, function () {
        var r, e_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/, null];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, call("/brain/course-outline", { method: "POST", body: JSON.stringify({ concept_slug: conceptSlug, wrong_question_ref: wrongQuestionRef }) }, token)];
                case 2:
                    r = _a.sent();
                    setActiveCourseOutline(r);
                    return [2 /*return*/, r];
                case 3:
                    e_8 = _a.sent();
                    console.warn("[brain] getCourseOutline:", e_8.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [token]);
    var getConceptFeed = (0, react_1.useCallback)(function (conceptSlug_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([conceptSlug_1], args_1, true), void 0, function (conceptSlug, n) {
            var r, _a;
            if (n === void 0) { n = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, call("/brain/feed/".concat(conceptSlug, "?max_results=").concat(n))];
                    case 1:
                        r = _b.sent();
                        return [2 /*return*/, r.videos];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }, []);
    // ── Helpers ──────────────────────────────────────────────────
    /** BKT probability of knowledge for a concept (0-1) */
    var getBKT = (0, react_1.useCallback)(function (slug) {
        var _a, _b;
        return (_b = (_a = conceptStates.find(function (s) { var _a; return ((_a = s.concepts) === null || _a === void 0 ? void 0 : _a.slug) === slug; })) === null || _a === void 0 ? void 0 : _a.bkt_p_know) !== null && _b !== void 0 ? _b : 0;
    }, [conceptStates]);
    /** Mastery status string */
    var getMastery = (0, react_1.useCallback)(function (slug) {
        var _a, _b;
        return (_b = (_a = conceptStates.find(function (s) { var _a; return ((_a = s.concepts) === null || _a === void 0 ? void 0 : _a.slug) === slug; })) === null || _a === void 0 ? void 0 : _a.mastery_status) !== null && _b !== void 0 ? _b : "unseen";
    }, [conceptStates]);
    /** 0-1 mastery score */
    var getMasteryScore = (0, react_1.useCallback)(function (slug) {
        var _a, _b;
        return (_b = (_a = conceptStates.find(function (s) { var _a; return ((_a = s.concepts) === null || _a === void 0 ? void 0 : _a.slug) === slug; })) === null || _a === void 0 ? void 0 : _a.mastery_score) !== null && _b !== void 0 ? _b : 0;
    }, [conceptStates]);
    /** True if user has active unresolved weaknesses for this concept */
    var isWeak = (0, react_1.useCallback)(function (slug) {
        var _a;
        return ((_a = profile === null || profile === void 0 ? void 0 : profile.active_weaknesses) !== null && _a !== void 0 ? _a : []).some(function (w) { return w.slug === slug; });
    }, [profile]);
    /** Consecutive wrong answers for a concept — drives UI urgency */
    var getConsecWrong = (0, react_1.useCallback)(function (slug) {
        var _a, _b;
        return (_b = (_a = conceptStates.find(function (s) { var _a; return ((_a = s.concepts) === null || _a === void 0 ? void 0 : _a.slug) === slug; })) === null || _a === void 0 ? void 0 : _a.consecutive_wrong) !== null && _b !== void 0 ? _b : 0;
    }, [conceptStates]);
    /** Active mistake patterns for a concept */
    var getMistakes = (0, react_1.useCallback)(function (slug) {
        return mistakes.filter(function (m) { var _a; return ((_a = m.concepts) === null || _a === void 0 ? void 0 : _a.slug) === slug; });
    }, [mistakes]);
    // Auto-load on mount + flush offline queue
    (0, react_1.useEffect)(function () {
        if (token) {
            loadState();
            flushQueue();
        }
    }, [token, loadState, flushQueue]);
    return {
        // State
        profile: profile,
        conceptStates: conceptStates,
        mistakes: mistakes,
        graphData: graphData,
        activeIntervention: activeIntervention,
        activeCourseOutline: activeCourseOutline,
        currentSessionId: currentSessionId,
        loading: loading,
        error: error,
        // Derived shortcuts
        mastered: (_a = profile === null || profile === void 0 ? void 0 : profile.mastered) !== null && _a !== void 0 ? _a : [],
        struggling: (_b = profile === null || profile === void 0 ? void 0 : profile.struggling) !== null && _b !== void 0 ? _b : [],
        weaknesses: (_c = profile === null || profile === void 0 ? void 0 : profile.active_weaknesses) !== null && _c !== void 0 ? _c : [],
        recentWrong: (_d = profile === null || profile === void 0 ? void 0 : profile.recent_wrong) !== null && _d !== void 0 ? _d : [],
        reviewDue: (_e = profile === null || profile === void 0 ? void 0 : profile.review_due) !== null && _e !== void 0 ? _e : [],
        notStarted: (_f = profile === null || profile === void 0 ? void 0 : profile.not_started) !== null && _f !== void 0 ? _f : [],
        allMistakes: (_g = profile === null || profile === void 0 ? void 0 : profile.active_mistakes) !== null && _g !== void 0 ? _g : [],
        // Session
        startSession: startSession,
        endSession: endSession,
        // Logging
        logEvent: logEvent,
        logAnswer: logAnswer,
        logView: logView,
        // AI
        generate: generate,
        getQuestion: getQuestion,
        getCourseOutline: getCourseOutline,
        getConceptFeed: getConceptFeed,
        // Graph
        loadState: loadState,
        loadGraph: loadGraph,
        // Helpers
        getBKT: getBKT,
        getMastery: getMastery,
        getMasteryScore: getMasteryScore,
        isWeak: isWeak,
        getConsecWrong: getConsecWrong,
        getMistakes: getMistakes,
        // Setters
        setActiveIntervention: setActiveIntervention,
        setActiveCourseOutline: setActiveCourseOutline,
    };
}
