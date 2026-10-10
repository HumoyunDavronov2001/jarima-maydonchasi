/* JM Hovli — hovli xodimi mobil ilovasi. Terminalga QR bilan ulanadi, LAN, internet kerak emas. */
(function () {
  const $ = s => document.querySelector(s), app = $('#app');
  const h = n => new Date(Date.now() - n * 36e5), pad = n => String(n).padStart(2, '0');
  const dm = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const tm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = p => (p || '').replace(/[\s-]/g, '').toUpperCase();
  const pretty = p => { if (!p) return 'raqamsiz'; const reg = p.slice(0, 2), rest = p.slice(2); if (/^\d{2}$/.test(reg)) { if (/^[A-Z]\d{3}[A-Z]{2}$/.test(rest)) return `${reg} ${rest[0]} ${rest.slice(1, 4)} ${rest.slice(4)}`; if (/^\d{3}[A-Z]{3}$/.test(rest)) return `${reg} ${rest.slice(0, 3)} ${rest.slice(3)}`; } return p; };
  const plate = (p, lg) => { if (!p) return `<span class="plate ${lg ? 'lg' : ''}"><i>raqamsiz</i></span>`; const reg = p.slice(0, 2), rest = p.slice(2); const uz = /^\d{2}$/.test(reg) && (/^[A-Z]\d{3}[A-Z]{2}$/.test(rest) || /^\d{3}[A-Z]{3}$/.test(rest) || /^[A-Z]\d{4}$/.test(rest)); const mid = /^[A-Z]\d{3}[A-Z]{2}$/.test(rest) ? `${rest[0]} ${rest.slice(1, 4)} ${rest.slice(4)}` : /^\d{3}[A-Z]{3}$/.test(rest) ? `${rest.slice(0, 3)} ${rest.slice(3)}` : rest; return uz ? `<span class="plate ${lg ? 'lg' : ''}"><b>${reg}</b><i>${mid}</i></span>` : `<span class="plate ${lg ? 'lg' : ''}"><i>${esc(p)}</i></span>`; };
  const I = {
    list: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>', scan: '<svg viewBox="0 0 24 24"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/></svg>',
    car: '<svg viewBox="0 0 24 24"><path d="M3 11l2-5h14l2 5"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15" r="1.3"/><circle cx="16.5" cy="15" r="1.3"/></svg>', user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>', cam: '<svg class="cam" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>', chk: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2"><path d="m9 5 7 7-7 7"/></svg>', qr: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/></svg>', x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>', refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>'
  };

  /* ---------- saqlash ---------- */
  const store = { get: k => { try { return JSON.parse(localStorage.getItem('jm.' + k)); } catch { return null; } }, set: (k, v) => localStorage.setItem('jm.' + k, JSON.stringify(v)), del: k => localStorage.removeItem('jm.' + k) };
  let conn = store.get('conn'), session = store.get('session'), queue = store.get('queue') || [];

  /* ---------- API: real (fetch) yoki sinov ---------- */
  const MAND = ['Old', 'Orqa', 'Chap', "O'ng"], OPT = ['Salon', 'Zarar', 'Zarar 2', 'Odometr'];
  const SEALS = [['eshik', 'Eshiklar'], ['yukxona', 'Yukxona'], ['kapot', 'Kapot'], ['bak', "Bak qopqog'i"]];
  const mock = {
    users: [{ name: 'Hovli xodimi', pin: '0000' }, { name: 'N. Sobirov', pin: '1111' }, { name: 'A. Karimov', pin: '1234' }],
    V: [
      { id: 1, plate: '01K996KA', brand: '', color: '#9AA0A6', enteredAt: h(0.3), truck: '01T555TT', sector: '', keys: null, items: [], seals: {}, damage: '', photos: {}, driver: '', accepted: false, status: 'IN' },
      { id: 2, plate: '10C007DD', brand: 'Kia K5, qora', color: '#22262B', enteredAt: h(9), truck: '01T555TT', sector: 'A-07', keys: false, items: ['Salonda hujjatlar papkasi'], seals: {}, damage: "O'ng old eshik deformatsiya, fara singan.", photos: { Old: 'svg', Zarar: 'svg' }, driver: '', accepted: false, status: 'IN' },
      { id: 3, plate: null, vin: 'KL1TD6XX8HB123456', brand: 'Chevrolet Lacetti, kumush', color: '#C9CDD3', enteredAt: h(6), truck: '01T556TT', sector: 'B-05', keys: true, items: [], seals: { eshik: 1, yukxona: 1, kapot: 1, bak: 1 }, damage: '', photos: { Old: 'svg', Orqa: 'svg', Chap: 'svg', "O'ng": 'svg' }, driver: 'B. Rahimov', accepted: true, status: 'IN' },
      { id: 4, plate: '01A123BC', brand: 'Chevrolet Nexia 3, oq', color: '#E3E6EA', enteredAt: h(52), truck: '01T555TT', sector: 'B-14', keys: true, items: ['Hujjatlar papkasi'], seals: { eshik: 1, yukxona: 1, kapot: 1, bak: 1 }, damage: 'Old bamper chap tomoni tirnalgan.', photos: { Old: 'svg', Orqa: 'svg', Chap: 'svg', "O'ng": 'svg', Salon: 'svg' }, driver: 'S. Abdullayev', accepted: true, status: 'IN', ready: true, access: [{ at: h(20), who: 'Rahimov B., AD 1234567', purpose: 'Hujjat olish', organ: 'YHXB, mayor D. Ergashev', by: 'N. Sobirov' }] },
      { id: 5, plate: '01B777AA', brand: 'Chevrolet Cobalt, kulrang', color: '#8B929B', enteredAt: h(30), truck: '01T556TT', sector: 'A-03', keys: true, items: [], seals: { eshik: 1, yukxona: 1, kapot: 1, bak: 1 }, damage: '', photos: { Old: 'svg', Orqa: 'svg', Chap: 'svg', "O'ng": 'svg' }, driver: 'S. Abdullayev', accepted: true, status: 'IN' },
    ]
  };
  const isMock = () => !conn || conn.url === 'mock';
  async function api(path, body) {
    if (isMock()) return mockApi(path, body);
    const r = await fetch(conn.url + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Token': conn.token, 'X-User': session ? session.user : '' }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
  }
  function mockApi(path, body) {
    const w = x => new Promise(r => setTimeout(() => r(x), 120));
    if (path === '/api/yard/ping') return w({ ok: true, org: 'Jizzax shahar jarima maydonchasi' });
    if (path === '/api/yard/users') return w(mock.users.map(u => u.name));
    if (path === '/api/yard/login') { const u = mock.users.find(x => x.name === body.name && x.pin === body.pin); return w(u ? { ok: true } : { error: "PIN noto'g'ri" }); }
    if (path === '/api/yard/pending') return w(mock.V.filter(v => !v.accepted && v.status === 'IN'));
    if (path === '/api/yard/list') return w(mock.V.filter(v => v.status === 'IN'));
    const m = path.match(/\/api\/vehicles\/(\d+)(?:\/(\w+))?/);
    if (m) { const v = mock.V.find(x => x.id === +m[1]); if (!v) return w({ error: 'topilmadi' });
      if (!m[2]) return w(v);
      if (m[2] === 'acceptance') { Object.assign(v, body, { accepted: true }); return w(v); }
      if (m[2] === 'photos') { Object.assign(v.photos, body.photos); return w(v); }
      if (m[2] === 'access') { (v.access = v.access || []).push(Object.assign({ at: new Date() }, body)); return w(v); }
      if (m[2] === 'sector') { v.sector = body.sector; return w(v); } }
    return w({ error: 'yo\u2018q' });
  }

  /* ---------- navigatsiya ---------- */
  let screen = null, tab = 'pending', cur = null, step = 0, shotKind = null, back = false;
  function show(name, html, cls) { screen = name; app.innerHTML = `<div class="scr ${cls || ''} ${back ? 'back' : ''}">${html}</div>`; back = false; window.scrollTo(0, 0); }
  let tt; function toast(t, k) { const e = document.createElement('div'); e.className = 'toast ' + (k || ''); e.textContent = t; document.body.appendChild(e); clearTimeout(tt); setTimeout(() => e.remove(), 2600); if (navigator.vibrate) navigator.vibrate(k === 'no' ? [40, 40, 40] : 20); }

  /* ---------- 1. ulanish ---------- */
  function connectScreen() {
    show('connect', `<div class="hero"><div class="logo">JM</div><h1>Terminalga ulanish</h1><p>Operator kompyuteridagi Sozlamalar → Hovli telefoni bo'limidagi QR kodni skanerlang. Telefon maydoncha Wi‑Fi sida bo'lishi kerak.</p></div>
      <div class="pad" style="display:flex;flex-direction:column;gap:10px;padding-bottom:calc(20px + var(--sab))"><button class="btn" id="cScan">${I.qr}QR kodni skanerlash</button><button class="btn ghost" id="cManual">Qo'lda: manzil va kod</button>${location.protocol === 'file:' ? `<button class="btn ghost" id="cMock">Sinov rejimi (serversiz)</button>` : ''}</div>`, 'dark');
    $('#cScan').onclick = () => scanner('Ulanish QR kodi', txt => { const p = parsePair(txt); if (!p) return toast('Bu ulanish kodi emas', 'no'); conn = p; store.set('conn', p); toast('Ulandi: ' + p.name, 'ok'); loginScreen(); });
    $('#cManual').onclick = () => { show('connect', `<div class="bar" style="background:transparent;border:0;color:#fff"><button class="ic" id="b" style="color:#fff">${I.back}</button><h1>Qo'lda ulanish</h1></div><div class="pad"><label class="f"><span style="color:#8E9AB3">Terminal manzili</span><input class="in" id="mUrl" placeholder="http://192.168.1.10:8080"></label><label class="f"><span style="color:#8E9AB3">Ulanish kodi (Sozlamalarda)</span><input class="in" id="mTok" placeholder="6 xonali kod"></label><button class="btn" id="mOk">Ulanish</button></div>`, 'dark'); $('#b').onclick = connectScreen; $('#mOk').onclick = async () => { const url = $('#mUrl').value.trim().replace(/\/$/, ''), tok = $('#mTok').value.trim(); if (!url || !tok) return toast('Manzil va kod majburiy', 'no'); conn = { url, token: tok, name: url }; try { const r = await api('/api/yard/ping'); conn.name = r.org || url; store.set('conn', conn); loginScreen(); } catch (e) { conn = null; toast('Terminal topilmadi: ' + e.message, 'no'); } }; };
    const mk = $('#cMock'); if (mk) mk.onclick = () => { conn = { url: 'mock', token: 'demo', name: 'Sinov: Jizzax shahar jarima maydonchasi' }; store.set('conn', conn); loginScreen(); };
  }
  function parsePair(txt) { try { const u = new URL(txt); if (u.protocol !== 'jm:' && u.pathname.indexOf('pair') < 0 && u.host !== 'pair') return null; const url = u.searchParams.get('u'), t = u.searchParams.get('t'); if (!url || !t) return null; return { url: url.replace(/\/$/, ''), token: t, name: u.searchParams.get('n') || url }; } catch { return null; } }

  /* ---------- 2. PIN ---------- */
  async function loginScreen() {
    let users = []; try { users = await api('/api/yard/users'); } catch { users = []; }
    let who = users[0] || '', pin = '';
    const render = () => { show('login', `<div class="hero" style="justify-content:flex-start;padding-top:calc(40px + var(--sat))"><div class="logo">JM</div><h1 style="font-size:20px">${esc(conn.name)}</h1><p>Xodimni tanlang va PIN kiriting</p>
      <div class="chips" style="justify-content:center">${users.map(u => `<button class="chip ${u === who ? 'on' : ''}" data-u="${esc(u)}" style="${u === who ? '' : 'background:#1A2236;color:#fff;border-color:#2A3550'}">${esc(u)}</button>`).join('')}</div>
      <div class="pinbox">${[0, 1, 2, 3].map(i => `<i class="${pin.length > i ? 'f' : ''}"></i>`).join('')}</div>
      <div class="pad4">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}<button class="x" data-n="c">Boshqa terminal</button><button data-n="0">0</button><button class="x" data-n="d">←</button></div></div>`, 'dark');
      app.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { who = b.dataset.u; render(); });
      app.querySelectorAll('[data-n]').forEach(b => b.onclick = async () => { const n = b.dataset.n; if (n === 'c') { store.del('conn'); conn = null; return connectScreen(); } if (n === 'd') { pin = pin.slice(0, -1); return render(); } if (pin.length >= 4) return; pin += n; render(); if (pin.length === 4) { const r = await api('/api/yard/login', { name: who, pin }); if (r.error) { toast(r.error, 'no'); pin = ''; return render(); } session = { user: who, at: Date.now() }; store.set('session', session); toast('Xush kelibsiz, ' + who, 'ok'); home(); } });
    };
    render();
  }

  /* ---------- 3. asosiy: tablar ---------- */
  async function home(t) { if (t) tab = t; const pend = (await api('/api/yard/pending')).length;
    const tabsHtml = `<nav class="tabs"><button class="${tab === 'pending' ? 'on' : ''}" data-t="pending">${I.list}${pend ? `<b>${pend}</b>` : ''}<span>Kelganlar</span></button><button class="${tab === 'scan' ? 'on' : ''}" data-t="scan">${I.scan}<span>Skaner</span></button><button class="${tab === 'lot' ? 'on' : ''}" data-t="lot">${I.car}<span>Maydoncha</span></button><button class="${tab === 'me' ? 'on' : ''}" data-t="me">${I.user}<span>Men</span></button></nav>`;
    if (tab === 'pending') { const list = await api('/api/yard/pending'); show('home', `<div class="bar"><h1>Yangi kelganlar<span class="sub">${list.length} ta qabul kutmoqda, ${tm(new Date())}</span></h1><button class="ic" id="rf">${I.refresh}</button></div><main class="pad">${list.length ? list.map(item).join('') : `<div class="empty">${I.car}<div>Hozircha yangi mashina yo'q</div></div>`}</main>${tabsHtml}`); }
    if (tab === 'lot') { const list = await api('/api/yard/list'); show('home', `<div class="bar"><h1>Maydonchada<span class="sub">${list.length} ta mashina</span></h1></div><main class="pad"><input class="in" id="lq" placeholder="Raqam, VIN, sektor" style="margin-bottom:10px"><div id="lotList">${list.map(item).join('')}</div></main>${tabsHtml}`); $('#lq').oninput = () => { const q = norm($('#lq').value); $('#lotList').innerHTML = list.filter(v => !q || norm(v.plate || '').includes(q) || (v.vin || '').toUpperCase().includes(q) || (v.sector || '').toUpperCase().includes(q)).map(item).join(''); bindItems(); }; }
    if (tab === 'scan') { show('home', `<div class="bar"><h1>Skaner<span class="sub">Oynadagi QR yorliq yoki raqam</span></h1></div><main class="pad" style="display:flex;flex-direction:column;gap:10px;justify-content:center"><button class="btn" id="sQr" style="height:120px;flex-direction:column">${I.qr}<span>Mashinaning QR yorlig'ini skanerlash</span></button><button class="btn soft" id="sPlate">${I.car}Raqamni kiritish</button><p class="lead" style="text-align:center;margin-top:6px">QR yorliq — operator terminalidan chop etiladi, oynaga yopishtiriladi. Skanerlansa mashina ochiladi.</p></main>${tabsHtml}`); $('#sQr').onclick = () => scanner("Mashina QR yorlig'i", async txt => { const m = txt.match(/jm:\/\/car\/(\d+)|\/v\/(\d+)|^\d+$/); const id = m ? +(m[1] || m[2] || m[0]) : null; if (!id) return toast('Bu mashina yorlig\u2018i emas', 'no'); carScreen(id); }); $('#sPlate').onclick = async () => { const p = prompt('Davlat raqami:'); if (!p) return; const list = await api('/api/yard/list'); const v = list.find(x => norm(x.plate || '') === norm(p)); if (!v) return toast('Topilmadi', 'no'); carScreen(v.id); }; }
    if (tab === 'me') { let ping = null; try { ping = await api('/api/yard/ping'); } catch { ping = null; } show('home', `<div class="bar"><h1>${esc(session.user)}<span class="sub">hovli xodimi</span></h1></div><main class="pad"><div class="card"><div class="kv"><span>Terminal</span><span>${esc(conn.name)}</span></div><div class="kv"><span>Manzil</span><span style="font-size:13px">${esc(conn.url)}</span></div><div class="kv"><span>Aloqa</span><span><span class="dot ${ping ? 'ok' : 'no'}"></span>${ping ? 'ulangan' : "yo'q"}</span></div><div class="kv"><span>Navbatda (yuborilmagan)</span><span>${queue.length}</span></div></div><button class="btn soft" id="meSync" style="margin-bottom:10px">${I.refresh}Navbatni yuborish</button><button class="btn soft" id="meOut" style="margin-bottom:10px">Chiqish</button><button class="btn ghost" id="meConn">Boshqa terminalga ulanish</button><p class="lead" style="text-align:center;margin-top:16px">JM Hovli v1 · LAN, internet kerak emas · ma'lumot maydonchadan chiqmaydi</p></main>${tabsHtml}`); $('#meOut').onclick = () => { store.del('session'); session = null; loginScreen(); }; $('#meConn').onclick = () => { store.del('conn'); store.del('session'); conn = null; session = null; connectScreen(); }; $('#meSync').onclick = flush; }
    app.querySelectorAll('.tabs button').forEach(b => b.onclick = () => home(b.dataset.t));
    const rf = $('#rf'); if (rf) rf.onclick = () => home();
    bindItems();
  }
  const missing = v => MAND.filter(k => !v.photos[k]);
  function item(v) { const miss = missing(v).length; const pill = v.accepted ? (v.ready ? '<span class="pill ok">chiqarishga tayyor</span>' : '<span class="pill ok">qabul qilingan</span>') : !v.sector ? '<span class="pill warn">sektor yo\u2018q</span>' : miss ? `<span class="pill warn">foto ${4 - miss}/4</span>` : '<span class="pill warn">imzo yo\u2018q</span>'; return `<div class="item" data-id="${v.id}">${plate(v.plate)}<div class="t"><b>${esc(v.brand) || 'Marka yo\u2018q'}</b><small>${dm(new Date(v.enteredAt))}${v.sector ? ' · ' + v.sector : ''}${v.truck ? ' · evak.' : ''}</small></div>${pill}<span class="chev">${I.chev}</span></div>`; }
  function bindItems() { app.querySelectorAll('.item[data-id]').forEach(i => i.onclick = () => carScreen(+i.dataset.id)); }

  /* ---------- 4. mashina ---------- */
  async function carScreen(id) { cur = await api('/api/vehicles/' + id); if (!cur || cur.error) return toast('Topilmadi', 'no'); cur.enteredAt = new Date(cur.enteredAt); step = cur.sector ? 1 : 0; if (cur.accepted) summary(); else render(); }
  function head(title) { return `<div class="bar"><button class="ic" id="b">${I.back}</button><h1>${plate(cur.plate)} <span style="font-weight:400;font-size:13px;color:var(--mute)">${esc(cur.brand || '')}</span><span class="sub">${title}</span></h1></div>`; }
  function summary() {
    const v = cur; show('car', `${head('Qabul qilingan, ' + dm(v.enteredAt))}<main class="pad">
      <div class="sum"><div><span>Sektor</span><b>${v.sector || '—'}</b></div><div><span>Fotolar</span><b>${Object.keys(v.photos).length} ta</b></div><div><span>Kalit</span><b>${v.keys ? 'bor' : "yo'q"}</b></div><div><span>Muhrlar</span><b>${SEALS.filter(([k]) => v.seals[k]).map(([, t]) => t).join(', ') || '—'}</b></div><div><span>Buyumlar</span><b>${(v.items || []).join(', ') || "yo'q"}</b></div><div><span>Shikast</span><b>${esc(v.damage) || 'qayd etilmagan'}</b></div><div><span>Evakuator</span><b>${v.driver ? esc(v.driver) + ', ' : ''}${pretty(v.truck || '')}</b></div>${v.ready ? `<div><span>Holat</span><b class="okc">chiqarishga tayyor — darvozaga olib boring</b></div>` : ''}</div>
      <div class="grid" style="margin-bottom:10px">${Object.keys(v.photos).map(k => tile(k, v, false)).join('')}</div>
      <button class="btn soft" id="addPhoto" style="margin-bottom:10px">${I.cam}Foto qo'shish</button>
      <button class="btn soft" id="sector" style="margin-bottom:10px">Sektorni o'zgartirish</button>
      <button class="btn" id="access">Ko'rik yozuvi — egasi mashina oldiga keldi</button>
      <div class="sec"><h3>Ko'rik jurnali</h3>${(v.access || []).length ? v.access.map(a => `<div class="card"><div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px"><span>${dm(new Date(a.at))} · ${esc(a.by)}</span><b>${esc(a.who)} — ${esc(a.purpose)}</b><span style="font-size:13px">Organ ruxsati: ${esc(a.organ)}</span></div></div>`).join('') : '<p class="lead">Yozuv yo\u2018q</p>'}</div></main>`);
    $('#b').onclick = () => { back = true; home(); };
    $('#addPhoto').onclick = () => { step = 1; render(); };
    $('#sector').onclick = async () => { const s = prompt('Yangi sektor:', v.sector); if (!s) return; await api(`/api/vehicles/${v.id}/sector`, { sector: s }); toast('Sektor: ' + s, 'ok'); carScreen(v.id); };
    $('#access').onclick = () => accessScreen();
    app.querySelectorAll('.shot').forEach(b => b.onclick = () => { shotKind = b.dataset.k; const f = $('#file'); f.value = ''; f.click(); });
  }
  function accessScreen() {
    const v = cur; show('access', `${head("Ko'rik jurnali")}<main class="pad"><p class="lead">VMQ 149, 1-ilova 8-band: egasi mashina oldiga faqat joylashtirgan organ ruxsati bilan, xodim ishtirokida. Siz — mas'ul xodim.</p>
      <label class="f"><span>Kim keldi (F.I.O., hujjat)</span><input class="in" id="aWho"></label><label class="f"><span>Maqsad</span><select class="in" id="aP"><option>Salondan buyum olish</option><option>Ko'rik (sug'urta, ekspert)</option><option>Holatni tekshirish</option></select></label><label class="f"><span>Olingan buyumlar</span><input class="in" id="aItems" placeholder="bo'sh — olinmadi"></label><label class="f"><span>Organ ruxsati (kim, qachon)</span><input class="in" id="aOrg" placeholder="YHXB, xodim, sana"></label>
      <div class="grid"><button class="shot" data-k="Ko'rik"><span>${I.cam}</span><b>Foto</b><small>ixtiyoriy</small></button></div></main><div class="foot"><button class="btn back soft" id="b2">Bekor</button><button class="btn" id="aOk">Jurnalga yozish</button></div>`);
    $('#b').onclick = $('#b2').onclick = summary;
    $('#aOk').onclick = async () => { const who = $('#aWho').value.trim(), org = $('#aOrg').value.trim(); if (!who || !org) return toast('Kim va organ ruxsati majburiy', 'no'); await api(`/api/vehicles/${v.id}/access`, { who, purpose: $('#aP').value, items: $('#aItems').value.trim(), organ: org, by: session.user }); toast('Jurnalga yozildi', 'ok'); carScreen(v.id); };
  }
  const STEPS = ['Sektor', 'Fotolar', 'Kalit va muhr', 'Buyumlar, shikast', 'Imzo'];
  function tile(k, v, req) { const p = v.photos[k]; return `<button class="shot ${p ? 'done' : ''}" data-k="${k}">${p ? (p === 'svg' ? pic(k, v.color) : `<img src="${p}" alt="">`) + `<span class="tag">${k}</span><span class="ok">${I.chk}</span>` : `${I.cam}<b>${k}</b><small>${req ? 'majburiy' : 'ixtiyoriy'}</small>`}</button>`; }
  function render() {
    const v = cur, miss = missing(v); let body = '';
    if (step === 0) body = `<div class="h2">1. Qayerga qo'ydingiz?</div><p class="lead">Sektor va joy raqami. Marka — ko'rinishidan.</p><div class="chips" style="margin-bottom:10px">${['A', 'B', 'C'].map(s => `<button class="chip big ${(v.sector || '').startsWith(s) ? 'on' : ''}" data-sec="${s}">${s} sektor</button>`).join('')}</div><label class="f"><span>Joy raqami</span><input class="in" id="sector" inputmode="numeric" placeholder="14" value="${(v.sector || '').split('-')[1] || ''}"></label><label class="f"><span>Marka, model, rang</span><input class="in" id="brand" value="${esc(v.brand || '')}" placeholder="Chevrolet Cobalt, oq"></label>`;
    if (step === 1) body = `<div class="h2">2. Fotolar</div><p class="lead">To'rt tomon majburiy — kadr ustiga bosing, kamera ochiladi.</p><div class="grid">${MAND.map(k => tile(k, v, true)).join('')}</div><div class="sec"><h3>Ixtiyoriy</h3><div class="grid">${OPT.map(k => tile(k, v, false)).join('')}</div></div>`;
    if (step === 2) body = `<div class="h2">3. Kalit va muhrlar</div><p class="lead">VMQ 149, 1-ilova 6-band: eshiklar, yukxona, kapot, bak qopqog'i surg'uchlanadi.</p><div class="chips" style="margin-bottom:18px"><button class="chip big ${v.keys === true ? 'on' : ''}" data-keys="1">Kalit bor</button><button class="chip big ${v.keys === false ? 'on' : ''}" data-keys="0">Kalit yo'q</button></div><div class="sec"><h3>Surg'uchlandi</h3><div class="chips">${SEALS.map(([k, t]) => `<button class="chip ${v.seals[k] ? 'on' : ''}" data-seal="${k}">${t}</button>`).join('')}</div></div>`;
    if (step === 3) body = `<div class="h2">4. Buyumlar va shikast</div><p class="lead">Xodim bayonnomasidagi mol-mulk ro'yxati bilan solishtiring.</p><label class="f"><span>Salondagi buyumlar, vergul bilan</span><input class="in" id="items" value="${esc((v.items || []).join(', '))}" placeholder="hujjatlar papkasi, telefon..."></label><label class="f"><span>Shikast, holat</span><textarea class="in" id="damage" placeholder="Old bamper tirnalgan...">${esc(v.damage || '')}</textarea></label>`;
    if (step === 4) body = `<div class="h2">5. Qabul-topshirish</div><p class="lead">Evakuator haydovchisi bilan. Imzo — barmoq bilan.</p><div class="sum"><div><span>Sektor</span><b class="${v.sector ? '' : 'no'}">${v.sector || 'yo\u2018q'}</b></div><div><span>Fotolar</span><b class="${miss.length ? 'no' : 'okc'}">${4 - miss.length}/4${miss.length ? ' — ' + miss.join(', ') : ''}</b></div><div><span>Kalit</span><b>${v.keys === null ? '—' : v.keys ? 'bor' : "yo'q"}</b></div><div><span>Muhrlar</span><b>${SEALS.filter(([k]) => v.seals[k]).map(([, t]) => t).join(', ') || '—'}</b></div><div><span>Buyumlar</span><b>${esc((v.items || []).join(', ')) || "yo'q"}</b></div></div><div class="row" style="margin-bottom:10px"><input class="in" id="driver" placeholder="Haydovchi F.I.O." value="${esc(v.driver || '')}"><input class="in" id="truck" placeholder="Evakuator" value="${esc(v.truck || '')}"></div><input class="in" id="act" placeholder="Xodim bayonnomasi raqami" value="${esc(v.officerAct || '')}" style="margin-bottom:10px"><canvas class="sig" id="sig" width="600" height="220"></canvas><button class="chip" id="sigClear" style="margin-top:8px">Imzoni tozalash</button>`;
    const last = step === 4;
    show('car', `${head(STEPS[step] + ', ' + (step + 1) + '/5')}<div class="steps">${STEPS.map((s, i) => `<i class="${i < step ? 'done' : i === step ? 'cur' : ''}"></i>`).join('')}</div><main class="pad">${body}</main><div class="foot"><button class="btn back soft" id="prev">${step === 0 ? 'Yopish' : 'Orqaga'}</button><button class="btn ${last ? 'go' : ''}" id="next" ${last && (miss.length || !v.sector) ? 'disabled' : ''}>${last ? (miss.length ? `Foto yetishmaydi: ${miss.join(', ')}` : !v.sector ? 'Sektor kiritilmagan' : 'Qabul qilindi — yuborish') : 'Keyingi'}</button></div>`);
    $('#b').onclick = () => { back = true; cur.accepted ? summary() : home(); };
    $('#prev').onclick = () => { if (step === 0) return cur.accepted ? summary() : home(); step--; render(); };
    $('#next').onclick = async () => { if (last) { await send(); return; } step++; render(); };
    app.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { const n = $('#sector').value || ''; v.sector = b.dataset.sec + '-' + (n ? String(n).padStart(2, '0') : ''); render(); });
    const sec = $('#sector'); if (sec) sec.oninput = () => { const s = (v.sector || 'A-').split('-')[0] || 'A'; v.sector = s + '-' + String(sec.value).padStart(2, '0'); };
    const br = $('#brand'); if (br) br.oninput = () => v.brand = br.value;
    app.querySelectorAll('.shot').forEach(b => b.onclick = () => { shotKind = b.dataset.k; const f = $('#file'); f.value = ''; f.click(); });
    app.querySelectorAll('[data-keys]').forEach(b => b.onclick = () => { v.keys = b.dataset.keys === '1'; render(); });
    app.querySelectorAll('[data-seal]').forEach(b => b.onclick = () => { v.seals[b.dataset.seal] = !v.seals[b.dataset.seal]; render(); });
    ['items', 'damage', 'driver', 'truck', 'act'].forEach(id => { const e = $('#' + id); if (!e) return; e.oninput = () => { if (id === 'items') v.items = e.value.split(',').map(s => s.trim()).filter(Boolean); else if (id === 'act') v.officerAct = e.value; else v[id] = e.value; }; });
    if (step === 4) sigInit();
  }
  async function send() { const v = cur; const payload = { sector: v.sector, brand: v.brand, keys: v.keys, items: v.items, seals: v.seals, damage: v.damage, driver: v.driver, truck: v.truck, officerAct: v.officerAct, photos: v.photos, signature: $('#sig') ? $('#sig').toDataURL('image/png') : null, by: session.user };
    try { await api(`/api/vehicles/${v.id}/acceptance`, payload); toast('Qabul qilindi, operatorga yuborildi', 'ok'); home('pending'); }
    catch (e) { queue.push({ id: v.id, path: `/api/vehicles/${v.id}/acceptance`, payload, at: Date.now() }); store.set('queue', queue); toast("Aloqa yo'q — navbatga qo'yildi, keyin yuboriladi", 'no'); home('pending'); } }
  async function flush() { const rest = []; for (const q of queue) { try { await api(q.path, q.payload); } catch { rest.push(q); } } queue = rest; store.set('queue', queue); toast(rest.length ? `Yuborilmadi: ${rest.length}` : 'Navbat yuborildi', rest.length ? 'no' : 'ok'); home('me'); }
  function sigInit() { const c = $('#sig'), x = c.getContext('2d'); x.lineWidth = 3; x.lineCap = 'round'; x.strokeStyle = '#111'; let d = false, p = null; const pos = e => { const r = c.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * c.width / r.width, y: (t.clientY - r.top) * c.height / r.height }; }; const s = e => { d = true; p = pos(e); e.preventDefault(); }, mv = e => { if (!d) return; const q = pos(e); x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); p = q; e.preventDefault(); }, u = () => d = false; c.onmousedown = s; c.onmousemove = mv; c.onmouseup = u; c.ontouchstart = s; c.ontouchmove = mv; c.ontouchend = u; $('#sigClear').onclick = () => x.clearRect(0, 0, c.width, c.height); }
  function pic(k, col) { const id = 'g' + k.replace(/\W/g, ''); const side = k === 'Chap' || k === "O'ng"; const b = side ? `<g transform="${k === "O'ng" ? 'translate(160,0) scale(-1,1)' : ''}"><path d="M20 70 L26 50 L56 44 L72 30 L112 30 L132 48 L146 52 L148 70 Z" fill="${col}"/><path d="M58 46 L74 33 L110 33 L126 48 Z" fill="#2C3A4A"/><circle cx="46" cy="74" r="11" fill="#111"/><circle cx="120" cy="74" r="11" fill="#111"/></g>` : k === 'Orqa' ? `<rect x="36" y="46" width="88" height="34" rx="6" fill="${col}"/><path d="M44 46 L52 30 L108 30 L116 46 Z" fill="${col}"/><path d="M48 46 L55 33 L105 33 L112 46 Z" fill="#2C3A4A"/><rect x="40" y="58" width="14" height="7" fill="#D93A2E"/><rect x="106" y="58" width="14" height="7" fill="#D93A2E"/><rect x="66" y="66" width="28" height="8" fill="#fff"/>` : /Salon/.test(k) ? `<rect width="160" height="90" fill="#2A2F36"/><path d="M0 56 Q80 40 160 56 L160 90 L0 90Z" fill="#3B424B"/><rect x="28" y="60" width="44" height="22" rx="4" fill="#4A525C"/><rect x="88" y="60" width="44" height="22" rx="4" fill="#4A525C"/>` : `<rect x="36" y="46" width="88" height="34" rx="6" fill="${col}"/><path d="M44 46 L52 30 L108 30 L116 46 Z" fill="${col}"/><path d="M48 46 L55 33 L105 33 L112 46 Z" fill="#2C3A4A"/><rect x="42" y="58" width="14" height="7" rx="3" fill="#FFF2B8"/><rect x="104" y="58" width="14" height="7" rx="3" fill="#FFF2B8"/><rect x="66" y="66" width="28" height="8" fill="#fff"/>${/Zarar/.test(k) ? '<circle cx="112" cy="60" r="16" fill="none" stroke="#E24B3F" stroke-width="3"/>' : ''}`; return `<svg class="pic" viewBox="0 0 160 90"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B6470"/><stop offset=".6" stop-color="#3A4149"/><stop offset=".61" stop-color="#2B3036"/><stop offset="1" stop-color="#1E2226"/></linearGradient></defs><rect width="160" height="90" fill="url(#${id})"/><ellipse cx="80" cy="82" rx="50" ry="4" fill="#000" opacity=".4"/>${b}</svg>`; }
  $('#file').onchange = () => { const f = $('#file').files[0]; if (!f || !cur) return; const img = new Image(); img.onload = () => { const s = Math.min(1, 1600 / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); cur.photos[shotKind] = cv.toDataURL('image/jpeg', .82); if (cur.accepted) { api(`/api/vehicles/${cur.id}/photos`, { photos: { [shotKind]: cur.photos[shotKind] } }).then(() => { toast('Foto yuborildi', 'ok'); }); summary(); } else render(); }; img.src = URL.createObjectURL(f); };

  /* ---------- 5. QR skaner: jonli (HTTPS) yoki suratdan ---------- */
  function scanner(title, onCode) {
    const prev = screen, prevHtml = app.innerHTML;
    const close = () => { stop(); app.innerHTML = prevHtml; rebind(prev); };
    let stream = null, raf = null; const stop = () => { if (raf) cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); };
    const live = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext);
    app.innerHTML = `<div class="scan"><video id="vid" playsinline muted autoplay style="${live ? '' : 'display:none'}"></video><canvas class="view" id="cv" style="${live ? 'display:none' : ''}"></canvas><div class="frame"></div><div class="top"><button class="ic" id="sx" style="color:#fff">${I.x}</button>${esc(title)}</div><div class="bottom"><p>${live ? 'QR kodni ramka ichiga qo\u2018ying' : 'Bu manzilda jonli kamera yo\u2018q (HTTPS kerak). QR ni suratga oling — o\u2018qib olamiz.'}</p><button class="btn" id="sShot">${I.cam}QR ni suratga olish</button><button class="btn" id="sType">Kodni qo'lda kiritish</button></div></div>`;
    $('#sx').onclick = close;
    $('#sType').onclick = () => { const t = prompt('Kod yoki havola:'); if (t) { close(); onCode(t.trim()); } };
    $('#sShot').onclick = () => { const f = $('#qrfile'); f.value = ''; f.onchange = () => { const file = f.files[0]; if (!file) return; const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); const s = Math.min(1, 1200 / Math.max(img.width, img.height)); cv.width = img.width * s; cv.height = img.height * s; const x = cv.getContext('2d'); x.drawImage(img, 0, 0, cv.width, cv.height); const d = x.getImageData(0, 0, cv.width, cv.height); const r = jsQR(d.data, d.width, d.height); if (r && r.data) { close(); onCode(r.data); } else toast('QR topilmadi, yaqinroq va tekis oling', 'no'); }; img.src = URL.createObjectURL(file); }; f.click(); };
    if (live) navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => { stream = s; const v = $('#vid'); v.srcObject = s; const cv = document.createElement('canvas'), x = cv.getContext('2d'); const tick = () => { if (v.readyState === 4) { cv.width = v.videoWidth; cv.height = v.videoHeight; x.drawImage(v, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height); const r = jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' }); if (r && r.data) { if (navigator.vibrate) navigator.vibrate(30); close(); onCode(r.data); return; } } raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }).catch(() => toast('Kamera ochilmadi — suratdan o\u2018qing', 'no'));
    function rebind(p) { if (p === 'connect') connectScreen(); else if (p === 'login') loginScreen(); else home(); }
  }

  /* ---------- boshlash ---------- */
  if (!conn) connectScreen(); else if (!session) loginScreen(); else home();
  window.JMH = { home, carScreen, connectScreen, loginScreen, scanner, mock, set: (c, s) => { conn = c; session = s; } };
})();
