/* JM.views.lot — KPI, bandlik, ro'yxat */
window.JM = window.JM || {}; JM.views = JM.views || {};
(function () {
  const S = JM.store, U = JM.ui, $ = U.$;
  let chip = 'all', q = '', found = null, selId = null, sig = '', animate = true, kbIdx = -1, ids = [];

  const CHIPS = [['all', 'Hammasi'], ['ready', 'Tayyor'], ['proc', 'Rasmiylashtirilmoqda'], ['proto', 'Protokol'], ['photo', 'Fotosiz'], ['waiting', 'Egasi kutmoqda'], ['long', '30+ kun'], ['blk', 'Blok']];
  function match(v, k) {
    const st = S.listState(v);
    if (k === 'all') return true;
    if (k === 'ready') return st.k === 'ready';
    if (k === 'proc') return st.k === 'proc' || st.k === 'basis' || st.k === 'wait';
    if (k === 'proto') return !v.protocol;
    if (k === 'photo') return S.missingPhotos(v).length > 0;
    if (k === 'waiting') return v.waiting;
    if (k === 'long') return S.daysIn(v) >= 30;
    if (k === 'blk') return v.status === 'BLOCKED' || v.status === 'TEMP_OUT';
    return true;
  }

  function row(v, arxiv, i) {
    const st = S.listState(v);
    const badges = arxiv ? '' : [!v.protocol ? '<span class="badge warn">protokol</span>' : '', S.missingPhotos(v).length ? `<span class="badge">foto ${4 - S.missingPhotos(v).length}/4</span>` : '', v.waiting ? '<span class="badge warn">egasi kutmoqda</span>' : '', v.noPlate ? '<span class="badge">VIN</span>' : '', v.category !== 'yengil' ? `<span class="badge">${S.CATEGORIES[v.category]}</span>` : ''].join('');
    const days = S.daysIn(v);
    return `<tr class="row ${selId === v.id ? 'sel' : ''} ${arxiv ? 'arxiv' : ''}" data-id="${v.id}" style="animation-delay:${Math.min(i, 12) * 22}ms">
      <td>${U.plate(v.plate, 'sm')}${badges}</td>
      <td>${S.esc(v.brand || (v.vin ? 'VIN ' + v.vin : '—'))}${v.color ? ', ' + S.esc(v.color) : ''}</td>
      <td class="m">${S.dm(v.enteredAt)}</td>
      <td class="${days >= 30 ? 'warn' : 'm'}" style="white-space:nowrap">${arxiv ? 'chiqdi ' + S.dm(v.releasedAt) : days >= 30 ? days + ' kun' : S.dur(v)}</td>
      <td class="m">${S.esc(v.sector) || '—'}</td>
      <td class="r">${arxiv ? '<span class="st">' + S.STATUS[v.status] + '</span>' : `<span class="st ${st.cls}">${st.t}</span>`}</td></tr>`;
  }

  function occupancy(rows) {
    const cap = JM.settings.capacity;
    return `<div class="kpi"><span>Bandlik, sektorlar</span><div class="occ" style="margin-top:6px">${Object.entries(cap).map(([s, n]) => {
      const used = rows.filter(v => (v.sector || '').startsWith(s + '-'));
      const slots = Array.from({ length: n }, (_, i) => { const v = used.find(x => +x.sector.split('-')[1] === i + 1); return `<i class="${v ? 'f' : ''} ${v && v.id === selId ? 'sel' : ''}" title="${v ? s + '-' + (i + 1) + ' ' + S.prettyPlate(v.plate) : s + '-' + (i + 1) + ' bo\u2018sh'}" ${v ? `data-id="${v.id}"` : ''}></i>`; }).join('');
      return `<div class="row"><span>${s}</span><div class="slots">${slots}</div><span>${used.length}/${n}</span></div>`; }).join('')}</div></div>`;
  }

  async function render(force) {
    const el = $('#view');
    if (q.length >= 2) found = await JM.api.search(q); else found = null;
    const rows = await JM.api.list();
    const all0 = await JM.api.search('');
    const newSig = JSON.stringify([chip, q, selId, all0.map(v => [v.id, v.status, S.listState(v).t, v.sector, v.protocol && v.protocol.no, v.photos.length, v.waiting])]);
    if (!force && newSig === sig && el.innerHTML) return;
    animate = animate || !el.innerHTML; sig = newSig;
    const counts = Object.fromEntries(CHIPS.map(([k]) => [k, rows.filter(v => match(v, k)).length]));
    $('#cnt').textContent = rows.length;
    const today = S.iso(new Date());
    const inToday = rows.filter(v => S.iso(v.enteredAt) === today).length;
    const all = await JM.api.search('');
    const outToday = all.filter(v => v.status === 'OUT' && v.releasedAt && S.iso(v.releasedAt) === today).length;
    const kassa = all.flatMap(v => v.payments).filter(p => p.status === 'ok' && p.amount > 0 && S.iso(p.at) === today).reduce((a, p) => a + p.amount, 0);
    const list = (found || rows).filter(v => found ? true : match(v, chip)).sort((a, b) => b.enteredAt - a.enteredAt);
    const capTotal = Object.values(JM.settings.capacity).reduce((a, b) => a + b, 0);
    el.innerHTML = `
      <div class="kpis">
        <div class="kpi"><span>Maydonchada</span><b>${rows.length}<small>/ ${capTotal} joy</small></b></div>
        <div class="kpi"><span>Bugun kirdi / chiqdi</span><b>${inToday} <small>/</small> ${outToday}</b></div>
        <div class="kpi ok"><span>Chiqarishga tayyor</span><b>${counts.ready}</b></div>
        <div class="kpi ${counts.long ? 'warn' : ''}"><span>30 kundan oshgan</span><b>${counts.long}</b></div>
        <div class="kpi"><span>Kassa bugun, so'm</span><b id="kpiKassa">${S.fmt(kassa)}</b></div>
        ${occupancy(rows)}
      </div>
      <div class="card lot">
        <div class="lh"><h2>${found ? `Qidiruv: ${S.esc(q)}` : 'Maydonchada'}</h2><span class="mute" style="font-size:12.5px">${found ? found.length + ' ta topildi, arxiv bilan' : '↑↓ tanlash, Enter ochish'}</span><span class="sp"></span><input class="q" id="q" placeholder="Raqam, VIN, protokol, egasi — arxiv ham" value="${S.esc(q)}" autocomplete="off"></div>
        ${found ? '' : `<div class="lh2"><div class="seg">${CHIPS.map(([k, t]) => `<button class="${chip === k ? 'on' : ''}" data-chip="${k}">${t}<b>${counts[k]}</b></button>`).join('')}</div><div class="legend"><span><i class="f"></i>band</span><span><i></i>bo'sh</span></div></div>`}
        <table class="${animate ? 'anim' : ''}"><tr><th>Davlat raqami</th><th>Marka</th><th>Kirgan</th><th>Muddat</th><th>Sektor</th><th class="r">Holat</th></tr>
        ${list.length ? list.map((v, i) => row(v, v.status === 'OUT', i)).join('') : `<tr><td colspan="6" class="m">${found ? 'Topilmadi' : "Bo'sh"}</td></tr>`}</table>
        ${found ? '' : `<div class="tfoot"><button class="tb" id="manualEntry">Qo'lda kiritish — raqamsiz, xorijiy, kamera uzilgan</button></div>`}
      </div>`;
    const qi = $('#q'); qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; animate = true; render(true).then(() => { const e = $('#q'); e.focus(); e.setSelectionRange(pos, pos); }); };
    el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { chip = b.dataset.chip; animate = true; render(true); });
    el.querySelectorAll('tr.row,.occ i[data-id]').forEach(r => r.onclick = () => JM.views.car.open(+r.dataset.id));
    const me = $('#manualEntry'); if (me) me.onclick = JM.views.car.manualEntry;
    ids = list.map(v => v.id); kbIdx = -1; animate = false;
  }
  function kb(dir) {
    const rows = document.querySelectorAll('#view tr.row'); if (!rows.length) return;
    kbIdx = Math.max(0, Math.min(rows.length - 1, kbIdx + dir));
    rows.forEach((r, i) => r.classList.toggle('kb', i === kbIdx));
    rows[kbIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function kbOpen() { if (kbIdx >= 0 && ids[kbIdx] != null) JM.views.car.open(ids[kbIdx]); }

  JM.views.lot = { render, select: id => { selId = id; }, setChip: c => { chip = c; animate = true; render(true); }, setQuery: s => { q = s; render(true); }, kb, kbOpen };
})();
