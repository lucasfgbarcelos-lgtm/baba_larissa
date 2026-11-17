'use strict';

/* ============ Dados (salvos no próprio celular, via localStorage) ============ */
const KEY = 'rotina-bebe:v1';
const app = document.getElementById('app');
let db = load();

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return d && Array.isArray(d.children) ? d : { children: [] };
  } catch (e) { return { children: [] }; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('Não foi possível salvar. O armazenamento do celular está cheio?'); }
}

/* ============ Utilidades ============ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtBR = iso => iso.split('-').reverse().join('/');
const weekday = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long' }); };
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bebe';
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ============ Atividades ============ */
const CATS = {
  mamou:     { label: 'Mamou',       icon: '🤱', color: '#ec6b8f', chips: ['Peito direito', 'Peito esquerdo', 'Os dois peitos'] },
  mamadeira: { label: 'Mamadeira',   icon: '🍼', color: '#f08a5d', chips: ['60 ml', '90 ml', '120 ml', '150 ml', '180 ml'] },
  comeu:     { label: 'Comeu',       icon: '🥣', color: '#e0a82e', chips: ['Almoço', 'Jantar', 'Lanche', 'Fruta', 'Papinha', 'Comeu bem', 'Comeu pouco'] },
  soneca:    { label: 'Soneca',      icon: '😴', color: '#7b83eb', chips: ['Primeira soneca', 'Segunda soneca', 'Sono da noite'] },
  acordou:   { label: 'Acordou',     icon: '☀️', color: '#4fb3a9', chips: [] },
  fralda:    { label: 'Fralda',      icon: '🧷', color: '#a0866b', chips: ['Xixi', 'Cocô', 'Xixi e cocô', 'Cocô líquido'] },
  banho:     { label: 'Banho',       icon: '🛁', color: '#4aa3df', chips: [] },
  brincou:   { label: 'Brincadeira', icon: '🧸', color: '#8fbf5a', chips: ['Tapete de interação', 'Livrinho', 'Música'] },
  passeio:   { label: 'Passeio',     icon: '🌳', color: '#3fa66b', chips: ['Passeio no parque', 'Passeio na rua'] },
  golfou:    { label: 'Golfou',      icon: '🤧', color: '#c9754a', chips: ['Pequeno episódio', 'Troca de roupa'] },
  remedio:   { label: 'Remédio',     icon: '💊', color: '#9a6fd1', chips: [] },
  outro:     { label: 'Outro',       icon: '📝', color: '#8895a7', chips: [] }
};
const catOf = e => CATS[e.cat] || CATS.outro;

const entryText = e => catOf(e).label + (e.detail ? ' – ' + e.detail : '');
const entryTime = e => e.end ? `${e.time} – ${e.end}` : e.time;
const sortedEntries = s => [...s.entries].sort((a, b) => (a.time + (a.end || '')).localeCompare(b.time + (b.end || '')));

/* ============ Rotas (#/, #/c/:id, #/c/:id/s/:id) ============ */
const go = p => { location.hash = '#/' + p; };
window.addEventListener('hashchange', route);

function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'c' && h[1]) {
    const c = db.children.find(x => x.id === h[1]);
    if (!c) return go('');
    if (h[2] === 's' && h[3]) {
      const s = c.sheets.find(x => x.id === h[3]);
      if (!s) return go('c/' + c.id);
      return viewSheet(c, s);
    }
    return viewChild(c);
  }
  viewHome();
}

/* ============ Tela 1: crianças ============ */
function viewHome() {
  window.scrollTo(0, 0);
  const kids = db.children;
  app.innerHTML = `
    <header class="hero">
      <img src="icons/icon-192.png" alt="">
      <h1>Rotina do Bebê</h1>
      <p>Anote o dia inteiro e gere o PDF</p>
    </header>
    <section class="card">
      <h2>Nova criança</h2>
      <form id="fChild" class="row" autocomplete="off">
        <input id="nm" placeholder="Nome da criança" maxlength="40" required>
        <button class="btn">Começar</button>
      </form>
    </section>
    ${kids.length ? `
      <h3 class="sec">Crianças</h3>
      <div class="list">
        ${kids.map(c => `
          <div class="item" data-a="openChild" data-id="${c.id}">
            <div class="avatar">${esc(c.name.trim().charAt(0).toUpperCase())}</div>
            <div class="grow"><b>${esc(c.name)}</b><small>${plural(c.sheets.length, 'ficha', 'fichas')}</small></div>
            <button class="icon" data-a="delChild" data-id="${c.id}" aria-label="Apagar ${esc(c.name)}">🗑️</button>
          </div>`).join('')}
      </div>` : ''}
  `;
}

