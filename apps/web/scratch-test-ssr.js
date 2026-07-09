async function run() {
  const apiBase = 'http://localhost:8000/api/v1';
  const webBase = 'http://localhost:3000';

  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'pm@abcgeotech.com',
      password: 'Password@123'
    })
  });

  const { accessToken } = await loginRes.json();
  const projRes = await fetch(`${apiBase}/projects`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const projects = await projRes.json();
  const project = projects[0];

  console.log(`Fetching Next.js SSR page for /projects/${project.id}/contractor ...`);
  const ssrRes = await fetch(`${webBase}/projects/${project.id}/contractor`, {
    headers: { 'Cookie': `gl_token=${accessToken}` }
  });

  console.log(`Response status: ${ssrRes.status}`);
  const html = await ssrRes.text();
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  console.log('Page Title:', titleMatch ? titleMatch[1] : 'No title');
}

run().catch(console.error);
