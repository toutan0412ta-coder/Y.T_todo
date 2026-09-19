/* フッターの3ボタンとページ切りかえ
   ステータスの絵だけ、とうり／ゆいかで別の画像になります */
import { NAV_ITEMS } from '../core/config.js';
import { $, esc } from '../core/util.js';
import { brokenSrc } from '../core/icons.js';

export let curTab = 'main';
const changeHooks = new Set();
export function onTabChange(fn){ changeHooks.add(fn); }

export function switchTab(tab){
  curTab = tab;
  ['main','status','shop'].forEach(t=>{
    const el = $('screen-' + t);
    if(!el) return;
    el.classList.toggle('hidden', t !== tab);
    el.classList.toggle('active', t === tab);   /* ← 追加 */
  });
  const tb = $('topbar');
  if(tb) tb.classList.toggle('hidden', tab !== 'main');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab === tab));
  const body = $('appBody'); if(body) body.scrollTop = 0;
  window.scrollTo(0, 0);
  changeHooks.forEach(fn=>{ try{ fn(tab); }catch(e){ console.error(e); } });
}

export function renderNav(kid){
  const bar = $('navbar'); if(!bar) return;
  const key = NAV_ITEMS.map(n=>kid.icons[n.icon] || '').join('|') + '#' + curTab;
  if(bar.dataset.key === key) return;
  bar.dataset.key = key;

  bar.innerHTML = NAV_ITEMS.map(n=>{
    const src = kid.icons[n.icon];
    const img = (src && !brokenSrc.has(src))
      ? `<img class="nav-img" data-icon="${n.icon}" data-fb="${n.fb}" src="${esc(src)}" alt="${esc(n.label)}">`
      : `<span class="nav-img">${n.fb}</span>`;
    return `<div class="nav-btn${n.tab === curTab ? ' active' : ''}" data-tab="${n.tab}"
      role="button" tabindex="0" aria-label="${esc(n.label)}" title="${esc(n.label)}">${img}</div>`;
  }).join('');

  bar.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>switchTab(btn.dataset.tab));
    btn.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); switchTab(btn.dataset.tab); }
    });
  });
}
