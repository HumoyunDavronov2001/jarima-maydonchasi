/* Nazorat paneli — Hokimlik, Soliq, Prokuratura. Faqat ko'rish. Viloyat — hammasi, tuman — faqat o'zi. */
(function () {
  const S = JM.store, U = JM.ui, $ = U.$;
  const h = n => new Date(Date.now() - n * 36e5);
  const root = $('#root');

  /* ---------- rollar ---------- */
  const ORGS = { hokimlik: 'Hokimlik', soliq: 'Soliq qo\u2018mitasi', prokuratura: 'Prokuratura' };
  const ROLES = {
    hokimlik: { pii: false, nav: [['umumiy', 'Umumiy', 'report'], ['lots', 'Maydonchalar', 'lot'], ['sifat', 'Uskuna va sifat', 'gate'], ['hisobot', 'Hisobot', 'out'], ['kirish', 'Kirish jurnali', 'user']] },
    soliq: { pii: true, nav: [['soliq', 'Fiskal sverka', 'report'], ['lots', 'Maydonchalar', 'lot'], ['tv', "TV so'rovi", 'scan'], ['hisobot', 'Hisobot', 'out'], ['kirish', 'Kirish jurnali', 'user']] },
    prokuratura: { pii: true, nav: [['qonun', 'Qonuniylik', 'report'], ['tv', "TV so'rovi", 'scan'], ['lots', 'Maydonchalar', 'lot'], ['kirish', 'Kirish jurnali', 'user']] },
  };
  const DISTRICTS = ['Jizzax shahar', 'Sharof Rashidov', 'Zarbdor', "G'allaorol", 'Paxtakor', "Do'stlik", 'Zomin', 'Forish', 'Yangiobod', 'Baxmal', 'Arnasoy', 'Mirzacho\u2018l', 'Zafarobod'];
  let user = null; // {org, level:'viloyat'|'tuman', tuman, name}
  let tumanFilter = '';
  const scopeLots = () => L.filter(l => (user.level === 'viloyat' ? (!tumanFilter || l.tuman === tumanFilter) : l.tuman === user.tuman));
  const pii = () => ROLES[user.org].pii;
  const plate = p => pii() ? U.plate(p, 'sm') : `<span class="mask">TV, ${S.esc((p || '').slice(0, 2))}-viloyat</span>`;
  const pretty = p => pii() ? S.prettyPlate(p) : 'TV';

  /* ---------- ma'lumot (sinov) ---------- */
  let L = [
    { id: 1, name: 'Jizzax shahar', tuman: 'Jizzax shahar', org: '"Jizzax Avtoxizmat" MChJ', tin: '000000001', cap: 60, inLot: 47, inToday: 3, outToday: 2, month: 38460000, pays: 118, ok: 118, cash: .62, avgH: 154, long: 3, noProto: 1, blocked: 1, cams: [1, 1], kassa: 1, sync: 1, z: '06.09 19:02', ofdDiff: 0, noPerm: 0, admin: 4 },
    { id: 2, name: 'Sharof Rashidov', tuman: 'Sharof Rashidov', org: '"Rashidov Servis" MChJ', tin: '000000002', cap: 40, inLot: 22, inToday: 1, outToday: 1, month: 17280000, pays: 54, ok: 54, cash: .71, avgH: 122, long: 1, noProto: 0, blocked: 0, cams: [1, 1], kassa: 1, sync: 3, z: '06.09 18:40', ofdDiff: 0, noPerm: 0, admin: 1 },
    { id: 3, name: 'Zarbdor', tuman: 'Zarbdor', org: '"Zarbdor Yo\u2018l" MChJ', tin: '000000003', cap: 30, inLot: 12, inToday: 0, outToday: 1, month: 9120000, pays: 31, ok: 30, cash: .84, avgH: 187, long: 2, noProto: 0, blocked: 0, cams: [1, 0], kassa: 1, sync: 2, z: '05.09 18:10', ofdDiff: 1, noPerm: 0, admin: 2 },
    { id: 4, name: "G'allaorol", tuman: "G'allaorol", org: '"G\u2018allaorol Avtostoyanka" MChJ', tin: '000000004', cap: 40, inLot: 31, inToday: 2, outToday: 3, month: 21900000, pays: 66, ok: 66, cash: .58, avgH: 141, long: 2, noProto: 1, blocked: 1, cams: [1, 1], kassa: 1, sync: 1, z: '06.09 19:15', ofdDiff: 0, noPerm: 0, admin: 3 },
    { id: 5, name: 'Paxtakor', tuman: 'Paxtakor', org: '"Paxtakor Servis" MChJ', tin: '000000005', cap: 30, inLot: 9, inToday: 0, outToday: 0, month: 6540000, pays: 22, ok: 22, cash: .9, avgH: 213, long: 1, noProto: 0, blocked: 0, cams: [1, 1], kassa: 0, sync: 41, z: '04.09 18:00', ofdDiff: 0, noPerm: 0, admin: 0 },
    { id: 6, name: "Do'stlik", tuman: "Do'stlik", org: '"Do\u2018stlik Avtoxizmat" MChJ', tin: '000000006', cap: 30, inLot: 14, inToday: 1, outToday: 0, month: 8760000, pays: 29, ok: 29, cash: .76, avgH: 146, long: 1, noProto: 0, blocked: 0, cams: [1, 1], kassa: 1, sync: 2, z: '06.09 18:55', ofdDiff: 0, noPerm: 0, admin: 1 },
    { id: 7, name: 'Zomin', tuman: 'Zomin', org: '"Zomin Yo\u2018l Servis" MChJ', tin: '000000007', cap: 40, inLot: 26, inToday: 2, outToday: 1, month: 15300000, pays: 47, ok: 47, cash: .66, avgH: 160, long: 1, noProto: 0, blocked: 1, cams: [1, 1], kassa: 1, sync: 1, z: '06.09 19:00', ofdDiff: 0, noPerm: 0, admin: 2 },
    { id: 8, name: 'Zarbdor, 2-maydoncha', tuman: 'Zarbdor', org: '"Zarbdor Avto" MChJ', tin: '000000008', cap: 20, inLot: 8, inToday: 1, outToday: 0, month: 4200000, pays: 14, ok: 14, cash: .79, avgH: 133, long: 0, noProto: 0, blocked: 0, cams: [1, 1], kassa: 1, sync: 2, z: '06.09 18:30', ofdDiff: 0, noPerm: 0, admin: 0 },
  ];
  let DAYS = [[9, 7], [12, 10], [8, 9], [11, 8], [14, 12], [6, 7], [5, 6], [10, 9], [13, 11], [9, 10], [12, 12], [8, 7], [9, 10], [7, 5]];
  let ADMIN = [
    { at: '06.09 17:20', lot: 1, act: 'Qaytarish', plate: '01B777AA', sum: 265000, reason: "soat noto'g'ri hisoblangan", by: 'A. Nazarov' },
    { at: '06.09 11:05', lot: 4, act: 'Bloklash', plate: '01C412CD', sum: 0, reason: "shikast bo'yicha nizo, hisob to'xtatildi", by: 'R. Tursunov' },
    { at: '05.09 16:48', lot: 1, act: 'Tuzatish', plate: '01E555EE', sum: 0, reason: 'kirish 04:10 → 03:50, evakuator jurnali', by: 'A. Nazarov' },
    { at: '05.09 09:30', lot: 3, act: 'Qaytarish', plate: '01H100HA', sum: 60000, reason: 'egasi ikki marta to\u2018lagan', by: 'S. Karimov' },
    { at: '04.09 14:12', lot: 7, act: 'Bloklash', plate: '01K909KZ', sum: 0, reason: 'sud xatlovi', by: 'B. Ergashev' },
    { at: '04.09 10:02', lot: 3, act: 'Hujjat asosida', plate: '01T120TA', sum: 0, reason: 'tergovchi qarori 12/44, hisob keyin', by: 'S. Karimov' },
    { at: '03.09 10:40', lot: 1, act: 'Blokni olish', plate: '01E555EE', sum: 0, reason: 'nizo hal qilindi', by: 'A. Nazarov' },
    { at: '02.09 15:15', lot: 4, act: 'Imtiyoz', plate: '01M245MG', sum: 180000, reason: 'ish tugatilgan, YHXB xati 214', by: 'R. Tursunov' },
  ];
  let LONG = [
    { lot: 1, plate: '01R711RB', brand: 'Chevrolet Damas', at: '06.07.2026', days: 63, sum: 3030000 }, { lot: 1, plate: '01S909SC', brand: 'Daewoo Nexia', at: '22.07.2026', days: 47, sum: 2970000 },
    { lot: 3, plate: '01T120TA', brand: 'Chevrolet Nexia', at: '19.07.2026', days: 50, sum: 3150000 }, { lot: 3, plate: '01U321UZ', brand: 'Chevrolet Cobalt', at: '08.08.2026', days: 30, sum: 1950000 },
    { lot: 4, plate: '01V555VG', brand: 'Lada Granta', at: '26.07.2026', days: 43, sum: 2730000 }, { lot: 4, plate: '01W101WG', brand: 'Chevrolet Spark', at: '01.08.2026', days: 37, sum: 2400000 },
    { lot: 1, plate: '01D404DA', brand: 'Chevrolet Lacetti', at: '07.08.2026', days: 31, sum: 2010000 }, { lot: 2, plate: '01X200XR', brand: 'Chevrolet Gentra', at: '05.08.2026', days: 33, sum: 2100000 },
    { lot: 5, plate: '01Y303YP', brand: 'Daewoo Matiz', at: '30.07.2026', days: 39, sum: 1200000 }, { lot: 6, plate: '01Z606ZD', brand: 'Chevrolet Cobalt', at: '03.08.2026', days: 35, sum: 2250000 }, { lot: 7, plate: '01Q707QZ', brand: 'Kia Cerato', at: '27.07.2026', days: 42, sum: 2700000 },
  ];
  let GAPS = [{ lot: 3, dev: 'Chiqish kamerasi', period: '07.09 04:12 dan hozirgacha', effect: "1 ta chiqish kadrsiz — operator qo'lda tasdiqlagan" }, { lot: 5, dev: 'Kassa (EPOS)', period: '06.09 18:00 dan', effect: "to'lov qabul qilinmagan, 2 ta TV kutmoqda" }];
  let DIFFS = [{ lot: 3, at: '05.09 15:44', plate: '01M245MZ', sum: 210000, sys: "to'lov bor, naqd", ofd: "chek yo'q", note: 'kassa 15:40–16:05 uzilgan, chek navbatdan yuborilmagan' }];
  let TV = {
    '01A123BC': { brand: 'Chevrolet Nexia 3, oq', rows: [{ lot: 1, from: '05.09.2026 04:59', to: '07.09.2026 10:41', log: [['05.09 04:59', 'Kirish: kamera, ishonch 98%, evakuator 01 T 555 TT. Bayonnoma JZ 0451233, 128-modda 2-qism. YHXX, kapitan R. Toshev'], ['05.09 05:10', 'Qabul: sektor B-14, kalit bor, muhrlar, 6 ta foto, evakuator haydovchisi imzoladi'], ['06.09 14:10', "Ko'rik jurnali: egasi hujjatlar papkasini oldi, YHXB og'zaki ruxsati, xodim N. Sobirov"], ['07.09 07:49', "To'lov 340 000 (evakuatsiya 210 000 + 52 soat × 2 500), karta, chek FP 5A21 9C0E 7B44"], ['07.09 09:12', 'Ruxsatnoma RX-2609-00417, Jizzax sh. YHXB, mayor D. Ergashev (IIV kabineti)'], ['07.09 09:20', 'Oluvchi: Rahimov Bekzod Anvarovich, AD 1234567'], ['07.09 10:41', 'Chiqish: kamera, shartlar bajarilgan, shlagbaum avtomatik. Dalolatnoma D-0001']] }, { lot: 4, from: '12.03.2026 22:15', to: '14.03.2026 11:02', log: [['12.03 22:15', "Kirish: to'lanmagan jarimalar, bayonnoma GA 0221045"], ['14.03 11:02', "Chiqish: to'lov 270 000, ruxsatnoma RX-2603-00118, oluvchi Rahimov B.A. Dalolatnoma D-0087"]] }] },
    '01B777AA': { brand: 'Chevrolet Cobalt, kulrang', rows: [{ lot: 1, from: '06.09.2026 14:20', to: null, log: [['06.09 14:20', 'Kirish: kamera, evakuator 01 T 556 TT. Bayonnoma JZ 0451240, 125-modda'], ['07.09 19:56', "To'lov 265 000, naqd, chek FP 2B77 0A1C 9E53"], ['07.09 20:10', 'Egasi kutmoqda — ruxsatnoma kabinetga kelmagan']] }] },
  };
  let ACCESS = [];
  const logAccess = (what) => { ACCESS.unshift({ at: new Date(), who: user.name, org: ORGS[user.org], what }); };

  /* ---------- markaz (VPS) ---------- */
  // Server bo'lsa — ma'lumot markazdan keladi, rol va hudud SERVERDA
  // biriktiriladi (TALABLAR N-2, N-6, N-10). Server bo'lmasa — ichki
  // namuna ma'lumoti bilan ishlaydi (sinov va namoyish uchun).
  let SERVER = false;
  const nz = async (yol, usul, tana) => {
    const r = await fetch('/api/nz/' + yol, {
      method: usul || 'GET', credentials: 'same-origin',
      headers: tana ? { 'Content-Type': 'application/json' } : undefined,
      body: tana ? JSON.stringify(tana) : undefined
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw Object.assign(new Error((j && j.error) || r.statusText), { kod: r.status });
    return j;
  };
  async function yukla() {
    if (!SERVER) return;
    const [lots, days, admin, long, gaps, access] = await Promise.all([
      nz('lots'), nz('summary'), nz('admin-actions'), nz('long-stayers'), nz('gaps'), nz('access-log')
    ]);
    L = lots; DAYS = days; ADMIN = admin; LONG = long; GAPS = gaps;
    ACCESS = access.map(a => ({ at: new Date(a.at), who: a.who, org: ORGS[a.org] || a.org, what: a.what }));
    if (pii()) { try { DIFFS = (await nz('payments')).filter(x => x.diff); } catch (e) { DIFFS = []; } }
    else DIFFS = [];
  }
  async function tvYukla(key) {
    if (!SERVER) return TV[key] || null;
    try {
      const d = await nz('tv/' + encodeURIComponent(key));
      TV[key] = { brand: d.brand, rows: d.rows, hidden: d.hidden };
      return TV[key];
    } catch (e) { TV[key] = { brand: '', rows: [], hidden: 0, xato: e.message }; return TV[key]; }
  }

  /* ---------- login ---------- */
  function login() {
    root.innerHTML = `<div class="login"><div class="box"><div class="logo">JM</div><h1>Jarima maydonchalari nazorati</h1><p>Viloyat nazorat paneli. Faqat ko'rish. Har kirish va har so'rov jurnalga yoziladi.</p>
      <button class="oneid" id="oneid">OneID orqali kirish</button>
      <div class="roles">${[['hokimlik', 'viloyat', ''], ['hokimlik', 'tuman', 'Zarbdor'], ['soliq', 'viloyat', ''], ['soliq', 'tuman', 'Zarbdor'], ['prokuratura', 'viloyat', ''], ['prokuratura', 'tuman', 'Zarbdor']].map(([o, l, t]) => `<button data-o="${o}" data-l="${l}" data-t="${t}"><b>${ORGS[o]}, ${l === 'viloyat' ? 'viloyat' : t + ' tumani'}</b><small>${l === 'viloyat' ? 'barcha maydonchalar' : 'faqat ' + t + ' maydonchalari'}</small></button>`).join('')}</div>
      <p class="note">Sinovda rolni tanlang. Ishchi tizimda rol va hudud OneID hisobiga admin reestrida biriktiriladi — foydalanuvchi o'zi tanlay olmaydi.</p></div></div>`;
    $('#oneid').onclick = () => U.toast('OneID — ishchi tizimda. Sinovda rolni tanlang');
    if (SERVER) {
      $('.roles').innerHTML = `<form id="nzForm" style="grid-column:1/-1;display:grid;gap:8px">
        <input class="in" id="nzIsm" placeholder="Ism" autocomplete="username">
        <input class="in" id="nzParol" type="password" placeholder="Parol" autocomplete="current-password">
        <button class="oneid" type="submit">Kirish</button></form>`;
      $('.note').textContent = "Rol va hudud hisobingizga admin reestrida biriktirilgan — o'zgartirib bo'lmaydi.";
      $('#nzForm').onsubmit = async e => {
        e.preventDefault();
        try {
          const n = await nz('kirish', 'POST', { Ism: $('#nzIsm').value.trim(), Parol: $('#nzParol').value });
          user = { org: n.org, level: n.level, tuman: n.tuman || '', name: n.name, region: n.region || '' };
          tumanFilter = ''; await yukla(); shell();
        } catch (err) { U.toast(err.message, 'no'); }
      };
    }
    root.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { user = { org: b.dataset.o, level: b.dataset.l, tuman: b.dataset.t, name: { hokimlik: 'B. Yusupov', soliq: 'D. Karimova', prokuratura: 'S. Toshmatov' }[b.dataset.o] }; tumanFilter = ''; logAccess('Tizimga kirdi'); shell(); });
  }

  /* ---------- shell ---------- */
  let page = null;
  function shell() {
    const r = ROLES[user.org];
    root.innerHTML = `<div class="app"><nav class="rail" id="rail"><div class="logo">JM</div>${r.nav.map(([k, t, ic], i) => `<button class="${i === 0 ? 'on' : ''}" data-p="${k}">${U.icon(ic)}<span>${t}</span></button>`).join('')}<span class="sp"></span><button class="lockBtn" id="out">${U.icon('x')}<span>Chiqish</span></button><div class="who"><b>${S.esc(user.name)}</b>${ORGS[user.org]}<i></i></div></nav>
      <header class="top"><div><h1>Jarima maydonchalari nazorati</h1><div class="n">${ORGS[user.org]}, ${user.level === 'viloyat' ? (user.region ? user.region + ' viloyati' : 'viloyat') : user.tuman + ' tumani'}</div></div>
      <div class="scope">${user.level === 'viloyat' ? `<span class="mute">Hudud</span><select id="tumanSel"><option value="">Butun viloyat</option>${DISTRICTS.filter(d => L.some(l => l.tuman === d)).map(d => `<option ${tumanFilter === d ? 'selected' : ''}>${d}</option>`).join('')}</select>` : `<span class="tag">Faqat ${S.esc(user.tuman)}</span>`}</div>
      ${r.pii ? `<div class="search" id="searchBtn" role="button" tabindex="0"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>Davlat raqami bo'yicha so'rov</span><kbd>Ctrl K</kbd></div>` : ''}
      <span class="sp"></span><span class="ro">FAQAT KO'RISH</span><div class="devs" id="devs"><span><span class="dot ${sinxronSinf()} live"></span>sinxron ${sinxronMatn()}</span></div><span class="clock" id="clock"></span></header>
      <main><div class="wrap" id="view"></div></main>
      <footer class="status"><span class="last">${scopeLots().length} ta maydoncha, oxirgi sinxronizatsiya ${sinxronMatn()}</span><span class="sp"></span><span>Kirish OneID, so'rovlar jurnalda</span></footer></div>`;
    $('#out').onclick = async () => { logAccess('Chiqdi'); if (SERVER) { try { await nz('chiqish', 'POST', {}); } catch (e) {} } user = null; login(); };
    root.querySelectorAll('[data-p]').forEach(b => b.onclick = () => go(b.dataset.p));
    const ts = $('#tumanSel'); if (ts) ts.onchange = () => { tumanFilter = ts.value; logAccess('Hudud filtri: ' + (tumanFilter || 'viloyat')); go(page); };
    const sb = $('#searchBtn'); if (sb) sb.onclick = () => go('tv');
    const tick = () => { const d = new Date(); const c = $('#clock'); if (c) c.textContent = `${S.pad(d.getHours())}:${S.pad(d.getMinutes())}`; }; tick(); setInterval(tick, 1000);
    document.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && r.pii) { e.preventDefault(); go('tv'); } if (e.key === 'Escape') U.close(); };
    go(r.nav[0][0]);
  }
  // Eng eski aloqa — sinxron uzilishi yashirilmaydi (TALABLAR Sy-6, Sy-7).
  const sinxronDaq = () => { const l = scopeLots(); return l.length ? Math.max(...l.map(x => x.sync)) : 0; };
  const sinxronMatn = () => { const d = sinxronDaq(); return d >= 9999 ? "aloqa yo'q" : d + ' daq'; };
  const sinxronSinf = () => { const d = sinxronDaq(); return d > 30 ? 'no' : d > 10 ? 'warn' : 'ok'; };

  function go(p, arg) { page = p; root.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p || (p === 'lot' && b.dataset.p === 'lots'))); $('#view').innerHTML = V[p](arg); bind(); $('.wrap').scrollTop = 0; }
  const sum = (arr, k) => arr.reduce((a, l) => a + (l[k] || 0), 0);
  const pct = x => Math.round(x * 100) + '%';
  const dev = l => `<span class="dot ${l.cams[0] ? 'ok' : 'no'}"></span>kamera <span class="dot ${l.cams[1] ? 'ok' : 'no'}"></span>kamera <span class="dot ${l.kassa ? 'ok' : 'no'}"></span>kassa <span class="dot ${l.sync < 10 ? 'ok' : 'warn'}"></span>${l.sync < 10 ? 'sinx' : 'sinx ' + l.sync + ' daq'}`;
  const lotName = id => (L.find(l => l.id === id) || {}).name || '';
  const inScope = id => scopeLots().some(l => l.id === id);
  const dl = (name, rows) => { const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click(); logAccess('Eksport: ' + name); };

  /* ---------- ko'rinishlar ---------- */
  const V = {};
  V.umumiy = () => { const ls = scopeLots(); const cap = sum(ls, 'cap'); return `
    <div class="kpis"><div class="kpi"><span>Maydonchada</span><b>${sum(ls, 'inLot')}<small>/ ${cap} joy</small></b></div><div class="kpi"><span>Bugun kirdi / chiqdi</span><b>${sum(ls, 'inToday')} <small>/</small> ${sum(ls, 'outToday')}</b></div><div class="kpi"><span>Oy undirilgan, so'm</span><b>${S.fmt(sum(ls, 'month'))}</b></div><div class="kpi ok"><span>Fiskal cheklar</span><b>${sum(ls, 'ok')} / ${sum(ls, 'pays')}</b></div><div class="kpi ${sum(ls, 'long') ? 'warn' : ''}"><span>30 kundan oshgan</span><b>${sum(ls, 'long')}</b></div><div class="kpi"><span>Maydonchalar</span><b>${ls.length}<small>${ls.filter(l => l.cams[0] && l.cams[1] && l.kassa && l.sync < 10).length} ta to'liq sog'</small></b></div></div>
    <div class="two"><div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Kirish va chiqish, 14 kun</h2></div><div class="body"><div class="chart">${DAYS.map(([i, o], k) => { const f = SERVER ? 1 : ls.length / L.length; const d = new Date(Date.now() - (DAYS.length - 1 - k) * 864e5); return `<div><i style="height:${Math.round(i * f * 7)}px" title="kirdi ${i}"></i><i class="b" style="height:${Math.round(o * f * 7)}px" title="chiqdi ${o}"></i><span>${d.getDate()}</span></div>`; }).join('')}</div><div class="legend"><span><i></i>Kirdi</span><span><i class="b"></i>Chiqdi</span></div></div></div>
      <div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Bandlik</h2></div><div class="body">${ls.map(l => `<div class="hbar"><span>${S.esc(l.name)}</span><b><i class="${l.inLot / l.cap > .85 ? 'hot' : ''}" style="width:${Math.round(l.inLot / l.cap * 100)}%"></i></b><span>${l.inLot} / ${l.cap}</span></div>`).join('')}</div></div></div>
    <div class="card" style="margin-top:16px"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Ish sifati</h2><span class="mute" style="font-size:12.5px">o'rtacha saqlash, naqd ulushi, protokolsiz, blok, ruxsatnomasiz chiqarish</span></div>
    <table><tr><th>Maydoncha</th><th class="r">O'rtacha saqlash</th><th class="r">Naqd</th><th class="r">Protokolsiz</th><th class="r">Blok</th><th class="r">Ruxsatnomasiz chiqarish</th><th>Uskuna</th></tr>${ls.map(l => `<tr class="row" data-lot="${l.id}"><td>${S.esc(l.name)}</td><td class="r">${Math.round(l.avgH / 24 * 10) / 10} sutka</td><td class="r">${pct(l.cash)}</td><td class="r">${l.noProto || '—'}</td><td class="r">${l.blocked || '—'}</td><td class="r"><span class="st ${l.noPerm ? 'no' : 'ok'}">${l.noPerm || 0}</span></td><td>${dev(l)}</td></tr>`).join('')}</table></div>`; };
  V.lots = () => { const ls = scopeLots(); return `<div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Maydonchalar</h2><span class="mute" style="font-size:12.5px">${ls.length} ta</span><span class="sp"></span><button class="ghost" data-x="lots">CSV</button></div>
    <table><tr><th>Maydoncha</th><th>Tuman</th><th>Yuridik shaxs</th><th class="r">Joy</th><th class="r">Band</th><th class="r">Bugun</th><th class="r">Oy, so'm</th><th class="r">Cheklar</th><th>Oxirgi Z</th><th>Holat</th></tr>${ls.map(l => `<tr class="row" data-lot="${l.id}"><td><b style="font-weight:500">${S.esc(l.name)}</b></td><td class="m">${S.esc(l.tuman)}</td><td class="m">${S.esc(l.org)}, ${l.tin}</td><td class="r">${l.cap}</td><td class="r">${l.inLot}</td><td class="r">${l.inToday} / ${l.outToday}</td><td class="r">${S.fmt(l.month)}</td><td class="r ${l.ok < l.pays ? 'no' : ''}">${l.ok} / ${l.pays}</td><td class="m">${l.z}</td><td>${dev(l)}</td></tr>`).join('')}</table></div>`; };
  V.lot = id => { const l = L.find(x => x.id === id); if (!l || !inScope(id)) return `<div class="note">Bu maydoncha sizning hududingizda emas.</div>`; logAccess('Maydoncha kartasi: ' + l.name); return `<div class="lh" style="padding:0 0 12px"><button class="tb" data-back>Maydonchalar</button><span class="mute">/</span><h2 style="font-size:18px">${S.esc(l.name)}</h2><span class="mute">${S.esc(l.org)}, STIR ${l.tin}, ${S.esc(l.tuman)} tumani</span></div>
    <div class="kpis"><div class="kpi"><span>Band</span><b>${l.inLot}<small>/ ${l.cap}</small></b></div><div class="kpi"><span>Bugun kirdi / chiqdi</span><b>${l.inToday} / ${l.outToday}</b></div><div class="kpi"><span>Oy undirilgan</span><b>${S.fmt(l.month)}</b></div><div class="kpi ${l.ok < l.pays ? 'no' : 'ok'}"><span>Cheklar</span><b>${l.ok} / ${l.pays}</b></div><div class="kpi"><span>O'rtacha saqlash</span><b>${l.avgH}<small>soat</small></b></div><div class="kpi ${l.long ? 'warn' : ''}"><span>30 kundan oshgan</span><b>${l.long}</b></div></div>
    <div class="two"><div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Uskuna</h2></div><div class="body"><ul class="tl2"><li><span>Kirish kamerasi</span><span><span class="dot ${l.cams[0] ? 'ok' : 'no'}"></span>${l.cams[0] ? 'ulangan, FTP 1 daq' : 'uzilgan'}</span></li><li><span>Chiqish kamerasi</span><span><span class="dot ${l.cams[1] ? 'ok' : 'no'}"></span>${l.cams[1] ? 'ulangan' : 'uzilgan, 04:12 dan'}</span></li><li><span>Kassa (EPOS)</span><span><span class="dot ${l.kassa ? 'ok' : 'no'}"></span>${l.kassa ? 'ulangan' : 'uzilgan'}</span></li><li><span>Sinxronizatsiya</span><span>${l.sync} daqiqa oldin</span></li><li><span>Oxirgi Z-hisobot</span><span>${l.z}</span></li><li><span>IIV ga kadr uzatish (5-a1)</span><span class="warn">YHXBB manzili kutilmoqda</span></li></ul></div></div>
    <div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Oxirgi hodisalar</h2></div><div class="body"><ul class="tl2"><li><span>07.09 10:41</span><span>Chiqish: ${plate('01A123BC')} — shartlar bajarilgan, shlagbaum avtomatik</span></li><li><span>07.09 10:40</span><span>Kirish: ${plate('01K996KA')}, evakuator ${plate('01T555TT')}</span></li><li><span>07.09 09:32</span><span>To'lov 340 000, karta, chek FP 5A21 9C0E 7B44</span></li><li><span>06.09 17:20</span><span>Rahbar: qaytarish 265 000, ${plate('01B777AA')} — soat noto'g'ri hisoblangan</span></li><li><span>06.09 19:02</span><span>Smena yopildi, Z-hisobot № 71</span></li></ul></div></div></div>`; };
  V.sifat = () => { const ls = scopeLots(); return `<div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Uskuna va ish sifati</h2></div><table><tr><th>Maydoncha</th><th>Kirish kamerasi</th><th>Chiqish kamerasi</th><th>Kassa</th><th>Sinxron</th><th class="r">Avto chiqish</th><th class="r">Naqd</th><th class="r">O'rtacha saqlash</th></tr>${ls.map(l => `<tr class="row" data-lot="${l.id}"><td>${S.esc(l.name)}</td><td><span class="dot ${l.cams[0] ? 'ok' : 'no'}"></span>${l.cams[0] ? 'ulangan' : 'uzilgan'}</td><td><span class="dot ${l.cams[1] ? 'ok' : 'no'}"></span>${l.cams[1] ? 'ulangan' : 'uzilgan'}</td><td><span class="dot ${l.kassa ? 'ok' : 'no'}"></span>${l.kassa ? 'ulangan' : 'uzilgan'}</td><td><span class="dot ${l.sync < 10 ? 'ok' : 'warn'}"></span>${l.sync} daq</td><td class="r">${l.cams[1] ? '96%' : '71%'}</td><td class="r">${pct(l.cash)}</td><td class="r">${l.avgH} soat</td></tr>`).join('')}</table></div><p class="hint">Kamera uzilgan davrda chiqish qo'lda tasdiqlanadi — dalil kamayadi. Kassa uzilsa to'lov qabul qilinmaydi — egasi kutadi. Bu ko'rsatkichlar xizmat sifati o'lchovi.</p>`; };
  V.soliq = () => { const ls = scopeLots(); const cashSum = ls.reduce((a, l) => a + l.month * l.cash, 0), tot = sum(ls, 'month'); const diffs = DIFFS.filter(d => inScope(d.lot)); return `<div class="note">Tizimdagi har bir to'lov OFD dagi fiskal chek bilan solishtiriladi (VMQ 149, 3-ilova 8–9, 11-band). Farq — to'lov bor, chek yo'q, yoki aksincha.</div>
    <div class="kpis"><div class="kpi"><span>To'lovlar</span><b>${sum(ls, 'pays')}</b></div><div class="kpi"><span>Summa, so'm</span><b>${S.fmt(tot)}</b></div><div class="kpi ok"><span>Fiskal cheklar</span><b>${sum(ls, 'ok')}</b></div><div class="kpi ${diffs.length ? 'no' : 'ok'}"><span>OFD bilan farq</span><b>${diffs.length}</b></div><div class="kpi"><span>Naqd</span><b>${tot ? pct(cashSum / tot) : '—'}</b></div><div class="kpi"><span>Karta, o'tkazma</span><b>${tot ? pct(1 - cashSum / tot) : '—'}</b></div></div>
    <div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Fiskal sverka, sentabr 2026</h2><span class="sp"></span><button class="ghost" data-x="soliq">CSV</button></div><table><tr><th>Maydoncha</th><th>STIR</th><th class="r">To'lovlar</th><th class="r">Summa</th><th class="r">Naqd</th><th class="r">Karta</th><th class="r">Fiskal</th><th class="r">OFD farqi</th><th>Oxirgi Z</th><th>Holat</th></tr>${ls.map(l => `<tr class="row" data-lot="${l.id}"><td>${S.esc(l.name)}</td><td class="m">${l.tin}</td><td class="r">${l.pays}</td><td class="r">${S.fmt(l.month)}</td><td class="r">${S.fmt(l.month * l.cash)}</td><td class="r">${S.fmt(l.month * (1 - l.cash))}</td><td class="r">${l.ok}</td><td class="r">${l.ofdDiff ? `<span class="st no">${l.ofdDiff}</span>` : '0'}</td><td class="m">${l.z}</td><td>${l.ofdDiff ? "<span class='tag no'>1 to'lov, chek yo'q</span>" : l.kassa ? "<span class='tag ok'>mos</span>" : "<span class='tag warn'>kassa uzilgan</span>"}</td></tr>`).join('')}</table></div>
    <div class="card" style="margin-top:16px"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Farqlar</h2></div><table><tr><th>Sana</th><th>Maydoncha</th><th>TV</th><th class="r">Summa</th><th>Tizimda</th><th>OFD da</th><th>Izoh</th></tr>${diffs.length ? diffs.map(d => `<tr><td class="m">${d.at}</td><td>${lotName(d.lot)}</td><td>${plate(d.plate)}</td><td class="r">${S.fmt(d.sum)}</td><td>${d.sys}</td><td class="st no">${d.ofd}</td><td class="m">${d.note}</td></tr>`).join('') : '<tr><td colspan="7" class="m">Farq yo\u2018q</td></tr>'}</table></div>`; };
  V.qonun = () => { const ls = scopeLots(); const adm = ADMIN.filter(a => inScope(a.lot)), lg = LONG.filter(x => inScope(x.lot)), gaps = GAPS.filter(g => inScope(g.lot)); return `
    <div class="kpis"><div class="kpi ${sum(ls, 'noPerm') ? 'no' : 'ok'}"><span>Ruxsatnomasiz chiqarish</span><b>${sum(ls, 'noPerm')}</b></div><div class="kpi"><span>Chiqarilgan, 30 kun</span><b>${sum(ls, 'out30')}</b></div><div class="kpi warn"><span>30 kundan oshgan</span><b>${lg.length}</b></div><div class="kpi"><span>Bloklangan</span><b>${sum(ls, 'blocked')}</b></div><div class="kpi"><span>Rahbar amallari</span><b>${adm.length}</b></div><div class="kpi ${sum(ls, 'noProto') ? 'warn' : ''}"><span>Protokolsiz, 24 soatdan ko'p</span><b>${sum(ls, 'noProto')}</b></div></div>
    <div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Rahbar amallari — qaytarish, tuzatish, blok, imtiyoz, hujjat asosida</h2><span class="mute" style="font-size:12.5px">har amal PIN bilan, sabab bilan, o'chirib bo'lmaydi</span><span class="sp"></span><button class="ghost" data-x="admin">CSV</button></div><table><tr><th>Sana</th><th>Maydoncha</th><th>Amal</th><th>TV</th><th class="r">Summa</th><th>Sabab</th><th>Rahbar</th></tr>${adm.map(a => `<tr><td class="m">${a.at}</td><td>${lotName(a.lot)}</td><td><span class="tag ${a.act === 'Bloklash' ? 'warn' : a.act === 'Imtiyoz' || a.act === 'Hujjat asosida' ? 'no' : ''}">${a.act}</span></td><td>${plate(a.plate)}</td><td class="r">${a.sum ? S.fmt(a.sum) : '—'}</td><td class="m">${S.esc(a.reason)}</td><td class="m">${a.by}</td></tr>`).join('') || '<tr><td colspan="7" class="m">Yo\u2018q</td></tr>'}</table></div>
    <div class="card" style="margin-top:16px"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>30 kundan oshgan transport vositalari</h2><span class="mute" style="font-size:12.5px">keyingi tartib — YHXX ga ro'yxat, sud, realizatsiya</span><span class="sp"></span><button class="ghost" data-x="long">CSV</button></div><table><tr><th>Maydoncha</th><th>TV</th><th>Marka</th><th>Joylashtirilgan</th><th class="r">Kun</th><th class="r">Hisob, so'm</th></tr>${lg.map(x => `<tr><td>${lotName(x.lot)}</td><td>${plate(x.plate)}</td><td class="m">${x.brand}</td><td class="m">${x.at}</td><td class="r st warn">${x.days}</td><td class="r">${S.fmt(x.sum)}</td></tr>`).join('') || '<tr><td colspan="6" class="m">Yo\u2018q</td></tr>'}</table></div>
    <div class="card" style="margin-top:16px"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Dalil uzilishlari</h2><span class="mute" style="font-size:12.5px">kamera yoki kassa uzilgan davrlar</span></div><table><tr><th>Maydoncha</th><th>Uskuna</th><th>Davr</th><th>Shu davrda</th></tr>${gaps.map(g => `<tr><td>${lotName(g.lot)}</td><td>${g.dev}</td><td class="m">${g.period}</td><td class="st warn">${g.effect}</td></tr>`).join('') || '<tr><td colspan="4" class="m">Yo\u2018q</td></tr>'}</table></div>`; };
  V.tv = q => { const key = q ? S.normPlate(q) : ''; let rec = key ? TV[key] : null;
    if (key && !rec && SERVER) { tvYukla(key).then(() => { if (page === 'tv') go('tv', q); }); return `<div class="card"><div class="lh"><h2>TV so'rovi</h2></div><div class="note">Qidirilmoqda…</div></div>`; } if (key) logAccess('TV so\u2018rovi: ' + S.prettyPlate(key)); const rows = rec ? rec.rows.filter(r => inScope(r.lot)) : [];
    return `<div class="card"><div class="lh"><h2>TV bo'yicha so'rov</h2><span class="mute" style="font-size:12.5px">${user.level === 'viloyat' ? 'viloyat' : user.tuman + ' tumani'} maydonchalari, arxiv bilan</span><span class="sp"></span><input class="q" id="tvq" placeholder="Davlat raqami" value="${S.esc(q || '')}" style="width:220px;font-weight:600"><button class="primary" id="tvGo" style="height:34px;padding:0 14px;font-size:13.5px">Qidirish</button></div></div>
    ${key ? (rec && rows.length ? `<div style="display:flex;align-items:center;gap:16px;margin:16px 0 8px">${U.plate(key, 'md')}<span>${S.esc(rec.brand)}</span><span class="mute">${rows.length} ta yozuv${rec.rows.length > rows.length ? ', ' + (rec.rows.length - rows.length) + ' ta boshqa hududda (ko\u2018rinmaydi)' : ''}</span></div>${rows.map(r => `<div class="card" style="margin-top:12px"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>${lotName(r.lot)}, ${r.from}${r.to ? ' — ' + r.to : ' — hozir maydonchada'}</h2></div><div class="body"><ul class="tl2">${r.log.map(l => `<li><span>${l[0]}</span><span>${S.esc(l[1])}</span></li>`).join('')}</ul>${r.to ? `<div class="frames"><div><div class="frame">${U.frame({ plate: key, color: 'oq', conf: 98, entryFrame: true, enteredAt: new Date() }, 'in', new Date(), true)}</div><p class="cap">Kirish kadri</p></div><div><div class="frame">${U.frame({ plate: key, color: 'oq', conf: 98, exits: [{ frame: true }] }, 'out', new Date(), true)}</div><p class="cap">Chiqish kadri</p></div></div>` : ''}</div></div>`).join('')}` : `<div class="note" style="margin-top:16px">${rec ? 'Bu TV bo\u2018yicha yozuvlar boshqa hududda — sizning vakolatingizdan tashqarida.' : 'Topilmadi. Sinovda: 01 A 123 BC, 01 B 777 AA.'}</div>`) : `<div class="note" style="margin-top:16px">Bitta raqam — hududdagi barcha maydonchalar bo'yicha to'liq tarix: kirish, qabul, ko'rik jurnali, to'lovlar va cheklar, ruxsatnoma, oluvchi, kadrlar, dalolatnoma. Har so'rov jurnalga yoziladi.</div>`}`; };
  V.hisobot = () => { const ls = scopeLots(); return `<div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Hisobotlar</h2><span class="mute" style="font-size:12.5px">${user.level === 'viloyat' ? 'viloyat' : user.tuman} bo'yicha, oylik</span></div><div class="body" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    <button class="ghost" data-x="month" style="height:auto;padding:14px;text-align:left"><b style="display:block">Oylik yig'ma</b><span class="mute" style="font-size:12.5px">maydoncha bo'yicha kirdi, chiqdi, undirilgan, cheklar</span></button>
    <button class="ghost" data-x="long" style="height:auto;padding:14px;text-align:left"><b style="display:block">30/60/90 kun</b><span class="mute" style="font-size:12.5px">uzoq turgan TV ro'yxati — YHXX ga</span></button>
    ${pii() ? `<button class="ghost" data-x="soliq" style="height:auto;padding:14px;text-align:left"><b style="display:block">Soliq formati</b><span class="mute" style="font-size:12.5px">STIR, TV, kirish-chiqish, summa, chek</span></button>` : `<button class="ghost" data-x="quality" style="height:auto;padding:14px;text-align:left"><b style="display:block">Ish sifati</b><span class="mute" style="font-size:12.5px">saqlash muddati, naqd ulushi, uskuna</span></button>`}</div></div>
    <div class="card" style="margin-top:16px"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Oylik yig'ma, sentabr 2026</h2></div><table><tr><th>Maydoncha</th><th class="r">Band</th><th class="r">Oy undirilgan</th><th class="r">Cheklar</th><th class="r">30+ kun</th><th class="r">Rahbar amallari</th></tr>${ls.map(l => `<tr><td>${S.esc(l.name)}</td><td class="r">${l.inLot}/${l.cap}</td><td class="r">${S.fmt(l.month)}</td><td class="r">${l.ok}/${l.pays}</td><td class="r">${l.long}</td><td class="r">${l.admin}</td></tr>`).join('')}<tr style="font-weight:600"><td>Jami</td><td class="r">${sum(ls, 'inLot')}/${sum(ls, 'cap')}</td><td class="r">${S.fmt(sum(ls, 'month'))}</td><td class="r">${sum(ls, 'ok')}/${sum(ls, 'pays')}</td><td class="r">${sum(ls, 'long')}</td><td class="r">${sum(ls, 'admin')}</td></tr></table></div>`; };
  V.kirish = () => `<div class="card"><div class="lh" style="border-bottom:1px solid var(--hair)"><h2>Mening kirish jurnalim</h2><span class="mute" style="font-size:12.5px">har kirish, so'rov va eksport — o'chirib bo'lmaydi</span></div><table><tr><th>Vaqt</th><th>Kim</th><th>Tashkilot</th><th>Amal</th></tr>${ACCESS.map(a => `<tr><td class="m">${S.dt(a.at)}</td><td>${S.esc(a.who)}</td><td class="m">${a.org}</td><td>${S.esc(a.what)}</td></tr>`).join('')}</table></div>`;

  function bind() {
    root.querySelectorAll('tr.row[data-lot]').forEach(r => r.onclick = () => go('lot', +r.dataset.lot));
    root.querySelectorAll('[data-back]').forEach(b => b.onclick = () => go('lots'));
    const tq = $('#tvq'); if (tq) { const run = () => go('tv', tq.value); $('#tvGo').onclick = run; tq.onkeydown = e => { if (e.key === 'Enter') run(); }; if (!tq.value) tq.focus(); }
    root.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const ls = scopeLots(); const k = b.dataset.x;
      if (k === 'lots' || k === 'month' || k === 'quality') dl(`maydonchalar-${S.iso(new Date())}.csv`, [['Maydoncha', 'Tuman', 'Yuridik shaxs', 'STIR', 'Joy', 'Band', 'Oy undirilgan', 'Cheklar', "O'rtacha saqlash, soat", 'Naqd ulushi'], ...ls.map(l => [l.name, l.tuman, l.org, l.tin, l.cap, l.inLot, l.month, `${l.ok}/${l.pays}`, l.avgH, l.cash])]);
      if (k === 'soliq') dl(`fiskal-sverka-${S.iso(new Date())}.csv`, [['Maydoncha', 'STIR', "To'lovlar", 'Summa', 'Naqd', 'Karta', 'Fiskal cheklar', 'OFD farqi', 'Oxirgi Z'], ...ls.map(l => [l.name, l.tin, l.pays, l.month, Math.round(l.month * l.cash), Math.round(l.month * (1 - l.cash)), l.ok, l.ofdDiff, l.z])]);
      if (k === 'admin') dl(`rahbar-amallari-${S.iso(new Date())}.csv`, [['Sana', 'Maydoncha', 'Amal', 'TV', 'Summa', 'Sabab', 'Rahbar'], ...ADMIN.filter(a => inScope(a.lot)).map(a => [a.at, lotName(a.lot), a.act, pii() ? a.plate : 'TV', a.sum, a.reason, a.by])]);
      if (k === 'long') dl(`uzoq-turganlar-${S.iso(new Date())}.csv`, [['Maydoncha', 'TV', 'Marka', 'Joylashtirilgan', 'Kun', 'Hisob'], ...LONG.filter(x => inScope(x.lot)).map(x => [lotName(x.lot), pii() ? x.plate : 'TV', x.brand, x.at, x.days, x.sum])]);
      U.toast('CSV yuklandi', 'ok'); });
  }

  const q = new URLSearchParams(location.search);
  (async () => {
    // Markaz serveri bormi? Bo'lsa — rol va hudud undan keladi.
    try {
      const n = await nz('men');
      SERVER = true;
      user = { org: n.org, level: n.level, tuman: n.tuman || '', name: n.name, region: n.region || '' };
      await yukla(); shell();
      if (q.get('v')) go(q.get('v'), q.get('q') || undefined);
      yangilab();
      return;
    } catch (e) {
      if (e.kod === 401) { SERVER = true; return login(); }
    }
    // Server yo'q — ichki namuna ma'lumoti (sinov va namoyish).
    if (q.get('rol')) {
      user = { org: q.get('rol'), level: q.get('tuman') ? 'tuman' : 'viloyat', tuman: q.get('tuman') || '', name: { hokimlik: 'B. Yusupov', soliq: 'D. Karimova', prokuratura: 'S. Toshmatov' }[q.get('rol')] || 'Foydalanuvchi' };
      logAccess('Tizimga kirdi'); shell();
      if (q.get('v')) go(q.get('v'), q.get('q') || undefined);
    } else login();
  })();

  // Markaz ma'lumoti daqiqada bir yangilanadi; ochiq sahifa qayta chiziladi.
  function yangilab() {
    setInterval(async () => {
      if (!SERVER || !user) return;
      try { await yukla(); if (page) go(page); } catch (e) { /* aloqa uzildi — keyingi urinishda */ }
    }, 60000);
  }
  window.NZ = { go, login };
})();
