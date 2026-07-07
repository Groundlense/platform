async function run() {
  const apiBase = 'http://localhost:8000/api/v1';

  console.log('Logging in to backend...');
  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'pm@abcgeotech.com',
      password: 'Password@123'
    })
  });

  const { accessToken } = await loginRes.json();
  
  console.log('Fetching projects...');
  const projRes = await fetch(`${apiBase}/projects`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const projects = await projRes.json();
  const project = projects[0];
  const projectId = project.id;
  console.log(`Testing APIs for Project ID: ${projectId} (${project.name})`);

  // Define all endpoints
  const endpoints = [
    { name: 'projects', url: `/projects` },
    { name: 'boreholes', url: `/projects/${projectId}/boreholes` },
    { name: 'sites', url: `/projects/${projectId}/sites` },
    { name: 'members', url: `/projects/${projectId}/members` },
    { name: 'nablLabs', url: `/nabl-labs` },
    { name: 'recentLogs', url: `/activity-logs/recent` },
    { name: 'projectDashboard', url: `/dashboard/projects/${projectId}` },
    { name: 'users', url: `/users` },
    { name: 'pendingRequests', url: `/projects/join-requests/pending` }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${apiBase}${ep.url}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log(`Endpoint: ${ep.name} (${ep.url}) - Status: ${res.status}`);
      if (!res.ok) {
        console.error(`  Error body: ${await res.text()}`);
      }
    } catch (err) {
      console.error(`Endpoint: ${ep.name} failed with network error:`, err);
    }
  }
}

run().catch(console.error);
