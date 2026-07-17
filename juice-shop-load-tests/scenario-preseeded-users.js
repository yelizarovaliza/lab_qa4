import http from 'k6/http';
import { check, sleep } from 'k6';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  const csvData = open('./users.csv');
  return papaparse.parse(csvData, { header: true }).data;
});

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
  const user = users[__VU % users.length];

  // логін готовим користувачем (без реєстрації !!!)
  const loginRes = http.post(
    `${BASE_URL}/rest/user/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginOk = check(loginRes, {
    'логін успішний': (r) => r.status === 200,
  });

  if (!loginOk) {
    console.log(`Логін не вдався для ${user.email}: ${loginRes.status} ${loginRes.body}`);
    sleep(1);
    return;
  }

  const token = JSON.parse(loginRes.body).authentication.token;

  sleep(1);

  // список товарів
  const productsRes = http.get(`${BASE_URL}/api/Products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(productsRes, {
    'товари отримано': (r) => r.status === 200,
  });

  sleep(1);

  // перегляд кошика
  const basketRes = http.get(`${BASE_URL}/rest/basket/1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(basketRes, {
    'кошик отримано': (r) => r.status === 200,
  });

  sleep(1);
}