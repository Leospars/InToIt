import type { LMSConfig, LMSCourse, LMSTopic } from '../types';

// ── Moodle REST API ────────────────────────────────────
// Docs: https://docs.moodle.org/dev/Web_service_API_functions
// Demo sandbox: https://sandbox.moodledemo.net
// Get token: Site admin → Plugins → Web services → Manage tokens
// Or: /login/token.php?username=USER&password=PASS&service=moodle_mobile_app

export async function moodleCall<T>(
  baseUrl: string,
  token: string,
  fn: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const clean = baseUrl.replace(/\/$/, '');
  const query = new URLSearchParams({
    wstoken: token,
    wsfunction: fn,
    moodlewsrestformat: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const res = await fetch(`${clean}/webservice/rest/server.php?${query}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Moodle HTTP ${res.status}`);
  const data = await res.json();
  if (data?.exception) throw new Error(data.message ?? data.exception);
  return data as T;
}

export async function moodleVerify(baseUrl: string, token: string): Promise<string> {
  // Returns site name on success, throws on failure
  const info = await moodleCall<{ sitename: string }>(baseUrl, token, 'core_webservice_get_site_info');
  return info.sitename ?? 'Moodle';
}

export async function moodleGetCourses(baseUrl: string, token: string): Promise<LMSCourse[]> {
  // Get all courses the user is enrolled in
  type RawCourse = { id: number; fullname: string; shortname: string; categoryname?: string };
  const raw = await moodleCall<RawCourse[]>(baseUrl, token, 'core_enrol_get_users_courses', { userid: 0 });

  // Also get site courses if enrolled list is empty (guest/demo mode)
  const courses = Array.isArray(raw) && raw.length > 0 ? raw : await moodleCall<RawCourse[]>(baseUrl, token, 'core_course_get_courses');

  return courses
    .filter((c) => c.id !== 1) // exclude site home
    .map((c) => ({
      id: String(c.id),
      name: c.fullname,
      shortName: c.shortname,
      categoryName: c.categoryname,
      topics: [],
    }));
}

export async function moodleGetTopics(baseUrl: string, token: string, courseId: string): Promise<LMSTopic[]> {
  type RawSection = { id: number; name: string; summary: string; modules: { id: number; name: string; modname: string }[] };
  const sections = await moodleCall<RawSection[]>(baseUrl, token, 'core_course_get_contents', { courseid: courseId });

  const topics: LMSTopic[] = [];
  let order = 0;
  for (const section of sections) {
    const sectionName = section.name?.trim() || 'General';
    // Each section becomes a topic if it has a meaningful name
    if (sectionName && sectionName !== 'General' && !sectionName.match(/^section \d+$/i)) {
      topics.push({
        id: `section_${section.id}`,
        name: sectionName,
        summary: stripHtml(section.summary ?? ''),
        sectionName,
        order: order++,
      });
    }
    // Also extract individual module names as sub-topics if valuable
    for (const mod of section.modules ?? []) {
      if (['page', 'lesson', 'resource', 'url'].includes(mod.modname) && mod.name) {
        topics.push({
          id: `mod_${mod.id}`,
          name: mod.name,
          sectionName,
          order: order++,
        });
      }
    }
  }
  return topics.filter((t) => t.name && t.name.length > 2);
}

// ── Canvas LMS API ─────────────────────────────────────
// Docs: https://canvas.instructure.com/doc/api/
// Get token: Account → Settings → New Access Token
// Demo: https://canvas.instructure.com (sign up free) or institution URL

export async function canvasCall<T>(
  baseUrl: string,
  token: string,
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const clean = baseUrl.replace(/\/$/, '');
  const query = new URLSearchParams({ per_page: '100', ...params });
  const res = await fetch(`${clean}/api/v1${path}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Canvas HTTP ${res.status}`);
  return res.json();
}

export async function canvasVerify(baseUrl: string, token: string): Promise<string> {
  type Profile = { name: string; primary_email?: string };
  const profile = await canvasCall<Profile>(baseUrl, token, '/users/self/profile');
  return profile.name ?? 'Canvas User';
}

export async function canvasGetCourses(baseUrl: string, token: string): Promise<LMSCourse[]> {
  type RawCourse = { id: number; name: string; course_code: string; enrollment_term_id: number };
  const raw = await canvasCall<RawCourse[]>(baseUrl, token, '/courses', { enrollment_state: 'active' });
  return raw
    .filter((c) => c.name)
    .map((c) => ({
      id: String(c.id),
      name: c.name,
      shortName: c.course_code ?? c.name,
      topics: [],
    }));
}

export async function canvasGetTopics(baseUrl: string, token: string, courseId: string): Promise<LMSTopic[]> {
  // Canvas modules = sections
  type RawModule = { id: number; name: string; items?: { id: number; title: string; type: string }[] };
  const modules = await canvasCall<RawModule[]>(baseUrl, token, `/courses/${courseId}/modules`, { include: 'items' });

  const topics: LMSTopic[] = [];
  let order = 0;
  for (const mod of modules) {
    // Module name as a topic
    topics.push({
      id: `module_${mod.id}`,
      name: mod.name,
      sectionName: mod.name,
      order: order++,
    });
  }

  // Fallback: get assignments as topics if no modules
  if (topics.length === 0) {
    type RawAssignment = { id: number; name: string; description?: string };
    const assignments = await canvasCall<RawAssignment[]>(baseUrl, token, `/courses/${courseId}/assignments`);
    for (const a of assignments) {
      topics.push({ id: `assign_${a.id}`, name: a.name, summary: stripHtml(a.description ?? ''), order: order++ });
    }
  }

  return topics.filter((t) => t.name && t.name.length > 2);
}

// ── Unified connector ──────────────────────────────────

export async function lmsVerify(config: LMSConfig): Promise<string> {
  if (config.type === 'moodle') return moodleVerify(config.baseUrl, config.token);
  if (config.type === 'canvas') return canvasVerify(config.baseUrl, config.token);
  throw new Error('Unknown LMS type');
}

export async function lmsGetCourses(config: LMSConfig): Promise<LMSCourse[]> {
  if (config.type === 'moodle') return moodleGetCourses(config.baseUrl, config.token);
  if (config.type === 'canvas') return canvasGetCourses(config.baseUrl, config.token);
  throw new Error('Unknown LMS type');
}

export async function lmsGetTopics(config: LMSConfig, courseId: string): Promise<LMSTopic[]> {
  if (config.type === 'moodle') return moodleGetTopics(config.baseUrl, config.token, courseId);
  if (config.type === 'canvas') return canvasGetTopics(config.baseUrl, config.token, courseId);
  throw new Error('Unknown LMS type');
}

// ── Helpers ────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
}

// Demo credentials for moodle.org sandbox
export const MOODLE_DEMO = {
  baseUrl: 'https://sandbox.moodledemo.net',
  // Public demo token — works for read-only API calls
  // Students can also get this from: sandbox.moodledemo.net/login/token.php?username=student&password=sandbox&service=moodle_mobile_app
  tokenHint: 'Get from: sandbox.moodledemo.net/login/token.php?username=student&password=sandbox&service=moodle_mobile_app',
};
