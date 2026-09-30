const fs = require('fs');

async function run() {
  const loginRes = await fetch('http://localhost:8443/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@drape.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  const formData = new FormData();
  formData.append('file', new Blob(['test']), 'test.txt');

  const uploadRes = await fetch('http://localhost:8443/api/v1/storage/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log(JSON.stringify(uploadData, null, 2));
}

run();
