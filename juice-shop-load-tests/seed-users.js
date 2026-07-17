const https = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const NUM_USERS = 300;

function registerUser(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: email,
      password: password,
      passwordRepeat: password,
    });

    const req = https.request(
      `${BASE_URL}/api/Users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const rows = ['email,password'];

  for (let i = 0; i < NUM_USERS; i++) {
    const email = `seeduser_${i}@test.com`;
    const password = 'Test12345!';

    try {
      const result = await registerUser(email, password);
      if (result.status === 201) {
        console.log(`Створено: ${email}`);
        rows.push(`${email},${password}`);
      } else {
        console.log(`Пропущено: ${email}  статус ${result.status}`);
      }
    } catch (err) {
      console.error(`Помилка при створенні ${email}:`, err.message);
    }
  }

  fs.writeFileSync('users.csv', rows.join('\n'));
  console.log(`\n Створено користувачів: ${rows.length - 1},Збережено в users.csv`);
}

main();