/* ============ Tela 2: fichas da criança ============ */
function viewChild(c) {
  window.scrollTo(0, 0);
  const sheets = [...c.sheets].sort((a, b) => b.date.localeCompare(a.date));
  app.innerHTML = `
    <div class="top">
      <button class="back" data-a="home" aria-label="Voltar">‹</button>
      <div><small>Fichas de</small><h1>${esc(c.name)}</h1></div>
    </div>
    <section class="card">
      <button class="btn big" data-a="today">+ Ficha de hoje</button>
      <label for="dt">Outra data</label>
      <div class="row">
        <input id="dt" type="date" value="${todayISO()}">
        <button class="btn ghost" data-a="newDate">Criar</button>
      </div>
    </section>
    <h3 class="sec">Fichas</h3>
    ${sheets.length ? `<div class="list">${sheets.map(s => `
      <div class="item" data-a="openSheet" data-id="${s.id}">
        <div class="grow"><b>${fmtBR(s.date)}</b><small>${esc(weekday(s.date))} · ${plural(s.entries.length, 'registro', 'registros')}</small></div>
        <button class="pill" data-a="pdfList" data-id="${s.id}">PDF</button>
        <button class="icon" data-a="delSheet" data-id="${s.id}" aria-label="Apagar ficha">🗑️</button>
      </div>`).join('')}</div>`
      : `<div class="empty">Nenhuma ficha ainda.<br>Toque em “Ficha de hoje” para começar.</div>`}
  `;
}

/* ============ Tela 3: ficha do dia ============ */
function viewSheet(c, s) {
  const keep = window.scrollY;
  const list = sortedEntries(s);
  app.innerHTML = `
    <div class="top">
      <button class="back" data-a="child" aria-label="Voltar">‹</button>
      <div><small>${esc(weekday(s.date))}, ${fmtBR(s.date)}</small><h1>${esc(c.name)}</h1></div>
    </div>
    <h3 class="sec" style="margin-top:4px">O que aconteceu?</h3>
    <div class="grid">
      ${Object.entries(CATS).map(([k, v]) => `
        <button class="cat" style="--c:${v.color}" data-a="add" data-cat="${k}"><span>${v.icon}</span>${v.label}</button>`).join('')}
    </div>
    <h3 class="sec">Linha do tempo</h3>
    ${list.length ? `<div class="timeline">${list.map(e => `
      <div class="tl" style="--c:${catOf(e).color}">
        <i></i><time>${esc(entryTime(e))}</time>
        <div class="txt">${esc(entryText(e))}</div>
        <button class="edit" data-a="edit" data-id="${e.id}" aria-label="Editar">✏️</button>
      </div>`).join('')}</div>`
      : `<div class="empty">Nada anotado ainda.<br>Toque em uma atividade acima.</div>`}
    <section class="card notes-card">
      <h2>Observações do dia</h2>
      <textarea id="notes" placeholder="Ex.: ficou mais agitado à tarde, febre, novo alimento…">${esc(s.notes || '')}</textarea>
    </section>
    <div class="bar">
      <button class="btn" data-a="pdf">📄 Gerar PDF</button>
      <button class="btn ghost" data-a="share">Compartilhar</button>
    </div>
  `;
  window.scrollTo(0, keep);
}

