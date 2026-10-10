/* JM.api — real server (Go terminal). mock.js o'rniga qo'yiladi, imzolar
   bir xil. Hodisalar WebSocket orqali JM.bus ga tushadi. */
window.JM = window.JM || {};
(function () {
  /* ---------- bus ---------- */
  const subs = {};
  const bus = {
    on: (k, f) => { (subs[k] = subs[k] || []).push(f); },
    emit: (k, d) => { (subs[k] || []).forEach(f => { try { f(d); } catch (e) { console.error('bus', k, e); } }); }
  };

  /* ---------- sana ---------- */
  // Server ISO satr yuboradi, front Date kutadi (hisob, format, taqqoslash).
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  function tirilt(o) {
    if (o === null || o === undefined) return o;
    if (typeof o === 'string') return ISO.test(o) ? new Date(o) : o;
    if (Array.isArray(o)) return o.map(tirilt);
    if (typeof o === 'object') { for (const k of Object.keys(o)) o[k] = tirilt(o[k]); return o; }
    return o;
  }

  /* ---------- chaqiruv ---------- */
  async function call(metod, ...args) {
    let r;
    try {
      r = await fetch('/api/op/' + metod, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
    } catch (e) {
      return { error: "Server bilan aloqa yo'q" };
    }
    let j;
    try { j = await r.json(); } catch (e) { return { error: 'Server javobi o‘qilmadi' }; }
    return tirilt(j);
  }

  const METODLAR = [
    'settings', 'shift', 'devices', 'events', 'list', 'get', 'search', 'lane', 'laneState',
    'setProtocol', 'setWaiting', 'cancelEntry', 'createManual', 'pay', 'confirmBank',
    'setPermission', 'cancelPermission', 'setReceiver', 'releaseManual', 'confirmNear',
    'photoArrived', 'addAccess', 'acceptance',
    'rahbarPin', 'rahbarState', 'block', 'unblock', 'refund', 'exempt', 'fix',
    'setBasis', 'clearBasis', 'tempOut', 'tempReturn', 'openBarrierManual',
    'shiftClose', 'shiftOpen', 'login', 'users', 'updateSettings'
  ];
  const api = {};
  METODLAR.forEach(m => { api[m] = (...a) => call(m, ...a); });

  /* ---------- WebSocket ---------- */
  let ws = null, kutish = 500, ulangan = false;
  function ulan() {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    ws = new WebSocket(proto + location.host + '/ws');
    ws.onopen = () => {
      kutish = 500;
      if (ulangan) bus.emit('list');   // uzilish davridagi o'zgarishlarni olib kelish
      ulangan = true;
      bus.emit('conn', { ok: true });
    };
    ws.onmessage = e => {
      let x; try { x = JSON.parse(e.data); } catch (err) { return; }
      bus.emit(x.k, tirilt(x.d));
    };
    ws.onclose = () => {
      bus.emit('conn', { ok: false });
      setTimeout(ulan, kutish);
      kutish = Math.min(kutish * 2, 10000);   // eksponensial kutish
    };
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
  }
  ulan();

  /* ---------- sinov (server -sinov bayrog'i bilan) ---------- */
  const demo = {
    list: [['evak', 'Kirish: evakuator, keyin mashina'], ['self', "Kirish: mashina o'zi keldi"],
      ['street', 'Kirish: ko‘chadagi mashina (allaqachon ichkarida)'], ['truckLate', 'Kirish: mashina, keyin evakuator'],
      ['ok', 'Chiqish: tayyor TV (avto ochiladi)'], ['notready', 'Chiqish: to‘langan, ruxsat yo‘q'],
      ['near', 'Chiqish: kamera 0 ni O deb o‘qidi'], ['unk', 'Chiqish: ro‘yxatda yo‘q'],
      ['evakOut', 'Chiqish: evakuator ketdi (xizmat)'], ['tail', 'Chiqish: ikkinchi mashina ochiq shlagbaumdan']],
    kadr: (lane, plate, conf) => fetch('/api/sinov/kadr', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane, plate, conf: conf || (94 + Math.floor(Math.random() * 5)) })
    }).then(r => r.json()).then(j => { if (j && j.error) console.warn('sinov:', j.error); }),
    run(k) {
      const rp = () => '01K' + (100 + Math.floor(Math.random() * 900)) + 'KA';
      const cam = demo.kadr;
      if (k === 'evak') { cam('in', '01T555TT', 97); setTimeout(() => cam('in', rp()), 1400); }
      if (k === 'self') cam('in', rp());
      if (k === 'street') cam('in', '01A123BC', 91);
      if (k === 'truckLate') { const p = rp(); cam('in', p); setTimeout(() => cam('in', '01T556TT', 96), 1400); }
      if (k === 'ok') cam('out', '01A123BC', 98);
      if (k === 'notready') cam('out', '01B777AA', 97);
      if (k === 'near') cam('out', 'O1A123BC', 88);
      if (k === 'unk') cam('out', '01Z999ZZ', 90);
      if (k === 'evakOut') cam('out', '01T555TT', 97);
      if (k === 'tail') { cam('out', '01A123BC', 98); setTimeout(() => cam('out', '01Q777QQ', 93), 1600); }
    }
  };

  JM.api = api;
  JM.bus = bus;
  JM.demo = demo;
})();
