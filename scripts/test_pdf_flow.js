(async ()=>{
  const fs = require('fs');
  const fetch = global.fetch || require('node-fetch');
  const base = 'http://localhost:3000';

  // 1. Register
  let res = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ username: 'devtester', email: 'dev+tester@example.com', password: 'Password123!' })
  });

  if (res.status !== 201 && res.status !== 200) {
    // try login
    console.log('Register returned', res.status);
    res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: 'dev+tester@example.com', password: 'Password123!' })
    });
    if (res.status !== 200) {
      console.error('Login failed', res.status, await res.text());
      process.exit(1);
    }
  }

  const setCookie = res.headers.get('set-cookie');
  console.log('set-cookie:', setCookie);
  const cookie = setCookie ? setCookie.split(';')[0] : null;
  if (!cookie) {
    console.error('No cookie received');
    process.exit(1);
  }

  // 2. Create dev report
  res = await fetch(base + '/api/interview/dev/create-report', {
    method: 'POST',
    headers: { 'Cookie': cookie }
  });
  if (res.status !== 201) {
    console.error('Create report failed', res.status, await res.text());
    process.exit(1);
  }
  const body = await res.json();
  console.log('created report id', body.interviewReport._id);

  const id = body.interviewReport._id;

  // 3. Request PDF
  res = await fetch(base + '/api/interview/resume/pdf/' + id, {
    method: 'POST',
    headers: { 'Cookie': cookie }
  });
  if (res.status !== 200) {
    console.error('PDF request failed', res.status, await res.text());
    process.exit(1);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const out = 'interview-plan-test.pdf';
  fs.writeFileSync(out, buf);
  console.log('Wrote PDF to', out);
})();
