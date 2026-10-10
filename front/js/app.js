/* JM.app — qobiq: rail, sarlavha, buyruq paneli (Ctrl+K), hodisalar, sinov */
window.JM = window.JM || {};
(async function () {
  const S = JM.store, U = JM.ui, $ = U.$;
  JM.settings = await JM.api.settings();
  const shift = await JM.api.shift();

  /* rail */
  const NAV = [['lot', 'Maydoncha'], ['gate', 'Darvoza'], ['shift', 'Smena'], ['out', 'Arxiv'], ['report', 'Hisobot'], ['settings', 'Sozlamalar']];
  const rail = $('#rail');
  rail.innerHTML += NAV.map(([k, t], i) => `<button class="${i === 0 ? 'on' : ''}" data-p="${k}">${U.icon(k)}<span>${t}</span></button>`).join('') + `<span class="sp"></span><div class="who"><b>${S.esc(shift.operator)}</b>smena ${shift.no}<i></i></div>`;
  rail.innerHTML += `<button class="lockBtn" id="lockBtn">${U.icon('x')}<span>Qulflash</span></button>`;
  JM.shift = shift;
  const PAGES = { gate: () => JM.views.pages.gate(), shift: () => JM.views.pages.shift(), out: () => JM.views.pages.archive(), report: () => JM.views.pages.report(), settings: () => JM.views.pages.settings() };
  let page = 'lot';
  function go(p) {
    page = p; rail.querySelectorAll('button[data-p]').forEach(x => x.classList.toggle('on', x.dataset.p === p));
    const onLot = p === 'lot'; $('#focus').style.display = onLot && JM.views.car.current() ? '' : 'none'; $('#lane').style.display = onLot ? '' : 'none';
    if (onLot) JM.views.lot.render(true); else PAGES[p]();
  }
  JM.app = { go, page: () => page };
  rail.querySelectorAll('button[data-p]').forEach(b => b.onclick = () => go(b.dataset.p));
  /* qulflash */
  const lock = $('#lock');
  async function doLock() { const users = await JM.api.users(); $('#lockUser').innerHTML = users.filter(u => u.role !== 'hovli').map(u => `<option ${u.name === JM.shift.operator ? 'selected' : ''}>${S.esc(u.name)}</option>`).join(''); $('#lockOrg').textContent = JM.settings.org.name; lock.classList.add('on'); $('#lockPin').value = ''; setTimeout(() => $('#lockPin').focus(), 50); lockLive(); }
  async function lockLive() { if (!lock.classList.contains('on')) return; const rows = await JM.api.list(); const ev = (await JM.api.events())[0]; $('#lockLive').innerHTML = `Maydonchada ${rows.length} ta mashina, tayyor ${rows.filter(v => S.conds(v).can).length}.<br>${ev ? S.tm(ev.at) + ' ' + S.esc(ev.text) : ''}`; setTimeout(lockLive, 5000); }
  $('#lockBtn').onclick = doLock;
  const unlock = async () => { const r = await JM.api.login($('#lockUser').value, $('#lockPin').value); if (r.error) return U.toast(r.error, 'alarm'); lock.classList.remove('on'); JM.settings.operator = r.user.name; };
  $('#lockOk').onclick = unlock; $('#lockPin').onkeydown = e => { if (e.key === 'Enter') unlock(); };
  if (location.search.includes('login')) doLock();
  $('#orgName').textContent = JM.settings.org.name;
  $('#shiftInfo').textContent = `Smena № ${shift.no}, ${S.tm(shift.startedAt).slice(0, 5)} dan`;

  /* uskuna */
  async function renderDevs() {
    const d = await JM.api.devices();
    const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'hozir' : m + ' daq'; };
    const cam = (x, n) => `<span><span class="dot ${Date.now() - x.last < 15 * 6e4 ? 'ok' : 'warn'}"></span>${n} ${ago(x.last)}</span>`;
    $('#devs').innerHTML = `${cam(d.ftpIn, 'CAM 01')}${cam(d.ftpOut, 'CAM 02')}<span><span class="dot ${d.epos.ok ? 'ok' : 'no'}"></span>kassa</span><span><span class="dot ${d.relay.ok ? 'ok' : 'no'}"></span>rele</span><span><span class="dot ${d.sync.ok ? 'ok' : 'warn'}"></span>sinxron ${ago(d.sync.last)}</span>`;
  }
  renderDevs(); setInterval(renderDevs, 30000); JM.bus.on('device', renderDevs);
  function tick() { const d = new Date(); $('#clock').textContent = `${S.pad(d.getHours())}:${S.pad(d.getMinutes())}`; } tick(); setInterval(tick, 1000);
  setInterval(() => JM.views.lot.render(), 60000);

  /* hodisalar */
  const last = t => { $('#last').textContent = `${S.tm(new Date())}  ${t}`; };
  JM.bus.on('event', e => { last(e.text); if (e.kind === 'alarm') U.toast(e.text, 'alarm'); });
  JM.bus.on('list', () => { if (page === 'lot') JM.views.lot.render(); else if (page === 'shift' || page === 'out' || page === 'report') PAGES[page](); });
  JM.bus.on('vehicle', v => { const c = JM.views.car.current(); if (c && c.id === v.id) JM.views.car.refresh(); });
  JM.bus.on('lane', l => { if (page !== 'lot') go('lot'); JM.lane.show(l); });
  JM.bus.on('barrier', b => { JM.lane.barrier(b); if (b.open) U.toast(`Shlagbaum ochildi${b.plate ? ': ' + S.prettyPlate(b.plate) : ''}`, 'ok'); });
  JM.bus.on('gate', g => { const t = { open: 'Darvoza: ochilmoqda', bye: "Darvoza: yo'l ochiq", not_ready: 'Darvoza: rasmiylashtirilmagan, operatorga', unknown: "Darvoza: ro'yxatda yo'q, yopiq", blocked: 'Darvoza: bloklangan, yopiq', operator: 'Darvoza: yaqin raqam, operator tasdiqlasin' }[g.state]; if (t) last(`${t} — ${g.plate ? S.prettyPlate(g.plate) : ''}`); });

  /* buyruq paneli */
  const pal = $('#pal'), pin = $('#palIn'), plist = $('#palList'); let pidx = 0, pitems = [];
  const ACTIONS = [['Qo\u2018lda kiritish — raqamsiz, xorijiy', () => { go('lot'); JM.views.car.manualEntry(); }], ['Tayyor mashinalar', () => { go('lot'); JM.views.lot.setChip('ready'); }], ['Protokol kutilayotganlar', () => { go('lot'); JM.views.lot.setChip('proto'); }], ['30 kundan oshganlar', () => { go('lot'); JM.views.lot.setChip('long'); }], ['Darvoza', () => go('gate')], ['Smena', () => go('shift')], ['Arxiv', () => go('out')], ['Hisobot', () => go('report')], ['Sozlamalar', () => go('settings')], ['Terminalni qulflash', doLock]];
  async function palRender() {
    const q = pin.value.trim(); pitems = [];
    if (q.length >= 2) { const f = await JM.api.search(q); f.slice(0, 8).forEach(v => pitems.push({ html: `${U.plate(v.plate, 'sm')}<span>${S.esc(v.brand || v.vin || '')}</span><span class="m">${v.status === 'OUT' ? 'arxiv, ' + S.dm(v.releasedAt) : S.listState(v).t}</span>`, run: () => { go('lot'); JM.views.car.open(v.id); } })); }
    ACTIONS.filter(a => !q || a[0].toLowerCase().includes(q.toLowerCase())).forEach(a => pitems.push({ html: `<span>${a[0]}</span><span class="m">buyruq</span>`, run: a[1] }));
    pidx = 0; plist.innerHTML = pitems.map((it, i) => `<li class="${i === 0 ? 'on' : ''}" data-i="${i}">${it.html}</li>`).join('') || '<li class="m">Topilmadi</li>';
    plist.querySelectorAll('li[data-i]').forEach(li => li.onclick = () => { pitems[+li.dataset.i].run(); palClose(); });
  }
  function palOpen() { pal.classList.add('open'); pin.value = ''; palRender(); setTimeout(() => pin.focus(), 30); }
  function palClose() { pal.classList.remove('open'); }
  pin.oninput = palRender;
  pin.onkeydown = e => { if (e.key === 'ArrowDown') { pidx = Math.min(pitems.length - 1, pidx + 1); } else if (e.key === 'ArrowUp') { pidx = Math.max(0, pidx - 1); } else if (e.key === 'Enter') { if (pitems[pidx]) { pitems[pidx].run(); palClose(); } return; } else return; plist.querySelectorAll('li[data-i]').forEach((li, i) => li.classList.toggle('on', i === pidx)); e.preventDefault(); };
  pal.onclick = e => { if (e.target === pal) palClose(); };
  $('#searchBtn').onclick = palOpen; $('#searchBtn').onkeydown = e => { if (e.key === 'Enter') palOpen(); };

  /* sinov */
  const demo = $('#demo');
  if (location.search.includes('demo')) { demo.innerHTML = '<option value="">Sinov</option>' + JM.demo.list.map(([k, t]) => `<option value="${k}">${t}</option>`).join(''); demo.onchange = () => { JM.demo.run(demo.value); demo.value = ''; }; }
  else demo.style.display = 'none';

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('open') ? palClose() : palOpen(); return; }
    if (e.key === 'Escape') { if (pal.classList.contains('open')) palClose(); else if (U.isModal()) U.close(); else JM.views.car.close(); }
    if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName)) { e.preventDefault(); palOpen(); }
    if (!U.isModal() && !pal.classList.contains('open') && !/input|textarea|select/i.test(e.target.tagName)) { if (e.key === 'ArrowDown') { e.preventDefault(); JM.views.lot.kb(1); } if (e.key === 'ArrowUp') { e.preventDefault(); JM.views.lot.kb(-1); } if (e.key === 'Enter') JM.views.lot.kbOpen(); }
    if (location.search.includes('demo')) { const m = { F2: 'evak', F3: 'self', F4: 'ok', F5: 'notready', F6: 'near', F7: 'unk', F8: 'tail' }[e.key]; if (m) { e.preventDefault(); JM.demo.run(m); } }
  });
  $('#ov').onclick = e => { if (e.target.id === 'ov') U.close(); };

  last('Smena ochiq. Kameralar FTP orqali, kassa ulangan');
  JM.views.car.render();
  await JM.views.lot.render();
})();