/* ============ Janela de registro ============ */
function openEntry(c, s, catKey, entry) {
  const cat = CATS[catKey];
  const e = entry || { id: uid(), cat: catKey, time: nowHM(), end: '', detail: '' };
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <h2><span>${cat.icon}</span>${cat.label}</h2>
      <div class="two">
        <div><label for="eT">Horário</label><input id="eT" type="time" value="${e.time}" required></div>
        <div><label for="eE">Até (opcional)</label><input id="eE" type="time" value="${e.end || ''}"></div>
      </div>
      ${cat.chips.length ? `<div class="chips">${cat.chips.map(t => `<button type="button" class="chip${e.detail === t ? ' on' : ''}" data-chip="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
      <label for="eD">Detalhes (opcional)</label>
      <input id="eD" maxlength="120" value="${esc(e.detail)}" placeholder="Ex.: comeu manga, quantidade média">
      <div class="actions">
        ${entry ? '<button class="btn warn" data-x="del" style="flex:.6">Apagar</button>' : ''}
        <button class="btn ghost" data-x="cancel" style="flex:.8">Cancelar</button>
        <button class="btn" data-x="ok">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const $ = q => ov.querySelector(q);
  const close = () => ov.remove();
  ov.addEventListener('click', ev => {
    if (ev.target === ov) return close();
    const chip = ev.target.closest('[data-chip]');
    if (chip) {
      const input = $('#eD');
      const on = chip.classList.contains('on');
      ov.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      if (on) { input.value = ''; } else { chip.classList.add('on'); input.value = chip.dataset.chip; }
      return;
    }
    const x = ev.target.closest('[data-x]');
    if (!x) return;
    if (x.dataset.x === 'cancel') return close();
    if (x.dataset.x === 'del') {
      s.entries = s.entries.filter(i => i.id !== e.id);
      save(); close(); route(); return toast('Registro apagado');
    }
    if (x.dataset.x === 'ok') {
      const t = $('#eT').value;
      if (!t) return toast('Informe o horário');
      e.time = t; e.end = $('#eE').value; e.detail = $('#eD').value.trim();
      if (!entry) s.entries.push(e);
      save(); close(); route();
      toast(entry ? 'Registro atualizado' : 'Registro salvo');
    }
  });
  setTimeout(() => $('#eD').focus({ preventScroll: true }), 50);
}

/* ============ Cliques e formulários (delegação) ============ */
function ctx() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  const c = db.children.find(x => x.id === h[1]);
  const s = c && c.sheets.find(x => x.id === h[3]);
  return { c, s };
}

function newSheet(c, date) {
  const found = c.sheets.find(s => s.date === date);
  if (found) { go(`c/${c.id}/s/${found.id}`); return toast('Essa data já tem ficha'); }
  const s = { id: uid(), date, notes: '', entries: [] };
  c.sheets.push(s); save();
  go(`c/${c.id}/s/${s.id}`);
}

app.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  const a = el.dataset.a, id = el.dataset.id;
  const { c, s } = ctx();
  switch (a) {
    case 'home': return go('');
    case 'child': return go('c/' + c.id);
    case 'openChild': return go('c/' + id);
    case 'delChild': {
      const k = db.children.find(x => x.id === id);
      if (k && confirm(`Apagar ${k.name} e todas as fichas?\nIsso não pode ser desfeito.`)) {
        db.children = db.children.filter(x => x.id !== id); save(); viewHome(); toast('Criança apagada');
      }
      return;
    }
    case 'today': return newSheet(c, todayISO());
    case 'newDate': {
      const v = document.getElementById('dt').value;
      return v ? newSheet(c, v) : toast('Escolha uma data');
    }
    case 'openSheet': return go(`c/${c.id}/s/${id}`);
    case 'delSheet': {
      const sh = c.sheets.find(x => x.id === id);
      if (sh && confirm(`Apagar a ficha de ${fmtBR(sh.date)}?\nIsso não pode ser desfeito.`)) {
        c.sheets = c.sheets.filter(x => x.id !== id); save(); viewChild(c); toast('Ficha apagada');
      }
      return;
    }
    case 'pdfList': { const sh = c.sheets.find(x => x.id === id); return sh && exportPDF(c, sh, false); }
    case 'add': return openEntry(c, s, el.dataset.cat);
    case 'edit': { const e = s.entries.find(x => x.id === id); return e && openEntry(c, s, e.cat, e); }
    case 'pdf': return exportPDF(c, s, false);
    case 'share': return exportPDF(c, s, true);
  }
});

app.addEventListener('submit', ev => {
  if (ev.target.id !== 'fChild') return;
  ev.preventDefault();
  const name = document.getElementById('nm').value.trim();
  if (!name) return;
  let c = db.children.find(k => k.name.toLowerCase() === name.toLowerCase());
  if (!c) { c = { id: uid(), name, sheets: [] }; db.children.push(c); save(); }
  go('c/' + c.id);
});

app.addEventListener('input', ev => {
  if (ev.target.id !== 'notes') return;
  const { s } = ctx();
  if (s) { s.notes = ev.target.value; save(); }
});

