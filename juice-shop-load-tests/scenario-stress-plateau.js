import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 10 },   // плато 10
    { duration: '15s', target: 25 },
    { duration: '30s', target: 25 },   // плато 25
    { duration: '15s', target: 50 },
    { duration: '30s', target: 50 },   // плато 50
    { duration: '15s', target: 75 },
    { duration: '30s', target: 75 },   // плато 75
    { duration: '15s', target: 100 },
    { duration: '30s', target: 100 },  // плато 100
    { duration: '15s', target: 150 },
    { duration: '30s', target: 150 },  // плато 150
    { duration: '15s', target: 0 },
  ],
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;
  const email = `loadtest_${uniqueId}@test.com`;
  const password = 'Test12345!';

  const registerRes = http.post(
    `${BASE_URL}/api/Users`,
    JSON.stringify({ email: email, password: password, passwordRepeat: password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(registerRes, { 'реєстрація успішна': (r) => r.status === 201 });

  sleep(1);

  const loginRes = http.post(
    `${BASE_URL}/rest/user/login`,
    JSON.stringify({ email: email, password: password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { 'логін успішний': (r) => r.status === 200 });

  sleep(1);

  const searchRes = http.get(`${BASE_URL}/rest/products/search?q=apple`);
  check(searchRes, { 'пошук успішний': (r) => r.status === 200 });

  sleep(1);
}