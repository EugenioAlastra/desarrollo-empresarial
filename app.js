/* Desarrollo empresarial — PWA sin servidor propio.
   Notas y progreso: se guardan en el dispositivo y se sincronizan con Supabase usando un código personal. */
(function () {
  'use strict';
  const SB_URL = 'https://ahmmvjsjnpbaglmgwhgu.supabase.co';
  const SB_KEY = 'sb_publishable_bc_y1lKEYe5crCR6ZSmmlg_8ta8A71g'; // clave pública por diseño; el acceso lo limita la política RLS por código
  const P = window.PLAN;
  const S = P.sesiones;
  const byId = {}; S.forEach(s => byId[s.id] = s);
  const $ = (q, el) => (el || document).querySelector(q);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TIPO = { nucleo: 'Núcleo', extra: 'Extra', practica: 'Práctica', checkpoint: 'Checkpoint' };

  /* ---------- almacenamiento local + sync ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  let code = LS.get('de:code', '');
  let items = LS.get('de:items', {});   // key -> {v, t}
  let dirty = new Set(LS.get('de:dirty', []));
  let syncMsg = '';
  const persist = () => { LS.set('de:items', items); LS.set('de:dirty', [...dirty]); };
  const val = (k, d) => (items[k] ? items[k].v : d);
  const note = id => (val('n:' + id, { text: '' }).text || '');
  const isDone = id => !!val('d:' + id, { done: false }).done;
  const doneAt = id => val('d:' + id, {}).at || '';

  function setItem(k, v) { items[k] = { v, t: new Date().toISOString() }; dirty.add(k); persist(); schedulePush(); }

  const headers = () => ({ apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'x-sync-code': code, 'Content-Type': 'application/json' });
  let pushTimer = null;
  function schedulePush() { setSync('Guardado en el dispositivo…'); clearTimeout(pushTimer); pushTimer = setTimeout(push, 900); }
  function setSync(m) { syncMsg = m; const e = $('#sync-state'); if (e) e.textContent = m; }

  async function push() {
    if (!code || !dirty.size) return pull();
    if (!navigator.onLine) { setSync('Sin conexión: se sincroniza luego'); return; }
    const keys = [...dirty];
    const rows = keys.map(k => ({ sync_code: code, key: k, value: items[k].v, updated_at: items[k].t }));
    try {
      const r = await fetch(SB_URL + '/rest/v1/estudio_items?on_conflict=sync_code,key', {
        method: 'POST', headers: Object.assign(headers(), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(rows)
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      keys.forEach(k => dirty.delete(k)); persist(); setSync('Sincronizado ✓');
    } catch (e) { setSync('No se pudo sincronizar (reintento luego)'); }
  }
  async function pull() {
    if (!code || !navigator.onLine) return;
    try {
      const r = await fetch(SB_URL + '/rest/v1/estudio_items?select=key,value,updated_at', { headers: headers() });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const rows = await r.json(); let changed = false;
      rows.forEach(x => {
        const loc = items[x.key];
        if (!loc || (!dirty.has(x.key) && Date.parse(x.updated_at) > Date.parse(loc.t))) { items[x.key] = { v: x.value, t: x.updated_at }; changed = true; }
      });
      persist(); setSync('Sincronizado ✓');
      if (changed && !editing()) render();
    } catch (e) { setSync('No se pudo sincronizar'); }
  }
  const editing = () => document.activeElement && document.activeElement.tagName === 'TEXTAREA';
  const syncAll = async () => { await push(); await pull(); };
  setInterval(() => { if (code && document.visibilityState === 'visible') syncAll(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && code) syncAll(); });
  window.addEventListener('online', () => code && syncAll());

  /* ---------- puerta de acceso (código personal) ---------- */
  function newCode() { const a = new Uint8Array(16); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); }
  function boot() {
    const m = location.hash.match(/[#&]c=([\w-]{16,64})/);
    if (m) { code = m[1]; LS.set('de:code', code); history.replaceState(null, '', location.pathname + '#/hoy'); }
    if (!code) {
      $('#gate').hidden = false; $('#app').hidden = true;
      $('#gate-enter').onclick = () => {
        const v = $('#gate-code').value.trim();
        if (!/^[\w-]{16,64}$/.test(v)) { $('#gate-msg').textContent = 'El código debe tener entre 16 y 64 letras o números.'; return; }
        code = v; LS.set('de:code', code); start();
      };
      $('#gate-new').onclick = () => { code = newCode(); LS.set('de:code', code); start(); location.hash = '#/ajustes'; };
      return;
    }
    start();
  }
  function start() {
    $('#gate').hidden = true; $('#app').hidden = false;
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/hoy';
    render(); syncAll();
  }

  /* ---------- cálculos ---------- */
  const requeridas = S.filter(s => s.tipo !== 'extra');
  const proxima = () => requeridas.find(s => !isDone(s.id)) || null;
  const faseDe = s => P.fases[s.fase];
  const bloqueDe = s => P.bloques[s.bloque];
  function statsBase() {
    const hechas = S.filter(s => isDone(s.id));
    const hechasReq = requeridas.filter(s => isDone(s.id));
    const minutos = hechas.reduce((a, s) => a + s.min, 0);
    const dias = {};
    hechas.forEach(s => { const d = (doneAt(s.id) || '').slice(0, 10); if (d) dias[d] = (dias[d] || 0) + 1; });
    return { hechas, hechasReq, minutos, dias };
  }
  const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
  function rachas(dias) {
    let cur = 0, d = new Date();
    if (!dias[iso(d)]) d.setDate(d.getDate() - 1);
    while (dias[iso(d)]) { cur++; d.setDate(d.getDate() - 1); }
    const ks = Object.keys(dias).sort(); let best = 0, run = 0, prev = null;
    ks.forEach(k => { const t = Date.parse(k); run = prev !== null && t - prev === 86400000 ? run + 1 : 1; prev = t; best = Math.max(best, run); });
    return { cur, best };
  }
  const bar = p => '<div class="bar"><i style="width:' + Math.round(p * 100) + '%"></i></div>';
  const fmtMin = m => (m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : '') : m + ' min');

  /* ---------- router ---------- */
  function render() {
    const h = location.hash || '#/hoy';
    const v = $('#view'); if (!v) return;
    const scrollY = window.scrollY;
    let tab = 'hoy';
    if (h.startsWith('#/s/')) { tab = 'plan'; vSesion(v, h.slice(4)); }
    else if (h.startsWith('#/plan')) { tab = 'plan'; vPlan(v); }
    else if (h.startsWith('#/buscar')) { tab = 'buscar'; vBuscar(v); }
    else if (h.startsWith('#/stats')) { tab = 'stats'; vStats(v); }
    else if (h.startsWith('#/ajustes')) { tab = 'ajustes'; vAjustes(v); }
    else vHoy(v);
    document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === tab));
    setSync(syncMsg);
    if (!h.startsWith('#/s/')) window.scrollTo(0, scrollY);
  }

  /* ---------- vistas ---------- */
  function filaSesion(s) {
    return '<a class="row ' + (isDone(s.id) ? 'done' : '') + '" href="#/s/' + s.id + '"><span class="ck">' + (isDone(s.id) ? '✓' : '') + '</span>' +
      '<span class="t">' + esc(s.titulo) + '<br><span class="chip">' + TIPO[s.tipo] + '</span>' + (note(s.id).trim() ? '<span class="chip">con notas</span>' : '') + '</span><span class="m">' + s.min + ' min</span></a>';
  }
  function vHoy(v) {
    const n = proxima(); const sb = statsBase();
    const pct = sb.hechasReq.length / requeridas.length;
    let h = '<h1>Hoy</h1>';
    if (n) {
      h += '<div class="card"><span class="chip">' + esc(faseDe(n).nombre) + '</span><span class="chip">' + esc(bloqueDe(n).nombre) + '</span><span class="chip">' + TIPO[n.tipo] + '</span>' +
        '<h2 style="margin-top:10px">' + esc(n.titulo) + '</h2><p>' + esc(n.desc) + '</p>' +
        (n.url ? '<a class="btn primary block" target="_blank" rel="noopener" href="' + esc(n.url) + '">' + esc(n.boton) + (n.ini ? ' (min ' + n.ini + ')' : '') + '</a>' : '') +
        '<a class="btn block" href="#/s/' + n.id + '">Abrir sesión y notas</a></div>';
    } else h += '<div class="card"><h2>Plan completo</h2><p>Terminaste todas las sesiones obligatorias. Revisá las estadísticas y cerrá tu Manual de principios.</p></div>';
    h += '<div class="card"><div class="small muted">Progreso del plan (' + sb.hechasReq.length + ' de ' + requeridas.length + ' sesiones obligatorias)</div><div class="big">' + Math.round(pct * 100) + '%</div>' + bar(pct) + '</div>';
    if (n) {
      const sig = requeridas.filter(s => !isDone(s.id)).slice(1, 4);
      if (sig.length) h += '<h2>Lo que sigue</h2><div class="card" style="padding:0">' + sig.map(filaSesion).join('') + '</div>';
    }
    h += '<p class="muted small">Plan obligatorio: ' + requeridas.length + ' sesiones de 30 min, unas ' + Math.round(requeridas.length / 3.5) + ' semanas a 3 o 4 por semana (' + Math.round(requeridas.length / 5) + ' a 5 por semana). Los extras son opcionales.</p><p class="muted small">Podés abrir cualquier sesión de cualquier fase desde la pestaña Plan, sin respetar el orden.</p>';
    v.innerHTML = h;
  }

  let verExtras = LS.get('de:extras', true);
  const abiertos = new Set(LS.get('de:open', []));
  function vPlan(v) {
    let h = '<h1>Plan</h1><div class="seg"><button class="btn ' + (verExtras ? 'on' : '') + '" id="tg-extras">' + (verExtras ? 'Extras visibles' : 'Extras ocultos') + '</button></div>';
    P.fases.forEach((f, fi) => {
      const sf = S.filter(s => s.fase === fi && s.tipo !== 'extra');
      const hf = sf.filter(s => isDone(s.id)).length;
      h += '<h2>Fase ' + (fi + 1) + ' · ' + esc(f.nombre) + '</h2><div class="small muted">' + esc(f.pregunta) + '</div><div style="margin:8px 0">' + bar(hf / sf.length) + '<div class="small muted">' + hf + ' de ' + sf.length + ' sesiones</div></div>';
      P.bloques.forEach((b, bi) => {
        if (b.fase !== fi) return;
        const ss = S.filter(s => s.bloque === bi && (verExtras || s.tipo !== 'extra'));
        const req = S.filter(s => s.bloque === bi && s.tipo !== 'extra'); const hb = req.filter(s => isDone(s.id)).length;
        h += '<details class="bl" data-b="' + bi + '"' + (abiertos.has(bi) ? ' open' : '') + '><summary><span><b>' + esc(b.nombre) + '</b><br><span class="small muted">' + esc(b.pregunta) + '</span></span><span class="small muted">' + hb + '/' + req.length + '</span></summary>' + ss.map(filaSesion).join('') + '</details>';
      });
    });
    v.innerHTML = h;
    $('#tg-extras').onclick = () => { verExtras = !verExtras; LS.set('de:extras', verExtras); render(); };
    v.querySelectorAll('details.bl').forEach(d => d.addEventListener('toggle', () => { const b = +d.dataset.b; d.open ? abiertos.add(b) : abiertos.delete(b); LS.set('de:open', [...abiertos]); }));
  }

  const PLANTILLA = 'Idea: \nFuente: {F}\nEvidencia: \nAplicación: \nPregunta abierta: \nEtiquetas: #\n\n';
  function vSesion(v, id) {
    const s = byId[id]; if (!s) { v.innerHTML = '<p>No encontré esa sesión.</p>'; return; }
    const i = S.indexOf(s); const prev = S[i - 1], next = S[i + 1];
    let h = '<a class="small muted" href="#/plan">← Plan</a><div style="margin-top:8px"><span class="chip">' + esc(faseDe(s).nombre) + '</span><span class="chip">' + esc(bloqueDe(s).nombre) + '</span><span class="chip">' + TIPO[s.tipo] + '</span></div>' +
      '<h1>' + esc(s.titulo) + '</h1><p class="muted small">' + esc(s.fuente) + ' · ' + s.min + ' min' + (s.url && s.ini ? ' · desde el minuto ' + s.ini : '') + '</p><p>' + esc(s.desc) + '</p>';
    if (s.url) h += '<a class="btn primary block" target="_blank" rel="noopener" href="' + esc(s.url) + '">' + esc(s.boton) + (s.ini ? ' (min ' + s.ini + ')' : '') + '</a>';
    h += '<button class="btn block" id="b-done"></button><h2>Notas</h2><div class="seg"><button class="btn" id="b-tpl">Insertar plantilla</button></div>' +
      '<textarea id="nota" placeholder="Idea: …&#10;Fuente: …&#10;Evidencia: …&#10;Aplicación: …&#10;Pregunta abierta: …&#10;Etiquetas: #principio #munger"></textarea>' +
      '<p class="small muted">Las líneas que empiezan con Idea:, Evidencia:, Aplicación: y Pregunta abierta:, y las #etiquetas, arman solas el cuadro sinóptico y los resúmenes de Estadísticas.</p>' +
      '<div class="nav2">' + (prev ? '<a class="btn" href="#/s/' + prev.id + '">← Anterior</a>' : '<span></span>') + (next ? '<a class="btn" href="#/s/' + next.id + '">Siguiente →</a>' : '') + '</div>';
    v.innerHTML = h; window.scrollTo(0, 0);
    const ta = $('#nota'); ta.value = note(id);
    let t = null;
    ta.oninput = () => { clearTimeout(t); t = setTimeout(() => setItem('n:' + id, { text: ta.value }), 500); };
    ta.onblur = () => { clearTimeout(t); if (ta.value !== note(id)) setItem('n:' + id, { text: ta.value }); };
    $('#b-tpl').onclick = () => { ta.value += (ta.value && !ta.value.endsWith('\n\n') ? '\n\n' : '') + PLANTILLA.replace('{F}', s.titulo); ta.focus(); ta.oninput(); };
    const bd = $('#b-done'); const paint = () => { bd.textContent = isDone(id) ? '✓ Hecha (tocá para desmarcar)' : 'Marcar como hecha'; bd.classList.toggle('primary', !isDone(id)); };
    paint(); bd.onclick = () => { setItem('d:' + id, isDone(id) ? { done: false } : { done: true, at: new Date().toISOString() }); paint(); };
  }


  /* ---------- buscador por contenido ---------- */
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9&+ ]+/g, ' ');
  const ZONAS = [['kw', 'tema', 3], ['titulo', 'título', 4], ['desc', 'descripción', 2], ['fuente', 'fuente', 2]];
  let idx = null;
  function indice() {
    if (idx) return idx;
    idx = S.map(s => ({ s, z: ZONAS.map(z => norm(s[z[0]])), ctx: norm(faseDe(s).nombre + ' ' + bloqueDe(s).nombre + ' ' + faseDe(s).pregunta + ' ' + bloqueDe(s).pregunta) }));
    return idx;
  }
  const empieza = (texto, q) => (' ' + texto).indexOf(' ' + q) >= 0;
  function buscar(q, extras) {
    const toks = [...new Set(norm(q).split(/\s+/).filter(t => t.length > 1))].filter(t => !STOP.has(t) || t.length > 3);
    if (!toks.length) return { toks, res: [], parcial: false };
    const notas = {}; S.forEach(s => { notas[s.id] = norm(note(s.id)); });
    const eval1 = it => {
      let pts = 0, hits = 0; const por = [];
      toks.forEach(t => {
        let w = 0;
        ZONAS.forEach((z, i) => { if (empieza(it.z[i], t)) w = Math.max(w, z[2]); });
        if (empieza(it.ctx, t)) w = Math.max(w, 1);
        if (empieza(notas[it.s.id], t)) w = Math.max(w, 2);
        if (w) { hits++; pts += w; por.push(t); }
      });
      return { it, pts, hits, por };
    };
    let todos = indice().filter(it => extras || it.s.tipo !== 'extra' || true).map(eval1).filter(r => r.hits);
    let exactos = todos.filter(r => r.hits === toks.length);
    const parcial = !exactos.length;
    const lista = (parcial ? todos : exactos).sort((a, b) => b.hits - a.hits || b.pts - a.pts || a.it.s.orden - b.it.s.orden);
    return { toks, res: lista, parcial };
  }
  function fraseTemas(s, toks) {
    // muestra hasta 6 palabras clave de la sesión, resaltando las que coinciden
    const ws = String(s.kw || '').split(/\s+/).filter(Boolean);
    const vistos = new Set(); const out = [];
    ws.forEach(w => { const n = norm(w).trim(); if (n && !vistos.has(n) && toks.some(t => n.indexOf(t) === 0)) { vistos.add(n); out.push(w); } });
    return out.slice(0, 5);
  }
  let qBusca = '', verExtrasBusca = true;
  function vBuscar(v) {
    v.innerHTML = '<h1>Buscar</h1><input id="q" class="inp" type="search" placeholder="Ej: cuello de botella, moat, valuación, ventas…" autocomplete="off">' +
      '<div class="seg"><button class="btn ' + (verExtrasBusca ? 'on' : '') + '" id="b-ex">' + (verExtrasBusca ? 'Incluye extras' : 'Solo obligatorias') + '</button></div>' +
      '<div id="res"></div><p class="small muted">Busca por el tema que se trata en cada video o lectura (conceptos, personas, empresas, marcos), no solo por el título. También busca en tus propias notas. Podés escribir en español o en inglés y varias palabras a la vez.</p>';
    const q = $('#q'); q.value = qBusca;
    const pintar = () => {
      qBusca = q.value; const r = buscar(qBusca); const box = $('#res');
      if (!r.toks.length) { box.innerHTML = '<div class="small muted" style="margin:10px 0">Escribí una o más palabras clave.</div>'; return; }
      const lista = r.res.filter(x => verExtrasBusca || x.it.s.tipo !== 'extra');
      if (!lista.length) { box.innerHTML = '<div class="card"><b>Sin resultados.</b><div class="small muted">Probá con una palabra más general o en otro idioma (por ejemplo "inversion" / "investing").</div></div>'; return; }
      const top = lista.slice(0, 40);
      box.innerHTML = '<div class="small muted" style="margin:10px 0">' + (r.parcial ? 'Ninguna sesión tiene todas las palabras. Te muestro las que coinciden con alguna: ' : '') + lista.length + (lista.length === 1 ? ' sesión' : ' sesiones') + (lista.length > top.length ? ' (primeras ' + top.length + ')' : '') + '</div><div class="card" style="padding:0">' +
        top.map(x => { const s = x.it.s; const tm = fraseTemas(s, r.toks);
          return '<a class="row ' + (isDone(s.id) ? 'done' : '') + '" href="#/s/' + s.id + '"><span class="ck">' + (isDone(s.id) ? '✓' : '') + '</span><span class="t">' + esc(s.titulo) + '<br><span class="chip">' + esc(faseDe(s).nombre) + '</span><span class="chip">' + TIPO[s.tipo] + '</span>' +
            (tm.length ? '<br><span class="small muted">Tema: ' + esc(tm.join(', ')) + '</span>' : '') + '</span><span class="m">' + s.min + ' min</span></a>'; }).join('') + '</div>';
    };
    q.oninput = pintar; $('#b-ex').onclick = () => { verExtrasBusca = !verExtrasBusca; vBuscar(v); };
    pintar(); if (!qBusca) q.focus();
  }

  /* ---------- análisis automático de notas (sin IA) ---------- */
  const STOP = new Set(('el la los las un una unos unas de del al y o u e a en con por para que se su sus lo le les mi tu es son fue ser como más mas pero si no ya muy sin sobre entre cuando donde este esta estos estas eso esa ese hay cada todo toda todos también tambien the and of to in is that it for on with as are was be by this from at or an not but have has had they their you your we our can will would more than so if its about into over out up one all idea fuente evidencia aplicación aplicacion pregunta abierta etiquetas').split(/\s+/));
  const RX = { idea: /^\s*(?:idea|principio)\s*[:\-]\s*(.*)$/i, fuente: /^\s*fuente\s*[:\-]\s*(.*)$/i, evidencia: /^\s*evidencia\s*[:\-]\s*(.*)$/i, aplicacion: /^\s*aplicaci[oó]n\s*[:\-]\s*(.*)$/i, pregunta: /^\s*pregunta(?:\s+abierta)?\s*[:\-]\s*(.*)$/i };
  function parseNota(texto) {
    const tarjetas = []; let cur = null; const heads = [];
    (texto || '').split('\n').forEach(l => {
      let m;
      if ((m = l.match(RX.idea))) { cur = { idea: m[1].trim(), fuente: '', evidencia: '', aplicacion: '', pregunta: '' }; tarjetas.push(cur); return; }
      if (/^#{1,3}\s+\S/.test(l)) { heads.push(l.replace(/^#+\s+/, '').trim()); return; }
      if (cur) for (const k of ['fuente', 'evidencia', 'aplicacion', 'pregunta']) if ((m = l.match(RX[k]))) { cur[k] = m[1].trim(); return; }
    });
    const tags = (texto.match(/(^|\s)#([\p{L}\d_-]{2,})/gu) || []).map(x => x.trim().slice(1).toLowerCase());
    return { tarjetas: tarjetas.filter(c => c.idea), heads, tags };
  }
  function analizar() {
    const filas = [], tagCnt = {}, words = {}; let notas = 0, preguntas = [], aplicaciones = [];
    S.forEach(s => {
      const t = note(s.id); if (!t.trim()) return; notas++;
      const p = parseNota(t);
      p.tarjetas.forEach(c => { filas.push(Object.assign({ s, tags: p.tags }, c)); if (c.pregunta) preguntas.push({ s, q: c.pregunta }); if (c.aplicacion) aplicaciones.push({ s, a: c.aplicacion }); });
      p.tags.forEach(g => tagCnt[g] = (tagCnt[g] || 0) + 1);
      t.toLowerCase().replace(/#[\p{L}\d_-]+/gu, ' ').match(/[\p{L}]{4,}/gu)?.forEach(w => { if (!STOP.has(w)) words[w] = (words[w] || 0) + 1; });
    });
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
    return { filas, notas, tags: top(tagCnt), words: top(words).slice(0, 60), preguntas, aplicaciones };
  }

  /* ---------- estadísticas ---------- */
  let statTab = 'prog';
  function vStats(v) {
    const sb = statsBase(), r = rachas(sb.dias), an = analizar();
    const tabs = [['prog', 'Progreso'], ['sin', 'Cuadro sinóptico'], ['res', 'Resúmenes'], ['img', 'Imágenes']];
    let h = '<h1>Estadísticas</h1><div class="seg">' + tabs.map(t => '<button class="btn ' + (statTab === t[0] ? 'on' : '') + '" data-st="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    if (statTab === 'prog') {
      h += '<div class="grid"><div class="card"><div class="small muted">Sesiones hechas</div><div class="big">' + sb.hechas.length + '</div></div>' +
        '<div class="card"><div class="small muted">Tiempo de estudio</div><div class="big">' + fmtMin(sb.minutos) + '</div></div>' +
        '<div class="card"><div class="small muted">Racha actual</div><div class="big">' + r.cur + ' d</div></div>' +
        '<div class="card"><div class="small muted">Mejor racha</div><div class="big">' + r.best + ' d</div></div>' +
        '<div class="card"><div class="small muted">Notas escritas</div><div class="big">' + an.notas + '</div></div>' +
        '<div class="card"><div class="small muted">Ideas registradas</div><div class="big">' + an.filas.length + '</div></div></div>';
      h += '<h2>Por fase</h2>';
      P.fases.forEach((f, fi) => { const sf = S.filter(s => s.fase === fi && s.tipo !== 'extra'); const hf = sf.filter(s => isDone(s.id)).length; h += '<div class="card"><b>Fase ' + (fi + 1) + ' · ' + esc(f.nombre) + '</b><div class="small muted">' + hf + ' de ' + sf.length + '</div>' + bar(hf / sf.length) + '</div>'; });
      h += '<h2>Últimas 15 semanas</h2><div class="card">' + heatmap(sb.dias) + '</div>';
    } else if (statTab === 'sin') {
      h += '<p class="muted small">Se arma sola con las líneas Idea / Evidencia / Aplicación de tus notas.</p>';
      if (!an.filas.length) h += '<div class="card">Todavía no hay ideas. Escribí una nota con la plantilla (botón «Insertar plantilla» dentro de una sesión).</div>';
      P.fases.forEach((f, fi) => {
        const fs = an.filas.filter(x => x.s.fase === fi); if (!fs.length) return;
        h += '<h2>Fase ' + (fi + 1) + ' · ' + esc(f.nombre) + '</h2><div class="tw"><table class="sin"><tr><th>Bloque / sesión</th><th>Idea</th><th>Evidencia</th><th>Aplicación</th></tr>' +
          fs.map(x => '<tr><td>' + esc(bloqueDe(x.s).nombre) + '<br><a class="small muted" href="#/s/' + x.s.id + '">' + esc(x.s.titulo.slice(0, 48)) + '</a></td><td><b>' + esc(x.idea) + '</b>' + (x.tags.length ? '<br>' + x.tags.map(g => '<span class="tag">#' + esc(g) + '</span>').join('') : '') + '</td><td>' + esc(x.evidencia) + '</td><td>' + esc(x.aplicacion) + '</td></tr>').join('') + '</table></div>';
      });
    } else if (statTab === 'res') {
      h += '<h2>Etiquetas más usadas</h2><div class="card">' + (an.tags.length ? an.tags.slice(0, 20).map(t => '<span class="tag">#' + esc(t[0]) + ' · ' + t[1] + '</span>').join('') : '<span class="muted">Sin etiquetas todavía. Usá #palabra en tus notas.</span>') + '</div>';
      h += '<h2>Palabras que más repetís</h2><div class="card">' + (an.words.length ? an.words.slice(0, 25).map(t => '<span class="tag">' + esc(t[0]) + ' · ' + t[1] + '</span>').join('') : '<span class="muted">Sin datos todavía.</span>') + '</div>';
      h += '<h2>Preguntas abiertas</h2><div class="card">' + (an.preguntas.length ? '<ul>' + an.preguntas.map(q => '<li>' + esc(q.q) + ' <a class="small muted" href="#/s/' + q.s.id + '">ver</a></li>').join('') + '</ul>' : '<span class="muted">Ninguna.</span>') + '</div>';
      h += '<h2>Aplicaciones para hacer</h2><div class="card">' + (an.aplicaciones.length ? '<ul>' + an.aplicaciones.map(q => '<li>' + esc(q.a) + ' <a class="small muted" href="#/s/' + q.s.id + '">ver</a></li>').join('') + '</ul>' : '<span class="muted">Ninguna.</span>') + '</div>';
      h += '<h2>Manual de principios (borrador)</h2><div class="card"><div class="seg"><button class="btn" id="b-md-copy">Copiar</button><button class="btn" id="b-md-dl">Descargar .md</button></div><div class="pre">' + esc(manual(an)) + '</div></div>';
    } else {
      h += '<p class="muted small">Imágenes generadas automáticamente con tus notas y tu progreso.</p><div class="card"><b>Nube de palabras</b><br><canvas id="cv-nube" width="900" height="520"></canvas><div class="seg"><button class="btn" data-dl="cv-nube" data-n="nube-de-palabras">Descargar PNG</button></div></div>' +
        '<div class="card"><b>Tarjeta de progreso</b><br><canvas id="cv-prog" width="900" height="520"></canvas><div class="seg"><button class="btn" data-dl="cv-prog" data-n="progreso">Descargar PNG</button></div></div>';
    }
    v.innerHTML = h;
    v.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { statTab = b.dataset.st; render(); });
    if (statTab === 'res') { const md = manual(an); $('#b-md-copy').onclick = () => navigator.clipboard && navigator.clipboard.writeText(md); $('#b-md-dl').onclick = () => descargar('manual-de-principios.md', md, 'text/markdown'); }
    if (statTab === 'img') {
      dibujarNube($('#cv-nube'), an); dibujarProgreso($('#cv-prog'), sb, r);
      v.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => { const a = document.createElement('a'); a.href = document.getElementById(b.dataset.dl).toDataURL('image/png'); a.download = b.dataset.n + '.png'; a.click(); });
    }
  }
  function heatmap(dias) {
    const W = 15, cell = 16, gap = 3; const end = new Date(); const start = new Date(end);
    start.setDate(end.getDate() - (W * 7 - 1)); const dow = (start.getDay() + 6) % 7; start.setDate(start.getDate() - dow);
    let svg = '<svg viewBox="0 0 ' + (W + 1) * (cell + gap) + ' ' + 7 * (cell + gap) + '" style="width:100%;height:auto">'; const d = new Date(start);
    for (let w = 0; w <= W; w++) for (let k = 0; k < 7; k++) { if (d <= end) { const n = dias[iso(d)] || 0; const op = n === 0 ? 0.12 : Math.min(1, 0.35 + n * 0.2); svg += '<rect x="' + w * (cell + gap) + '" y="' + k * (cell + gap) + '" width="' + cell + '" height="' + cell + '" rx="3" fill="currentColor" opacity="' + op + '"><title>' + iso(d) + ': ' + n + '</title></rect>'; } d.setDate(d.getDate() + 1); }
    return svg + '</svg>';
  }
  function manual(an) {
    let m = '# Manual de principios (borrador automático)\n\n';
    P.fases.forEach((f, fi) => {
      const fs = an.filas.filter(x => x.s.fase === fi); if (!fs.length) return;
      m += '## Fase ' + (fi + 1) + ' · ' + f.nombre + '\n\n';
      fs.forEach(x => { m += '- ' + x.idea + (x.evidencia ? ' — Evidencia: ' + x.evidencia : '') + (x.aplicacion ? ' — Aplicación: ' + x.aplicacion : '') + '\n'; });
      m += '\n';
    });
    return an.filas.length ? m : m + '(Todavía no hay ideas registradas.)\n';
  }
  function descargar(n, txt, tipo) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: tipo })); a.download = n; a.click(); }
  function dibujarNube(cv, an) {
    const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
    const base = an.tags.slice(0, 20).map(t => ['#' + t[0], t[1] * 3]).concat(an.words.slice(0, 40));
    if (!base.length) { c.fillStyle = '#777'; c.font = '28px sans-serif'; c.textAlign = 'center'; c.fillText('Escribí notas para ver tu nube de palabras', cv.width / 2, cv.height / 2); return; }
    const max = base[0][1] || 1; const placed = []; c.textBaseline = 'middle'; c.textAlign = 'center';
    base.sort((a, b) => b[1] - a[1]).forEach((w, i) => {
      const size = Math.max(16, Math.round(18 + 52 * (w[1] / max))); c.font = '700 ' + size + 'px sans-serif'; const tw = c.measureText(w[0]).width, th = size;
      for (let k = 0; k < 600; k++) {
        const ang = k * 0.5, rad = 4 * k * 0.5; const x = cv.width / 2 + Math.cos(ang) * rad * 1.6, y = cv.height / 2 + Math.sin(ang) * rad;
        const box = [x - tw / 2 - 4, y - th / 2, x + tw / 2 + 4, y + th / 2];
        if (box[0] < 6 || box[2] > cv.width - 6 || box[1] < 6 || box[3] > cv.height - 6) continue;
        if (placed.some(p => !(box[2] < p[0] || box[0] > p[2] || box[3] < p[1] || box[1] > p[3]))) continue;
        placed.push(box); const g = 20 + (i * 17) % 110; c.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'; c.fillText(w[0], x, y); break;
      }
    });
  }
  function dibujarProgreso(cv, sb, r) {
    const c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#ededed'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.font = '700 40px sans-serif'; c.fillText('Desarrollo empresarial', 50, 80);
    const pct = sb.hechasReq.length / requeridas.length; c.font = '700 110px sans-serif'; c.fillText(Math.round(pct * 100) + '%', 50, 210);
    c.font = '26px sans-serif'; c.fillStyle = '#9a9a9a'; c.fillText(sb.hechasReq.length + ' de ' + requeridas.length + ' sesiones obligatorias · ' + fmtMin(sb.minutos) + ' · racha ' + r.cur + ' d', 50, 255);
    P.fases.forEach((f, fi) => { const sf = S.filter(s => s.fase === fi && s.tipo !== 'extra'); const hf = sf.filter(s => isDone(s.id)).length; const y = 320 + fi * 46;
      c.fillStyle = '#ededed'; c.font = '22px sans-serif'; c.fillText('Fase ' + (fi + 1) + ' · ' + f.nombre, 50, y); c.fillStyle = '#2c2c2c'; c.fillRect(420, y - 18, 420, 16); c.fillStyle = '#ededed'; c.fillRect(420, y - 18, 420 * hf / sf.length, 16); });
  }

  /* ---------- ajustes ---------- */
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (location.hash.startsWith('#/ajustes')) render(); });
  function vAjustes(v) {
    const link = location.origin + location.pathname + '#c=' + code;
    v.innerHTML = '<h1>Ajustes</h1>' +
      '<div class="card"><b>Tu código personal</b><p class="muted small">Con este código ves tus notas y tu progreso en cualquier dispositivo. Guardalo: quien lo tenga puede ver y editar tus notas.</p><div class="pre">' + esc(code) + '</div>' +
      '<button class="btn block" id="a-copy">Copiar enlace para abrir en otro dispositivo</button><button class="btn block" id="a-sync">Sincronizar ahora</button><p class="small muted" id="a-msg">' + esc(syncMsg) + '</p></div>' +
      '<div class="card"><b>Instalar en el celular</b><p class="muted small">Android (Chrome): menú ⋮ → «Instalar aplicación». iPhone (Safari): Compartir → «Agregar a pantalla de inicio».</p>' + (deferredInstall ? '<button class="btn primary block" id="a-install">Instalar ahora</button>' : '') + '</div>' +
      '<div class="card"><b>Exportar</b><button class="btn block" id="a-exp">Descargar todas mis notas (.md)</button></div>' +
      '<div class="card"><b>Salir de este dispositivo</b><p class="muted small">Borra el código y las notas guardadas en este dispositivo. No borra lo sincronizado.</p><button class="btn block" id="a-out">Salir</button></div>';
    $('#a-copy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); $('#a-msg').textContent = 'Enlace copiado. Abrilo en tu otro dispositivo.'; };
    $('#a-sync').onclick = async () => { $('#a-msg').textContent = 'Sincronizando…'; await syncAll(); $('#a-msg').textContent = syncMsg; };
    if (deferredInstall) $('#a-install').onclick = () => { deferredInstall.prompt(); deferredInstall = null; };
    $('#a-exp').onclick = () => { let m = '# Mis notas\n\n'; S.forEach(s => { const t = note(s.id).trim(); if (t) m += '## ' + s.titulo + ' (' + faseDe(s).nombre + ' · ' + bloqueDe(s).nombre + ')\n\n' + t + '\n\n'; }); descargar('mis-notas.md', m, 'text/markdown'); };
    $('#a-out').onclick = () => { if (confirm('¿Salir de este dispositivo? Se borran el código y las notas locales (lo sincronizado queda guardado).')) { ['de:code', 'de:items', 'de:dirty'].forEach(k => localStorage.removeItem(k)); location.hash = ''; location.reload(); } };
  }

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  boot();
})();