/* ============ PDF ============ */
function buildPDF(c, s) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 12, GAP = 10;
  const colW = (W - 2 * M - GAP) / 2;
  const PER_COL = 15, PER_PAGE = PER_COL * 2;
  const ROW_H = 13, BOX_H = 10.5, TOP = 44;
  const entries = sortedEntries(s);
  const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));

  const header = () => {
    doc.setFillColor('#dcebfa'); doc.setDrawColor('#a9c8e8'); doc.setLineWidth(0.4);
    doc.roundedRect(M, M, W - 2 * M, 26, 4, 4, 'FD');
    let title = 'RELATÓRIO DO ' + c.name.toUpperCase();
    let fs = 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fs);
    while (doc.getTextWidth(title) > 118 && fs > 9) { fs -= 0.5; doc.setFontSize(fs); }
    doc.setTextColor('#1d2b3a');
    doc.text(title, M + 6, M + 10);
    doc.setFontSize(10.5); doc.setFont('helvetica', 'normal');
    doc.text('DATA: ' + fmtBR(s.date), W - M - 6, M + 10, { align: 'right' });
    doc.setDrawColor('#a9c8e8'); doc.line(M + 6, M + 14, W - M - 6, M + 14);
    doc.setFontSize(10);
    doc.text('RESUMO DE ATIVIDADES E OBSERVAÇÕES', W / 2, M + 21, { align: 'center' });
  };

  const box = (x, y, e) => {
    const cat = catOf(e);
    doc.setFillColor('#eef5fc'); doc.setDrawColor('#b7d0ea'); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, colW, BOX_H, 2.5, 2.5, 'FD');
    doc.setFillColor(cat.color);
    doc.circle(x + 4.5, y + BOX_H / 2, 1.5, 'F');
    const prefix = entryTime(e) + ' – ';
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.8); doc.setTextColor('#1d2b3a');
    const pw = doc.getTextWidth(prefix);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(entryText(e), colW - 9 - pw - 2).slice(0, 2);
    const y1 = lines.length > 1 ? y + 4.4 : y + BOX_H / 2 + 1.1;
    doc.setFont('helvetica', 'bold'); doc.text(prefix, x + 8.5, y1);
    doc.setFont('helvetica', 'normal');
    lines.forEach((ln, i) => doc.text(ln, x + 8.5 + pw, y1 + i * 3.6));
  };

  for (let p = 0; p < pages; p++) {
    if (p > 0) doc.addPage();
    header();
    const slice = entries.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
    if (!slice.length) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor('#6b7c8f');
      doc.text('Nenhuma atividade registrada neste dia.', W / 2, TOP + 20, { align: 'center' });
    } else {
      const rows = Math.min(PER_COL, slice.length);
      doc.setDrawColor('#a9c8e8'); doc.setLineWidth(0.5);
      doc.line(W / 2, TOP - 2, W / 2, TOP + rows * ROW_H - 3);
      slice.forEach((e, i) => {
        const left = i < PER_COL;
        const r = left ? i : i - PER_COL;
        const x = left ? M : M + colW + GAP;
        const y = TOP + r * ROW_H;
        const mid = y + BOX_H / 2;
        doc.setDrawColor('#a9c8e8'); doc.setLineWidth(0.4);
        doc.line(left ? x + colW : x, mid, W / 2, mid);
        doc.setFillColor('#a9c8e8'); doc.circle(W / 2, mid, 0.9, 'F');
        box(x, y, e);
      });
    }
    // Observações na última página
    if (p === pages - 1 && s.notes && s.notes.trim()) {
      const ny = TOP + PER_COL * ROW_H + 2;
      doc.setFillColor('#ffffff'); doc.setDrawColor('#b7d0ea'); doc.setLineWidth(0.3);
      doc.roundedRect(M, ny, W - 2 * M, 38, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor('#2a5f98');
      doc.text('Observações do dia', M + 5, ny + 7);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor('#1d2b3a');
      const nl = doc.splitTextToSize(s.notes.trim(), W - 2 * M - 10).slice(0, 7);
      doc.text(nl, M + 5, ny + 13);
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#8895a7');
    doc.text(`Página ${p + 1} de ${pages}`, W - M, H - 8, { align: 'right' });
    doc.text('Rotina do Bebê', M, H - 8);
  }
  return doc.output('blob');
}

async function exportPDF(c, s, share) {
  let blob;
  try { blob = buildPDF(c, s); }
  catch (e) { console.error(e); return toast('Erro ao gerar o PDF'); }
  const name = `rotina-${slug(c.name)}-${s.date}.pdf`;
  if (share) {
    const file = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Rotina de ${c.name} – ${fmtBR(s.date)}` }); }
      catch (e) { /* cancelado */ }
      return;
    }
    toast('Compartilhar não é suportado aqui. Baixando…');
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast('PDF gerado');
}

/* ============ Início ============ */
route();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
