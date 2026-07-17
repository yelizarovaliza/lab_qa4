// цей файл спочатку був на стрес тесті, але потім за анліз взято було plateau
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const loginTrend = new Trend('login_duration');
const searchTrend = new Trend('search_duration');

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;
  const email = `loadtest_${uniqueId}@test.com`;
  const password = 'Test12345!';

  // реєстрація нового користувача
  const registerRes = http.post(
    `${BASE_URL}/api/Users`,
    JSON.stringify({ email: email, password: password, passwordRepeat: password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(registerRes, {
    'реєстрація успішна': (r) => r.status === 201,
  });

  sleep(1);

  // логін
  const loginRes = http.post(
    `${BASE_URL}/rest/user/login`,
    JSON.stringify({ email: email, password: password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginTrend.add(loginRes.timings.duration);
  check(loginRes, {
    'логін успішний': (r) => r.status === 200,
    'токен отримано': (r) => JSON.parse(r.body).authentication?.token !== undefined,
  });

  sleep(1);

  // пошук товарів
  const searchRes = http.get(`${BASE_URL}/rest/products/search?q=apple`);
  searchTrend.add(searchRes.timings.duration);
  check(searchRes, {
    'пошук успішний': (r) => r.status === 200,
  });

  sleep(1);
}