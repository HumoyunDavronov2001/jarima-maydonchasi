/* JM.lane — jonli yo'lak paneli: kamera o'qidi → panel tushadi, tekshiruvlar ketma-ket, shlagbaum animatsiya */
window.JM = window.JM || {};
(function () {
  const S = JM.store, U = JM.ui, $ = U.$;
  let timer = null, cur = null;

  const arm = () => `<svg viewBox="0 0 84 70"><rect x="2" y="52" width="16" height="18" rx="3" fill="#6B7480"/><circle cx="10" cy="60" r="2.5" fill="#fff"/><g class="arm"><rect x="10" y="57.5" width="60" height="5" rx="2.5" fill="#F2C94C"/><rect x="10" y="57.5" width="60" height="5" rx="2.5" fill="url(#armstr)"/></g><defs><pattern id="armstr" width="12" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#E04B3F"/></pattern></defs></svg>`;
  const check = (st, text) => `<li class="${st}"><i>${U.icon(st === 'ok' ? 'check' : 'x')}</i><span>${S.esc(text)}</span></li>`;

  async function show(l) {
    cur = l; clearTimeout(timer);
    const el = $('#lane');
    const v = l.vid ? await JM.api.get(l.vid) : null;
    const dirTxt = l.dir === 'in' ? 'Kirish kamerasi' : 'Chiqish kamerasi';
    let mid = '', checks = '', foot = '', gateOpen = false, gateTxt = '';
    if (l.kind === 'truck') { mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}, ishonch ${l.conf}%</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc">Evakuator — ro'yxatdagi xizmat transporti. Yukdagi mashina o'qilganda evakuatsiya hisobga qo'shiladi.</p>`; }
    else if (l.kind === 'service') { mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc">Xizmat transporti — ro'yxatga olinmaydi, faqat jurnal.</p>`; gateOpen = l.dir === 'out'; gateTxt = gateOpen ? 'Shlagbaum ochiq' : ''; }
    else if (l.kind === 'dup') { mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}, ishonch ${l.conf}%</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc no">Bu raqam allaqachon maydonchada${v && v.sector ? ', sektor ' + S.esc(v.sector) : ''}. Kamera ko'chadagi mashinani o'qigan bo'lishi mumkin — yangi yozuv ochilmadi.</p>`; foot = `<button class="ghost" data-open="${l.vid}">Kartani ochish</button>`; }
    else if (l.kind === 'new') { mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}, ishonch ${l.conf}%</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc"><b class="ok">Ro'yxatga olindi, hisob boshlandi.</b> ${l.truck ? 'Evakuator ' + S.prettyPlate(l.truck) + ' — evakuatsiya hisobda.' : "Evakuator ko'rilmadi — o'zi keldi yoki keyin o'qiladi."} Sektor, foto, kalit — hovli xodimi; protokol — operator.</p>`; foot = `<button class="ghost" data-open="${l.vid}">Kartani ochish</button><span class="mute" style="font-size:12.5px">Panel 12 soniyada yig'iladi</span>`; }
    else if (l.kind === 'unknown') { mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}, ishonch ${l.conf}%</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc no">Ro'yxatda yo'q — shlagbaum yopiq. Xizmat transporti bo'lsa Sozlamalarda ro'yxatga qo'shing.</p>`; gateTxt = 'Shlagbaum yopiq'; }
    else if (l.kind === 'near') { const nv = await JM.api.get(l.near[0]); mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}, ishonch ${l.conf}%</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc warn">Ro'yxatda yo'q, lekin yaqin raqam bor: <b>${S.prettyPlate(nv.plate)}</b> (${S.esc(nv.brand)}). Kamera 0/O, 8/B ni adashtirgan bo'lishi mumkin.</p>`; foot = `<button class="primary" data-near="${nv.id}" data-read="${l.plate}">Ha, bu ${S.prettyPlate(nv.plate)}</button><button class="ghost" data-close>Yo'q</button>`; gateTxt = "Shlagbaum yopiq — operator tasdig'i"; }
    else if (l.kind === 'reopen') { mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}</div><div class="plateWrap">${U.plate(l.plate, 'lg')}</div><p class="desc">10 daqiqa ichida chiqarilgan — qayta o'tish.</p>`; gateOpen = true; gateTxt = 'Shlagbaum ochiq'; }
    else if (l.kind === 'car' && v) {
      const c = S.conds(v);
      mid = `<div class="src">${dirTxt}, ${S.tm(l.at)}, ishonch ${l.conf}%</div><div class="plateWrap">${U.plate(v.plate, 'lg')}</div><p class="desc">${S.esc(v.brand)}${v.color ? ', ' + S.esc(v.color) : ''}. ${S.dur(v)}${v.sector ? ', ' + S.esc(v.sector) : ''}.</p><div class="verdict ${v.status === 'BLOCKED' ? 'blk' : c.can ? 'ok' : 'no'}">${v.status === 'BLOCKED' ? 'Bloklangan' : c.can ? 'Shartlar bajarilgan' : 'Rasmiylashtirilmagan'}</div>`;
      checks = `<ul class="checks">${check(c.pay.st, c.pay.t)}${check(c.perm.st, c.perm.t)}${check(c.rec.st, c.rec.t)}</ul>`;
      gateOpen = c.can && v.status === 'IN'; gateTxt = gateOpen ? 'Shlagbaum ochilmoqda' : 'Shlagbaum yopiq — operatorga';
      foot = `<button class="ghost" data-open="${v.id}">Kartani ochish</button>${!c.can && v.status === 'IN' ? `<span class="mute" style="font-size:12.5px">Darvoza ekrani egaga "operatorga murojaat qiling" deyapti</span>` : ''}`;
    }
    el.innerHTML = `<div><div class="lane" id="laneBox">
      <div class="lh"><span class="dot ok live"></span><b>${dirTxt}</b><span>${l.dir === 'in' ? 'CAM 01' : 'CAM 02'}, FTP fayl ${S.tm(l.at)}</span><button class="x" data-close aria-label="Yopish">×</button></div>
      <div class="body">
        <div class="cam">${v ? U.frame(v, l.dir, l.at, true) : U.frame({ plate: l.plate, color: 'kulrang', conf: l.conf }, l.dir, l.at, true)}<div class="scan"></div></div>
        <div class="mid">${mid}</div>
        <div>${checks}<div class="gate ${gateOpen ? 'open' : ''}" id="gateArm">${arm()}<b>${gateTxt || 'Shlagbaum yopiq'}</b></div></div>
      </div>
      ${foot ? `<div class="foot">${foot}</div>` : ''}
    </div></div>`;
    requestAnimationFrame(() => el.classList.add('show'));
    el.querySelectorAll('[data-close]').forEach(b => b.onclick = hide);
    el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { JM.views.car.open(+b.dataset.open, { text: `${dirTxt} o'qidi, ${S.tm(l.at)}`, cam: l.dir }); hide(); });
    el.querySelectorAll('[data-near]').forEach(b => b.onclick = async () => { await JM.api.confirmNear(+b.dataset.near, b.dataset.read); });
    timer = setTimeout(hide, l.kind === 'car' && !gateOpen ? 20000 : 12000);
  }
  function hide() { const b = $('#laneBox'); if (!b) return; b.classList.add('leave'); $('#lane').classList.remove('show'); setTimeout(() => { if ($('#laneBox') === b) $('#lane').innerHTML = ''; }, 430); cur = null; }
  function barrier(b) { const g = $('#gateArm'); if (!g) return; g.classList.toggle('open', !!b.open); const t = g.querySelector('b'); if (t) t.textContent = b.open ? 'Shlagbaum ochiq' : "Shlagbaum yopildi"; }

  JM.lane = { show, hide, barrier };
})();
