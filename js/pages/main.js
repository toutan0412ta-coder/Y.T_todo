/* ①メイン画面：メッセージ＋タイル */
import { KIND_META, KIND_ORDER } from '../core/config.js';
import { $, esc, num, toast, whenLabel, section } from '../core/util.js';
import { renderIcon, miniIcon, brokenSrc } from '../core/icons.js';
import { setTilePending } from '../core/store.js';

function rewardHTML(t, icons){
  const out = [];
  if(t.rewardExp)   out.push(`<span>${miniIcon(icons.star,'⭐')}+${t.rewardExp}</span>`);
  if(t.rewardMoney) out.push(`<span>${miniIcon(icons.coin,'🪙')}+${t.rewardMoney}</span>`);
  return out.length ? `<div class="tile-reward">${out.join('')}</div>` : '';
}

function tileHTML(t, icons){
  const cls = ['tile'];
  if(t.kind === 'special') cls.push('special');
  if(t.completed) cls.push('done');
  else if(t.pending) cls.push('pending');

  const card = t.cardImage && !brokenSrc.has(t.cardImage);
  if(card) cls.push('has-card');

  const inner = card
    ? `<img class="tile-card-img" src="${esc(t.cardImage)}" alt="">`
    : `<div class="tile-icon">${renderIcon(t.icon || '📌','s-tile','📌')}</div>
       <div class="tile-label">${esc(t.label)}</div>`;

  const when = (t.pending && !t.completed) ? whenLabel(t.pendingAt) : '';

  return `<div class="${cls.join(' ')}" data-tile="${esc(t.id)}" role="button" tabindex="0">
    ${inner}
    ${(t.kind === 'special' && !t.completed && !t.pending)
      ? '<div class="sp-surface"></div><div class="sp-stars"><i></i><i></i><i></i><i></i><i></i></div>' : ''}
    ${t.completed ? '<div class="done-spark"><i></i><i></i><i></i><i></i></div>' : ''}
    ${rewardHTML(t, icons)}
    ${when ? `<div class="tile-pend-day">申請中（${esc(when)}）</div>` : ''}
    ${card ? `<div class="tile-name-bar">${esc(t.label)}</div>` : ''}
  </div>`;
}

export function renderMain(kid){
  /* メッセージ */
  const box = $('msgBox');
  if(box){
    if(kid.message){ box.hidden = false; $('msgBody').textContent = kid.message; }
    else box.hidden = true;
  }

  const wrap = $('tileSections'); if(!wrap) return;

  /* 見た目に関わる値だけを並べた「見分け札」。変わっていなければ描きなおしません */
  const key = kid.tiles.map(t=>[t.id,t.kind,t.label,t.icon,t.cardImage,
    t.rewardExp,t.rewardMoney,t.completed?1:0,t.pending?1:0,t.archived?1:0,
    t.pendingAt,num(t.ord,0)].join(',')).join('|')
    + '#' + (kid.icons.star||'') + ',' + (kid.icons.coin||'');

  const changed = section(wrap, key, ()=> KIND_ORDER.map(kind=>{
    const list = kid.tiles.filter(t=>t.kind === kind && !t.archived);
    const m = KIND_META[kind];
    const body = list.length
      ? `<div class="tile-grid">${list.map(t=>tileHTML(t, kid.icons)).join('')}</div>`
      : `<div class="sec-empty">いまは ありません</div>`;
    return `<div class="sec-title">${m.title}<span class="sec-note">${m.note}</span></div>${body}`;
  }).join(''));

  if(!changed) return;

  wrap.querySelectorAll('.tile').forEach(el=>{
    const t = kid.tiles.find(x=>x.id === el.dataset.tile);
    const go = ()=>tapTile(t);
    el.addEventListener('click', go);
    el.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); }
    });
  });
}

async function tapTile(t){
  if(!t) return;
  if(t.completed){ toast('もう達成しているよ！'); return; }
  try{
    if(t.pending){ await setTilePending(t.id, false); toast('申請をとりけしました'); }
    else{ await setTilePending(t.id, true); toast('「'+t.label+'」を申請しました！'); }
  }catch(e){ toast('うまく送れませんでした'); }
}
