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
  const user = users[__VU % users.length];

  const loginRes = http.post(
    `${BASE_URL}/rest/user/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginOk = check(loginRes, { 'логін успішний': (r) => r.status === 200 });
  if (!loginOk) {
    sleep(1);
    return;
  }

  const token = JSON.parse(loginRes.body).authentication.token;
  sleep(1);

  const productsRes = http.get(`${BASE_URL}/api/Products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(productsRes, { 'товари отримано': (r) => r.status === 200 });
  sleep(1);

  const basketRes = http.get(`${BASE_URL}/rest/basket/1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(basketRes, { 'кошик отримано': (r) => r.status === 200 });
  sleep(1);
}