// GroundLense end-to-end API test — exercises the full field-data lifecycle
// against a live instance. Creates E2E-prefixed records in the dev DB.
const BASE = process.env.E2E_BASE || 'http://localhost:8000/api/v1';
const TS = Date.now().toString(36).toUpperCase();
const results = [];

function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + String(detail).slice(0, 160) : ''}`);
}

async function req(method, path, { token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) payload = formData;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) { try { data = await res.json(); } catch {} }
  else { try { data = await res.arrayBuffer(); } catch {} }
  return { status: res.status, data };
}
const msg = (r) => (r.data && r.data.message) ? (Array.isArray(r.data.message) ? r.data.message.join(',') : r.data.message) : `status ${r.status}`;

const main = async () => {
  // ---------- 1. AUTH ----------
  let r = await req('GET', '/users');
  check('Unauthenticated GET /users rejected', r.status === 401, `got ${r.status}`);

  r = await req('POST', '/auth/login', { body: { identifier: 'admin@xyzinfra.com', password: 'WRONG' } });
  check('Wrong password rejected (401)', r.status === 401, `got ${r.status}`);

  const login = async (identifier, password) => {
    const res = await req('POST', '/auth/login', { body: { identifier, password } });
    return res.status === 201 || res.status === 200 ? res.data : null;
  };
  const epc = await login('admin@xyzinfra.com', 'Password@123');
  const geo = await login('admin@abcgeotech.com', 'Password@123');
  const sa = await login('superadmin@groundlense.com', 'Password@123');
  check('EPC admin login', !!epc?.accessToken);
  check('Geotech admin login', !!geo?.accessToken);
  check('Superadmin login', !!sa?.accessToken);
  if (!epc || !geo || !sa) { console.log('Cannot continue without seed logins'); return finish(); }

  const me = async (t) => (await req('GET', '/auth/me', { token: t })).data;
  const geoMe = await me(geo.accessToken);
  const epcMe = await me(epc.accessToken);
  const geoOrgId = geoMe?.organizationId, epcOrgId = epcMe?.organizationId;
  check('GET /auth/me returns org', !!geoOrgId && !!epcOrgId);
  check('/auth/me leaks no hashes', !JSON.stringify(geoMe || {}).match(/passwordHash|pinHash/));

  // Refresh rotation
  r = await req('POST', '/auth/refresh', { body: { refreshToken: epc.refreshToken } });
  check('Refresh token rotates', !!r.data?.accessToken && !!r.data?.refreshToken, msg(r));
  const epcTok = r.data?.accessToken || epc.accessToken;
  const r2 = await req('POST', '/auth/refresh', { body: { refreshToken: epc.refreshToken } });
  check('Old refresh token revoked after rotation', r2.status === 401, `got ${r2.status}`);

  // ---------- 2. PROJECT SETUP (web flow) ----------
  r = await req('POST', '/projects', { token: epcTok, body: {
    projectCode: `E2E-PRJ-${TS}`, name: `E2E Test Project ${TS}`,
    description: 'Automated end-to-end test — safe to delete',
    geotechOrganizationId: geoOrgId } });
  const project = r.data;
  check('EPC admin creates project', r.status === 201 && !!project?.id, msg(r));
  if (!project?.id) return finish();

  r = await req('GET', `/projects/${project.id}/setup-status`, { token: geo.accessToken });
  check('Setup initially unlocked', r.status === 200 && r.data?.locked === false, msg(r));

  r = await req('POST', `/projects/${project.id}/boreholes`, { token: geo.accessToken, body: {
    boreholeCode: `E2E-BH-${TS}-01`, name: 'E2E Abutment A1',
    latitude: '25.5941', longitude: '85.1376', plannedDepth: '6' } });
  const bh = r.data;
  check('Geotech admin creates borehole', r.status === 201 && !!bh?.id, msg(r));
  if (!bh?.id) return finish();

  r = await req('GET', `/boreholes/${bh.id}/intervals`, { token: geo.accessToken });
  check('No pre-fabricated intervals on new borehole', Array.isArray(r.data) && r.data.length === 0, `count=${r.data?.length}`);

  r = await req('POST', `/organizations/${geoOrgId}/teams`, { token: geo.accessToken, body: {
    code: `E2E-T-${TS}`, name: 'E2E Drilling Team', description: 'e2e' } });
  const team = r.data;
  check('Create drilling team', (r.status === 201) && !!team?.id, msg(r));

  // ---------- 3. CREW ONBOARDING ----------
  const mobile = '9' + String(Math.floor(100000000 + Math.random() * 899999999));
  r = await req('POST', '/users', { token: geo.accessToken, body: {
    organizationId: geoOrgId, firstName: 'E2E', lastName: 'Worker',
    employeeCode: `E2E-W-${TS}`, mobile, roleCode: 'FIELD_WORKER' } });
  let worker = r.data?.user;
  const workerCreatedByAdmin = r.status === 201 && !!worker?.id;
  check('Geotech admin creates worker (USER_MANAGE)', workerCreatedByAdmin, msg(r));
  if (!workerCreatedByAdmin) {
    r = await req('POST', '/users', { token: sa.accessToken, body: {
      organizationId: geoOrgId, firstName: 'E2E', lastName: 'Worker',
      employeeCode: `E2E-W-${TS}`, mobile, roleCode: 'FIELD_WORKER' } });
    worker = r.data?.user;
    check('(fallback) superadmin creates worker', r.status === 201 && !!worker?.id, msg(r));
  }
  if (!worker?.id) return finish();
  check('Create user response has no hash / no hardcoded password',
    !JSON.stringify(r.data).match(/passwordHash|pinHash|Password@123/));

  if (team?.id) {
    r = await req('POST', `/teams/${team.id}/members`, { token: geo.accessToken, body: { userId: worker.id } });
    check('Add worker to team', r.status === 201, msg(r));
  }
  r = await req('POST', `/projects/${project.id}/members`, { token: geo.accessToken, body: { userId: worker.id } });
  check('Add worker to project members', r.status === 201, msg(r));

  // Activation (mobile app "Create account" flow)
  r = await req('POST', '/auth/create-password', { body: { mobile, password: 'Worker@123' } });
  check('Worker activates via mobile + own password', r.status === 201 || r.status === 200, msg(r));
  r = await req('POST', '/auth/create-password', { body: { mobile, password: 'Attacker@123' } });
  check('Activation is one-shot (no account takeover)', r.status === 400, `got ${r.status}`);

  const wk = await login(`E2E-W-${TS}`, 'Worker@123');
  check('Worker logs in with employee code + own password', !!wk?.accessToken);
  if (!wk) return finish();

  // ---------- 4. ASSIGNMENT ----------
  if (team?.id) {
    r = await req('PATCH', `/boreholes/${bh.id}/assignment`, { token: geo.accessToken, body: { teamId: team.id, assignedWorkerId: worker.id } });
    check('Assign borehole to team + worker (PLANNED)', r.status === 200, msg(r));
  }
  r = await req('GET', `/boreholes/assigned?projectId=${project.id}`, { token: wk.accessToken });
  check('Worker sees assigned borehole', Array.isArray(r.data) && r.data.some((b) => b.id === bh.id), msg(r));

  // ---------- 5. FIELD WORK (mobile flow: session + offline sync) ----------
  r = await req('POST', `/boreholes/${bh.id}/sessions`, { token: wk.accessToken, body: { startDepth: 0 } });
  const session = r.data;
  check('Worker starts boring session', r.status === 201 && !!session?.id, msg(r));

  const deviceId = `e2e-device-${TS}`;
  const op = (n, entityType, entityId, operationType, payloadJson) => ({
    deviceId, operationId: `e2e-${TS}-${n}`, entityType, entityId, operationType, payloadJson,
    ...(session?.id ? { boringSessionId: session.id } : {}) });
  const syncBody = { operations: [
    op(1, 'BORING', bh.id, 'UPDATE', { status: 'IN_PROGRESS' }),
    op(2, 'SPT_RECORD', `interval-${bh.id}-1`, 'CREATE', {
      boreholeId: bh.id, intervalNo: 1, fromDepth: 0, toDepth: 1.5,
      soilDescription: 'E2E silty clay, medium', nValue: 12, blow1: 4, blow2: 5, blow3: 7,
      nCorrected: 12, isRefusal: false, dilatancyApplied: false, isCompleted: true,
      observedAt: new Date().toISOString() }),
    op(3, 'SAMPLE', `sample-${TS}`, 'CREATE', {
      intervalId: `interval-${bh.id}-1`, sampleNumber: `E2E-S-${TS}`, sampleType: 'DISTURBED',
      sampleDepth: 1.5, condition: 'SEALED', createdAt: new Date().toISOString() }),
    op(4, 'WATER_LEVEL', `wt-${TS}`, 'CREATE', {
      boreholeId: bh.id, depth: 3.2, observedAt: new Date().toISOString(),
      remarks: 'E2E during drilling', readingType: 'DRILLING_LEVEL' }),
  ] };
  r = await req('POST', '/sync/operations', { token: wk.accessToken, body: syncBody });
  const allSynced = r.data?.results?.every((x) => x.status === 'SYNCED');
  check('Worker pushes offline sync queue (4 ops)', r.status === 201 && r.data?.success === true && allSynced,
    msg(r) + ' ' + JSON.stringify(r.data?.results?.map((x) => x.status)));

  // Materialization into Neon
  r = await req('GET', `/boreholes/${bh.id}/intervals`, { token: geo.accessToken });
  const interval = Array.isArray(r.data) ? r.data.find((iv) => iv.intervalNo === 1) : null;
  check('SPT interval materialized in DB', !!interval && Number(interval.nValue) === 12 && interval.blow2 === 5, JSON.stringify(interval)?.slice(0, 120));
  let sample = null;
  if (interval) {
    r = await req('GET', `/intervals/${interval.id}/samples`, { token: geo.accessToken });
    sample = Array.isArray(r.data) ? r.data[0] : null;
    check('Sample materialized in DB', !!sample && sample.sampleNumber === `E2E-S-${TS}`, msg(r));
  }
  r = await req('GET', `/boreholes/${bh.id}/water-table`, { token: geo.accessToken });
  check('Water-table observation materialized', Array.isArray(r.data) && r.data.length === 1 && Number(r.data[0].depth) === 3.2, msg(r));
  r = await req('GET', `/boreholes/${bh.id}`, { token: geo.accessToken });
  check('Borehole status updated to IN_PROGRESS via sync', r.data?.status === 'IN_PROGRESS', r.data?.status);

  // Idempotent replay
  r = await req('POST', '/sync/operations', { token: wk.accessToken, body: syncBody });
  const r3 = await req('GET', `/boreholes/${bh.id}/intervals`, { token: geo.accessToken });
  check('Sync replay is idempotent (no duplicates)', Array.isArray(r3.data) && r3.data.length === 1, `intervals=${r3.data?.length}`);

  // ---------- 6. SETUP LOCK ----------
  r = await req('GET', `/projects/${project.id}/setup-status`, { token: geo.accessToken });
  check('Setup-status reports locked after work started', r.data?.locked === true, msg(r));
  r = await req('POST', `/projects/${project.id}/boreholes`, { token: geo.accessToken, body: {
    boreholeCode: `E2E-BH-${TS}-02`, name: 'Should be blocked', latitude: '25.59', longitude: '85.13', plannedDepth: '5' } });
  check('New borehole blocked after fieldwork starts (403)', r.status === 403, `got ${r.status}: ${msg(r)}`);
  r = await req('POST', `/projects/${project.id}/members`, { token: geo.accessToken, body: { userId: geoMe.id } });
  check('Member add blocked after fieldwork starts (403)', r.status === 403, `got ${r.status}: ${msg(r)}`);
  if (team?.id) {
    r = await req('PATCH', `/boreholes/${bh.id}/assignment`, { token: geo.accessToken, body: { teamId: team.id } });
    check('Reassignment of started borehole blocked (403)', r.status === 403, `got ${r.status}: ${msg(r)}`);
  }

  // ---------- 7. MEDIA (photo pipeline) ----------
  if (interval) {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const fd = new FormData();
    fd.append('file', new Blob([png], { type: 'image/png' }), 'e2e-photo.png');
    r = await req('POST', `/intervals/${interval.id}/media`, { token: wk.accessToken, formData: fd });
    const mediaRow = r.data;
    check('Worker uploads interval photo (multipart)', r.status === 201 && !!mediaRow?.id, msg(r));
    if (mediaRow?.id) {
      r = await req('GET', `/media/${mediaRow.id}/file`, { token: geo.accessToken });
      check('Photo served to authorized user', r.status === 200 && r.data?.byteLength > 0, `status ${r.status}`);
      r = await req('GET', `/media/${mediaRow.id}/file`);
      check('Photo blocked without auth', r.status === 401, `got ${r.status}`);
    }
  }

  // ---------- 8. ENGINEER REVIEW + THREADS ----------
  if (interval) {
    r = await req('PATCH', `/intervals/${interval.id}`, { token: geo.accessToken, body: {
      nValue: 10, remarks: 'N modified 12→10 per IS 2131 Cl.6.3 — E2E overburden correction' } });
    check('Engineer N-modification persists', r.status === 200 && Number(r.data?.nValue) === 10, msg(r));
  }
  r = await req('POST', `/boreholes/${bh.id}/threads`, { token: geo.accessToken, body: {
    message: 'E2E query: confirm casing depth at 1.5m' } });
  const thread = r.data;
  check('Engineer raises query thread to worker', (r.status === 201) && !!thread?.id, msg(r));
  if (thread?.id) {
    r = await req('GET', '/threads/assigned-to-me', { token: wk.accessToken });
    check('Worker inbox shows the query', Array.isArray(r.data) && r.data.some((t) => t.id === thread.id), msg(r));
    r = await req('POST', `/threads/${thread.id}/messages`, { token: wk.accessToken, body: { message: 'E2E reply: casing OK, no disturbance' } });
    check('Worker replies to query', r.status === 201, msg(r));
  }

  // ---------- 9. LAB ----------
  r = await req('POST', '/nabl-labs', { token: geo.accessToken, body: {
    companyId: geoOrgId, nablCertNumber: `E2E-CERT-${TS}`, labName: `E2E Lab ${TS}`,
    accreditedTests: { ATTERBERG: true, TRIAXIAL: false }, certValidFrom: '2026-01-01', certValidUntil: '2027-01-01' } });
  const lab = r.data;
  check('Lab registers (NOT self-verified)', !!lab?.id && lab?.isVerified === false,
    `status=${r.status} isVerified=${lab?.isVerified} body=${JSON.stringify(r.data)?.slice(0, 140)}`);
  if (lab?.id) {
    r = await req('PATCH', `/nabl-labs/${lab.id}/approve`, { token: sa.accessToken });
    check('GL admin approves lab', r.status === 200 && r.data?.isVerified === true, msg(r));
  }
  if (sample?.id && lab?.id) {
    r = await req('POST', `/samples/${sample.id}/lab-results`, { token: geo.accessToken, body: {
      nablLabId: lab.id, testType: 'ATTERBERG', testValues: { LL: 42, PL: 21 }, resultValues: { PI: 21, USCS: 'CL' },
      reportNumber: `E2E-RPT-${TS}`, reportPdfUrl: 'https://example.com/e2e.pdf', testedOn: new Date().toISOString() } });
    check('Lab result submitted + locks sample', r.status === 201, msg(r));
    r = await req('GET', `/samples/${sample.id}/lab-results`, { token: epcTok });
    check('Lab result readable by project party', r.status === 200 && r.data?.reportNumber === `E2E-RPT-${TS}`, msg(r));
  }

  // ---------- 10. REPORT / DASHBOARD / FEED ----------
  r = await req('GET', `/boreholes/${bh.id}/report-data`, { token: geo.accessToken });
  check('Report-data aggregates field data', r.status === 200 && r.data?.intervals?.length === 1 && r.data?.waterTableObservations?.length === 1, msg(r));
  r = await req('GET', '/activity-logs/recent', { token: geo.accessToken });
  const hasAuthNoise = Array.isArray(r.data) && r.data.some((l) => ['LOGIN', 'LOGOUT'].includes(l.action));
  check('Live feed has NO login/logout noise', r.status === 200 && !hasAuthNoise, hasAuthNoise ? 'found auth events' : `entries=${r.data?.length}`);
  const hasField = Array.isArray(r.data) && r.data.some((l) => ['BOREHOLE_CREATED', 'INTERVAL_UPDATED', 'BOREHOLE_ASSIGNED'].includes(l.action));
  check('Live feed shows ground activity', hasField, r.data?.slice(0, 3).map((l) => l.action).join(','));
  r = await req('GET', '/dashboard/summary', { token: geo.accessToken });
  check('Dashboard summary responds (org-scoped)', r.status === 200 && typeof r.data?.projects === 'number', msg(r));

  // ---------- 11. PAYMENTS ----------
  r = await req('POST', '/payments', { token: epcTok, body: {
    projectId: project.id, planType: 'PER_BORING', boringsPurchased: 1, amountPaid: 5000, razorpayOrderId: `order_e2e${TS}` } });
  const payment = r.data;
  check('Payment created PENDING', r.status === 201 && payment?.status === 'PENDING', msg(r));
  if (payment?.id) {
    r = await req('PATCH', `/payments/${payment.id}/verify`, { token: epcTok, body: {
      razorpayPaymentId: 'pay_bogus', razorpaySignature: 'deadbeef'.repeat(8) } });
    check('Bogus payment signature rejected (400)', r.status === 400, `got ${r.status}: ${msg(r)}`);
  }

  // ---------- 12. RBAC / TENANCY ----------
  r = await req('GET', `/boreholes/${bh.id}/report-data`, { token: wk.accessToken });
  check('Worker without REPORT_VIEW blocked from report (403)', r.status === 403, `got ${r.status}`);
  r = await req('GET', '/activity-logs/recent', { token: epcTok });
  const leaked = Array.isArray(r.data) && r.data.some((l) => l.user && `${l.user.firstName}` === 'E2E');
  check('EPC feed is org-scoped (no geotech-user rows)', r.status === 200 && !leaked, leaked ? 'cross-org leak!' : 'ok');
  // Suspension kills live tokens
  r = await req('PATCH', `/users/${worker.id}/status`, { token: sa.accessToken, body: { status: 'INACTIVE' } });
  const rr = await req('GET', '/auth/me', { token: wk.accessToken });
  check('Suspended user token rejected immediately', rr.status === 401, `got ${rr.status}`);
  await req('PATCH', `/users/${worker.id}/status`, { token: sa.accessToken, body: { status: 'ACTIVE' } });

  finish();
};

function finish() {
  const pass = results.filter((r) => r.pass).length;
  console.log(`\n===== E2E RESULT: ${pass}/${results.length} passed =====`);
  const fails = results.filter((r) => !r.pass);
  if (fails.length) { console.log('FAILURES:'); fails.forEach((f) => console.log(` - ${f.name}: ${f.detail}`)); }
}

main().catch((e) => { console.error('E2E crashed:', e); finish(); });
