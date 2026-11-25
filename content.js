if (!window.__markerLoaded) {
  window.__markerLoaded = true;
  initMarker();
}

function initMarker() {
  const PALETTE = [
    ['lemon', '#ffe066'],
    ['blue', '#74c0fc'],
    ['rose', '#faa2c1'],
    ['mint', '#8ce99a'],
    ['peach', '#ffc078'],
    ['lilac', '#d0bfff'],
  ];
  const COLOR = Object.fromEntries(PALETTE);
  const MARK = 'mk-hl';

  let active = false;
  let recent = ['lemon', 'blue'];
  let opId = 0;
  let popupHost = null;
  let popupAnchor = null;
  let panelHost = null;
  let panelOpen = false;

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .row { display: flex; align-items: center; gap: 8px; padding: 6px 8px;
      background: var(--mk-bg); color: var(--mk-fg); border: 1px solid var(--mk-bd);
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.18);
      font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .sw { width: 18px; height: 18px; border-radius: 50%; cursor: pointer;
      border: 1px solid rgba(0,0,0,.28); flex: none; }
    .sw.cur { box-shadow: 0 0 0 2px var(--mk-acc); }
    .sw:hover { transform: scale(1.12); }
    button { font: inherit; color: inherit; background: none; border: none;
      cursor: pointer; padding: 2px 7px; border-radius: 5px; white-space: nowrap; }
    button:hover { background: var(--mk-hover); }
    .panel { display: flex; flex-direction: column; width: 320px; max-height: 70vh;
      background: var(--mk-bg); color: var(--mk-fg); border: 1px solid var(--mk-bd);
      border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.22); overflow: hidden;
      font: 13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .hd { display: flex; align-items: center; justify-content: space-between;
      padding: 9px 12px; border-bottom: 1px solid var(--mk-bd); font-weight: 600; }
    .hd button { font-size: 15px; line-height: 1; padding: 1px 6px; }
    .list { overflow-y: auto; padding: 6px 12px; flex: 1; user-select: text; }
    .item { display: flex; gap: 8px; padding: 6px 0; align-items: baseline; }
    .item + .item { border-top: 1px solid var(--mk-bd2); }
    .dot { width: 9px; height: 9px; border-radius: 50%; flex: none;
      position: relative; top: -1px; }
    .q { user-select: text; cursor: text; }
    .empty { padding: 14px 12px; opacity: .6; }
    .ft { display: flex; gap: 6px; padding: 8px 12px; border-top: 1px solid var(--mk-bd); }
    .ft button { border: 1px solid var(--mk-bd); padding: 4px 10px; border-radius: 6px; }
    .ft button:hover { background: var(--mk-hover); }
    :host { --mk-bg: #ffffff; --mk-fg: #222228; --mk-bd: #d9d9de;
      --mk-bd2: #ececef; --mk-hover: rgba(0,0,0,.06); --mk-acc: #4a9eff; }
    @media (prefers-color-scheme: dark) {
      :host { --mk-bg: #26262b; --mk-fg: #e9e9ec; --mk-bd: #3f3f46;
        --mk-bd2: #34343a; --mk-hover: rgba(255,255,255,.08); --mk-acc: #6fb2ff; }
    }`;

  function host(css, styles) {
    const h = document.createElement('div');
    h.dataset.marker = '1';
    Object.assign(h.style, styles);
    const root = h.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    root.appendChild(style);
    document.documentElement.appendChild(h);
    return { h, root };
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function swatch(name, extraCls) {
    const s = el('button', 'sw' + (extraCls ? ' ' + extraCls : ''));
    s.style.backgroundColor = COLOR[name];
    s.title = name;
    return s;
  }

  // ---------- popup ----------

  function dismissPopup() {
    popupHost?.remove();
    popupHost = null;
    popupAnchor = null;
  }

  function positionPopup(h, rect) {
    const w = h.offsetWidth;
    const hh = h.offsetHeight;
    let x = rect.left + rect.width / 2 - w / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    let y = rect.top - hh - 8;
    if (y < 8) y = rect.bottom + 8;
    y = Math.min(y, window.innerHeight - hh - 8);
    h.style.left = x + 'px';
    h.style.top = y + 'px';
  }

  function showPopup(rect, buildMain, anchor) {
    dismissPopup();
    const { h, root } = host(CSS, {
      position: 'fixed',
      zIndex: '2147483647',
      left: '0px',
      top: '0px',
    });
    const row = el('div', 'row');
    root.appendChild(row);
    buildMain(row);
    popupHost = h;
    popupAnchor = anchor ?? null;
    positionPopup(h, rect);
  }

  function paletteRow(row, onPick, current) {
    row.textContent = '';
    for (const [name] of PALETTE) {
      const s = swatch(name, name === current ? 'cur' : '');
      s.addEventListener('click', () => onPick(name));
      row.appendChild(s);
    }
  }

  function recentRow(row, onPick, current) {
    recent.slice(0, 2).forEach((name) => {
      const s = swatch(name, name === current ? 'cur' : '');
      s.addEventListener('click', () => onPick(name));
      row.appendChild(s);
    });
    const pick = el('button', '', 'Pick color');
    pick.addEventListener('click', () => paletteRow(row, onPick, current));
    row.appendChild(pick);
  }

  function cancelBtn() {
    const b = el('button', '', 'Cancel');
    b.addEventListener('click', dismissPopup);
    return b;
  }

  function showSelectionPopup(range) {
    const rect = range.getBoundingClientRect();
    showPopup(
      rect,
      (row) => {
        recentRow(
          row,
          (name) => {
            wrapRange(range, name);
            pushRecent(name);
            dismissPopup();
          },
          recent[0]
        );
        row.appendChild(cancelBtn());
      },
      range
    );
  }

  function showMarkPopup(mark) {
    const rect = mark.getBoundingClientRect();
    showPopup(
      rect,
      (row) => {
        recentRow(
          row,
          (name) => {
            sameGroup(mark).forEach((m) => colorMark(m, name));
            pushRecent(name);
            refreshPanel();
            dismissPopup();
          },
          mark.dataset.color
        );
        const remove = el('button', '', 'Remove');
        remove.addEventListener('click', () => {
          sameGroup(mark).forEach(unwrapMark);
          refreshPanel();
          dismissPopup();
        });
        row.append(remove, cancelBtn());
      },
      mark
    );
  }

  function pushRecent(name) {
    recent = [name, ...recent.filter((c) => c !== name)].slice(0, PALETTE.length);
  }

  // ---------- marks ----------

  function colorMark(m, name) {
    m.dataset.color = name;
    m.style.setProperty('background-color', COLOR[name], 'important');
  }

  function makeMark(name, id) {
    const m = document.createElement('mark');
    m.className = MARK;
    m.dataset.mkid = id;
    m.style.setProperty('color', '#1a1a1a', 'important');
    m.style.setProperty('border-radius', '2px', 'important');
    m.style.setProperty('padding', '0 1px', 'important');
    m.style.setProperty('cursor', 'pointer', 'important');
    colorMark(m, name);
    return m;
  }

  function unwrapMark(m) {
    const p = m.parentNode;
    if (!p) return;
    while (m.firstChild) p.insertBefore(m.firstChild, m);
    p.removeChild(m);
    p.normalize();
  }

  function marksIntersecting(range) {
    const hits = [...document.querySelectorAll('mark.' + MARK)].filter((m) => {
      try {
        if (!range.intersectsNode(m)) return false;
        const r = document.createRange();
        r.selectNodeContents(m);
        if (r.compareBoundaryPoints(Range.START_TO_START, range) < 0)
          r.setStart(range.startContainer, range.startOffset);
        if (r.compareBoundaryPoints(Range.END_TO_END, range) > 0)
          r.setEnd(range.endContainer, range.endOffset);
        return !r.collapsed;
      } catch {
        return false;
      }
    });
    // Touching one segment touches the whole logical highlight.
    const ids = new Set(hits.map((m) => m.dataset.mkid).filter(Boolean));
    if (!ids.size) return hits;
    return [...document.querySelectorAll('mark.' + MARK)].filter((m) =>
      ids.has(m.dataset.mkid)
    );
  }

  function sameGroup(mark) {
    const id = mark.dataset.mkid;
    if (!id) return [mark];
    return [...document.querySelectorAll('mark.' + MARK)].filter(
      (m) => m.dataset.mkid === id
    );
  }

  function groupedMarks() {
    const groups = [];
    for (const m of document.querySelectorAll('mark.' + MARK)) {
      const last = groups[groups.length - 1];
      if (last && last.id && last.id === m.dataset.mkid) last.marks.push(m);
      else groups.push({ id: m.dataset.mkid, marks: [m] });
    }
    return groups;
  }

  function wrapRange(range, colorName) {
    for (const m of marksIntersecting(range)) unwrapMark(m);
    const id = String(++opId);

    let root =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;
    if (!root || !root.isConnected) root = document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      try {
        if (range.intersectsNode(n) && n.nodeValue) nodes.push(n);
      } catch {
        /* node detached */
      }
    }

    for (const node of nodes) {
      if (node.closest && node.closest('mark.' + MARK)) continue;
      const r = document.createRange();
      r.selectNodeContents(node);
      if (r.compareBoundaryPoints(Range.START_TO_START, range) < 0)
        r.setStart(range.startContainer, range.startOffset);
      if (r.compareBoundaryPoints(Range.END_TO_END, range) > 0)
        r.setEnd(range.endContainer, range.endOffset);
      if (r.collapsed) continue;
      const s = r.startOffset;
      const e = r.endOffset;
      const mid = node.splitText(s);
      mid.splitText(e - s);
      const m = makeMark(colorName, id);
      mid.parentNode.insertBefore(m, mid);
      m.appendChild(mid);
    }
    window.getSelection()?.removeAllRanges();
    refreshPanel();
  }

  // ---------- panel ----------

  function refreshPanel() {
    if (!panelHost) return;
    const list = panelHost.shadowRoot.querySelector('.list');
    const marks = [...document.querySelectorAll('mark.' + MARK)];
    list.textContent = '';
    if (!marks.length) {
      list.appendChild(el('div', 'empty', 'No highlights yet — select text to mark.'));
      return;
    }
    for (const g of groupedMarks()) {
      const item = el('div', 'item');
      const dot = el('span', 'dot');
      dot.style.backgroundColor = COLOR[g.marks[0].dataset.color] ?? '#ccc';
      const text = g.marks
        .map((m) => m.textContent)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      const q = el('span', 'q', text);
      item.append(dot, q);
      list.appendChild(item);
    }
  }

  function openPanel() {
    if (panelHost) return;
    const { h, root } = host(CSS, {
      position: 'fixed',
      zIndex: '2147483647',
      right: '16px',
      top: '80px',
    });
    const panel = el('div', 'panel');
    const hd = el('div', 'hd');
    hd.appendChild(el('span', '', 'Highlights'));
    const close = el('button', '', '×');
    close.title = 'Close';
    close.addEventListener('click', closePanel);
    hd.appendChild(close);
    const list = el('div', 'list');
    const ft = el('div', 'ft');
    const copyAll = el('button', '', 'Copy all');
    copyAll.addEventListener('click', () => {
      copyAllQuotes();
      copyAll.textContent = 'Copied';
      setTimeout(() => (copyAll.textContent = 'Copy all'), 1200);
    });
    const clear = el('button', '', 'Clear all');
    clear.addEventListener('click', () => {
      [...document.querySelectorAll('mark.' + MARK)].forEach(unwrapMark);
      refreshPanel();
    });
    ft.append(copyAll, clear);
    panel.append(hd, list, ft);
    root.appendChild(panel);
    panelHost = h;
    panelOpen = true;
    refreshPanel();
  }

  function closePanel() {
    panelHost?.remove();
    panelHost = null;
    panelOpen = false;
  }

  function togglePanel() {
    panelOpen ? closePanel() : openPanel();
  }

  function copyAllQuotes() {
    const text = groupedMarks()
      .map(
        (g) =>
          '- ' +
          g.marks
            .map((m) => m.textContent)
            .join('')
            .replace(/\s+/g, ' ')
            .trim()
      )
      .join('\n');
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    } else {
      legacyCopy(text);
    }
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* no-op */
    }
    ta.remove();
  }

  // ---------- listeners ----------

  function onMouseUp(e) {
    if (e.button !== 0 || e.target.dataset?.marker) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.toString().trim()) return;
    showSelectionPopup(range);
  }

  function onClick(e) {
    if (e.target.dataset?.marker) return;
    const mark = e.target.closest?.('mark.' + MARK);
    if (mark) {
      e.preventDefault();
      e.stopPropagation();
      showMarkPopup(mark);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (popupHost) dismissPopup();
      else if (panelOpen) closePanel();
    }
  }

  function onScroll() {
    if (!popupHost || !popupAnchor) return;
    let rect;
    try {
      rect = popupAnchor.getBoundingClientRect();
    } catch {
      return;
    }
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    positionPopup(popupHost, rect);
  }

  function activate() {
    if (active) return;
    active = true;
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  }

  function deactivate() {
    if (!active) return;
    active = false;
    dismissPopup();
    closePanel();
    [...document.querySelectorAll('mark.' + MARK)].forEach(unwrapMark);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('scroll', onScroll, { capture: true, passive: true });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'mk-status') sendResponse({ active });
    else if (msg.type === 'mk-activate') activate();
    else if (msg.type === 'mk-deactivate') deactivate();
    else if (msg.type === 'mk-toggle-panel' && active) togglePanel();
  });

  // Injection itself is the activation gesture.
  activate();

  window.__mk = {
    wrapRange,
    unwrapMark,
    marksIntersecting,
    activate,
    deactivate,
    openPanel,
    togglePanel,
  };
}
