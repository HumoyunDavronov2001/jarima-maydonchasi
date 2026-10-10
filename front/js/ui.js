/* JM.ui — komponentlar. Mantiq yo'q. */
window.JM = window.JM || {};
(function () {
  const S = JM.store, U = {};
  const $ = s => document.querySelector(s);
  U.$ = $;

  /* ---------- raqam ---------- */
  U.plate = function (p, size, vin) {
    if (!p) return `<span class="noplate ${size === 'lg' ? 'lg' : ''}">raqamsiz${vin && size === 'lg' ? ' · ' + S.esc(vin) : ''}</span>`;
    const x = S.parsePlate(p);
    if (!x.uz) return `<span class="plate foreign ${size || 'sm'}"><i>${S.esc(x.mid)}</i></span>`;
    return `<span class="plate ${size || 'sm'}"><b>${x.reg}</b><i>${x.mid}</i><u><s></s>UZ</u></span>`;
  };

  /* ---------- kamera kadri (sinovda chizma; ishchi tizimda kameradan JPEG) ---------- */
  const COL = { oq: '#E3E6EA', qora: '#22262B', kulrang: '#8B929B', qizil: '#B23A3A', "ko'k": '#2F4E8A', kumush: '#C9CDD3' };
  U.frame = function (v, kind, at, force) {
    if (!force && ((kind === 'in' && !v.entryFrame) || (kind === 'out' && !(v.exits || []).some(e => e.frame)))) return `<div class="none">${kind === 'in' ? "Kirish kadri yo'q — qo'lda kiritilgan" : "Chiqish kadri yo'q"}</div>`;
    const col = COL[v.color] || '#9AA0A6';
    const x = v.plate ? S.parsePlate(v.plate) : null;
    const t = at || (kind === 'out' ? (v.releasedAt || new Date()) : v.enteredAt);
    const label = kind === 'out' ? 'CAM 02  CHIQISH' : 'CAM 01  KIRISH';
    return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="sky${kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E7783"/><stop offset="1" stop-color="#4A525C"/></linearGradient>
<linearGradient id="road${kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B4046"/><stop offset="1" stop-color="#22262B"/></linearGradient>
<radialGradient id="hl${kind}"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".6" stop-color="#FFE99A" stop-opacity=".35"/><stop offset="1" stop-color="#FFE99A" stop-opacity="0"/></radialGradient>
<radialGradient id="vig${kind}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
<pattern id="str${kind}" width="24" height="7" patternUnits="userSpaceOnUse"><rect width="12" height="7" fill="#E04B3F"/></pattern></defs>
<rect width="400" height="90" fill="url(#sky${kind})"/><rect y="90" width="400" height="135" fill="url(#road${kind})"/><rect y="86" width="400" height="6" fill="#2A2F35"/>
${kind === 'out' ? `<rect x="330" y="40" width="46" height="52" fill="#A9B0B8"/><rect x="334" y="46" width="38" height="16" fill="#5A6470"/><rect x="60" y="60" width="270" height="7" fill="#F2C94C"/><rect x="60" y="60" width="270" height="7" fill="url(#str${kind})"/><rect x="52" y="52" width="14" height="40" fill="#6B7480"/>` : `<rect x="20" y="30" width="120" height="58" fill="#8F969E"/><rect x="26" y="36" width="108" height="46" fill="#6B7480"/><text x="80" y="66" font-size="11" font-weight="700" fill="#fff" text-anchor="middle" font-family="Public Sans,sans-serif">JARIMA MAYDONCHASI</text>`}
<ellipse cx="200" cy="205" rx="118" ry="10" fill="#000" opacity=".45"/>
<rect x="86" y="118" width="228" height="78" rx="12" fill="${col}"/><rect x="86" y="118" width="228" height="78" rx="12" fill="#000" opacity=".12"/>
<path d="M110 118 L128 84 Q200 74 272 84 L290 118 Z" fill="${col}"/><path d="M124 116 L138 90 Q200 82 262 90 L276 116 Z" fill="#2C3A4A"/><path d="M130 114 L142 94 Q200 88 258 94 L270 114 Z" fill="#48607A" opacity=".55"/>
<rect x="92" y="150" width="216" height="18" rx="4" fill="#000" opacity=".3"/><rect x="150" y="150" width="100" height="16" rx="2" fill="#1B1E22"/>
<circle cx="118" cy="146" r="20" fill="url(#hl${kind})"/><circle cx="282" cy="146" r="20" fill="url(#hl${kind})"/>
<rect x="104" y="140" width="30" height="12" rx="4" fill="#FFF2B8"/><rect x="266" y="140" width="30" height="12" rx="4" fill="#FFF2B8"/>
<rect x="98" y="196" width="36" height="12" rx="3" fill="#111"/><rect x="266" y="196" width="36" height="12" rx="3" fill="#111"/>
${x ? `<g transform="translate(157,171)"><rect width="86" height="20" rx="2" fill="#fff" stroke="#111" stroke-width="1.5"/>${x.uz ? `<line x1="17" y1="0" x2="17" y2="20" stroke="#111" stroke-width="1.5"/><text x="8.5" y="14.5" font-size="11" font-weight="700" fill="#111" text-anchor="middle" font-family="Public Sans,sans-serif">${x.reg}</text><text x="51" y="14.5" font-size="11" font-weight="700" fill="#111" text-anchor="middle" font-family="Public Sans,sans-serif" letter-spacing=".5">${x.mid}</text>` : `<text x="43" y="14.5" font-size="10" font-weight="700" fill="#111" text-anchor="middle" font-family="Public Sans,sans-serif">${S.esc(x.mid)}</text>`}</g>
<rect x="153" y="167" width="94" height="28" fill="none" stroke="#39D98A" stroke-width="1.5"/><rect x="153" y="157" width="34" height="10" fill="#39D98A"/><text x="170" y="165" font-size="7.5" font-weight="700" fill="#062A15" text-anchor="middle" font-family="Public Sans,sans-serif">${v.conf || 98}%</text>` : ''}
<rect width="400" height="225" fill="url(#vig${kind})"/>
<rect x="6" y="6" width="112" height="16" fill="#000" opacity=".55"/><text x="12" y="17.5" font-size="9" font-weight="600" fill="#fff" font-family="Public Sans,sans-serif" letter-spacing=".5">${label}</text>
<rect x="290" y="6" width="104" height="16" fill="#000" opacity=".55"/><text x="389" y="17.5" font-size="9" fill="#fff" text-anchor="end" font-family="Public Sans,sans-serif">${S.dt(t)}:${S.pad(t.getSeconds())}</text>
</svg>`;
  };

  /* ---------- foto plitkalari ---------- */
  U.tile = function (kind, v) {
    const col = COL[v.color] || '#9AA0A6';
    const g = `<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B6470"/><stop offset=".55" stop-color="#3A4149"/><stop offset=".56" stop-color="#2B3036"/><stop offset="1" stop-color="#1E2226"/></linearGradient></defs><rect width="112" height="63" fill="url(#tg)"/>`;
    let b = '';
    if (kind === 'Chap' || kind === "O'ng") b = `<g transform="${kind === "O'ng" ? 'translate(112,0) scale(-1,1)' : ''}"><ellipse cx="56" cy="52" rx="42" ry="4" fill="#000" opacity=".4"/><path d="M14 44 L18 30 L38 26 L50 16 L78 16 L92 28 L102 32 L104 44 Z" fill="${col}"/><path d="M40 27 L51 18 L76 18 L86 28 Z" fill="#2C3A4A"/><circle cx="32" cy="46" r="7" fill="#111"/><circle cx="84" cy="46" r="7" fill="#111"/><circle cx="32" cy="46" r="3" fill="#888"/><circle cx="84" cy="46" r="3" fill="#888"/></g>`;
    else if (kind === 'Orqa') b = `<ellipse cx="56" cy="54" rx="34" ry="3" fill="#000" opacity=".4"/><rect x="24" y="30" width="64" height="24" rx="4" fill="${col}"/><path d="M30 30 L36 20 L76 20 L82 30 Z" fill="${col}"/><path d="M33 30 L38 22 L74 22 L79 30 Z" fill="#2C3A4A"/><rect x="27" y="38" width="10" height="5" rx="1" fill="#D93A2E"/><rect x="75" y="38" width="10" height="5" rx="1" fill="#D93A2E"/><rect x="45" y="44" width="22" height="6" fill="#fff" stroke="#111" stroke-width=".8"/>`;
    else if (/Salon/.test(kind)) b = `<rect width="112" height="63" fill="#2A2F36"/><path d="M0 40 Q56 28 112 40 L112 63 L0 63 Z" fill="#3B424B"/><rect x="20" y="42" width="30" height="16" rx="3" fill="#4A525C"/><rect x="62" y="42" width="30" height="16" rx="3" fill="#4A525C"/><circle cx="35" cy="34" r="9" fill="none" stroke="#5A636E" stroke-width="3"/>`;
    else if (/Zarar/.test(kind)) b = `<ellipse cx="56" cy="54" rx="34" ry="3" fill="#000" opacity=".4"/><rect x="24" y="30" width="64" height="24" rx="4" fill="${col}"/><path d="M30 30 L36 20 L76 20 L82 30 Z" fill="${col}"/><path d="M33 30 L38 22 L74 22 L79 30 Z" fill="#2C3A4A"/><path d="M62 40 L70 36 L74 44 L68 46 Z" fill="#000" opacity=".5"/><circle cx="70" cy="42" r="12" fill="none" stroke="#E24B3F" stroke-width="2"/>`;
    else b = `<ellipse cx="56" cy="54" rx="34" ry="3" fill="#000" opacity=".4"/><rect x="24" y="30" width="64" height="24" rx="4" fill="${col}"/><path d="M30 30 L36 20 L76 20 L82 30 Z" fill="${col}"/><path d="M33 30 L38 22 L74 22 L79 30 Z" fill="#2C3A4A"/><rect x="28" y="38" width="10" height="5" rx="2" fill="#FFF2B8"/><rect x="74" y="38" width="10" height="5" rx="2" fill="#FFF2B8"/><rect x="45" y="44" width="22" height="6" fill="#fff" stroke="#111" stroke-width=".8"/>`;
    return `<svg viewBox="0 0 112 63" xmlns="http://www.w3.org/2000/svg">${g}${b}</svg>`;
  };

  /* ---------- modal, toast ---------- */
  U.modal = function (html, wide) { const m = $('#md'); m.classList.toggle('wide', !!wide); m.innerHTML = html; $('#ov').classList.add('open'); const f = m.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea'); if (f) setTimeout(() => f.focus(), 30); };
  U.close = () => $('#ov').classList.remove('open');
  U.isModal = () => $('#ov').classList.contains('open');
  U.toast = (t, kind) => { const box = $('#toasts'); if (!box) return; const e = document.createElement('div'); e.className = 'toast ' + (kind || ''); e.textContent = t; box.appendChild(e); setTimeout(() => { e.classList.add('out'); setTimeout(() => e.remove(), 260); }, kind === 'alarm' ? 5000 : 2800); while (box.children.length > 4) box.firstChild.remove(); };
  U.icon = n => ({
    lot: '<svg viewBox="0 0 24 24"><path d="M3 11l2-5h14l2 5"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15" r="1.3"/><circle cx="16.5" cy="15" r="1.3"/></svg>',
    gate: '<svg viewBox="0 0 24 24"><path d="M4 20V8"/><path d="M4 9l16-4"/><path d="M4 20h4"/><circle cx="4" cy="8" r="1.6"/></svg>',
    shift: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M7 14h4"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M4 4h12v16H4z"/><path d="M16 12h5"/><path d="m18 9 3 3-3 3"/></svg>',
    report: '<svg viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20v-3"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  }[n] || '');
  U.countUp = (el, to, ms = 500) => { const from = 0, t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = S.fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
  U.val = id => { const e = document.getElementById(id); return e ? (e.type === 'checkbox' ? e.checked : e.value.trim()) : undefined; };
  U.print = html => { $('#print').innerHTML = html; window.print(); };

  JM.ui = U;
})();
