(async () => {
  const fs = require('fs');
  const path = require('path');
  const base = 'http://localhost:3000';

  // 1. Login
  const loginRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev+tester@example.com', password: 'Password123!' })
  });

  if (loginRes.status !== 200) {
    console.error('Login failed', loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const setCookie = loginRes.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : null;
  console.log('cookie:', cookie);

  // 2. Prepare form data
  const filePath = path.resolve(__dirname, '..', 'interview-plan-test.pdf');
  if (!fs.existsSync(filePath)) {
    console.error('PDF file not found:', filePath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const fd = new FormData();
  fd.append('jobDescription', 'Sample Job for Upload Test');
  fd.append('selfDescription', 'Sample self description for upload test');
  // Node's FormData supports Blob
  const blob = new Blob([buffer], { type: 'application/pdf' });
  fd.append('resume', blob, 'resume-test.pdf');

  // 3. Upload
  const uploadRes = await fetch(base + '/api/interview/', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: fd
  });

  console.log('upload status', uploadRes.status);
  const uploadBody = await uploadRes.json().catch(() => null);
  console.log('upload response', uploadBody);

  if (!uploadBody || !uploadBody.interviewReport) {
    console.error('Upload failed or returned no interviewReport');
    process.exit(1);
  }

  const id = uploadBody.interviewReport._id;
  console.log('created id', id);

  // 4. Fetch the report
  const getRes = await fetch(base + '/api/interview/report/' + id, {
    method: 'GET',
    headers: { Cookie: cookie }
  });
  const reportBody = await getRes.json();
  console.log('get status', getRes.status);
  console.log('Report summary:');
  const report = reportBody.interviewReport;
  console.log('jobDescription length:', (report.jobDescription || '').length);
  console.log('selfDescription length:', (report.selfDescription || '').length);
  console.log('technicalQuestions count:', (report.technicalQuestions || []).length);
  console.log('behavioralQuestions count:', (report.behavioralQuestions || []).length);
  console.log('preparationPlan days:', (report.preparationPlan || []).length);

})();
