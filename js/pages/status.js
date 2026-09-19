/* ②ステータス画面：レベル／もちもの／つかいたい／やりとり／コレクション */
import { $, esc, num, setText, toast, dateLabel, pad2, section } from '../core/util.js';
import { renderIcon } from '../core/icons.js';
import { otherProfiles, useItem, sendItem } from '../core/store.js';
import { ownedLvImages, clearProbeCache } from '../ui/levelart.js';

let galleryKey = '';

export function renderStatus(kid){
  const p = kid.player;
  setText('statusLv', 'Lv. ' + p.level);
  setText('statusMoney', p.money.toLocaleString());
  setText('statusDateText', dateLabel());
  const pct = Math.min(100, Math.round(p.exp / p.expToNext * 100));
  const bar = $('statusExpBar'); if(bar) bar.style.width = pct + '%';
  setText('statusExpPct', pct + '%');
  setText('statusExpText', p.exp + ' / ' + p.expToNext);
  setText('avatarName', p.name);
  setText('avatarLv', 'Lv.' + p.level);

  renderInventory(kid);
  renderItemHelp(kid);
  renderUseList(kid);
  renderTrade(kid);
  renderGallery(kid);
}

/* もちもの */
function renderInventory(kid){
  const grid = $('invGrid'); if(!grid) return;
  const key = kid.inventory.map(i=>[i.id,i.name,i.qty,i.icon].join(',')).join('|');

  const changed = section(grid, key, ()=>
    kid.inventory.length
      ? kid.inventory.map(i=>`
          <div class="inv-item">
            <div class="inv-icon">${renderIcon(i.icon,'s-inv','🎁')}</div>
            <div class="inv-name">${esc(i.name)}${i.qty > 1 ? ' ×' + i.qty : ''}</div>
            <button class="use-btn" data-use="${esc(i.id)}">つかう</button>
          </div>`).join('')
      : '<div class="inv-empty">なにも もっていません</div>'
  );
  if(!changed) return;

  grid.querySelectorAll('.use-btn').forEach(b=>{
    b.addEventListener('click', async ()=>{
      b.disabled = true;
      try{ await useItem(b.dataset.use); toast('かんりしゃに「つかいたい」を送りました'); }
      catch(e){ toast('うまく送れませんでした'); b.disabled = false; }
    });
  });
}

/* もちものの説明
   アイテム名に決まった言葉が入っているときだけ、下に説明を出します */
const ITEM_HELP = [
  { key:'お金チケット',   fb:'🎫',
    text:'おこづかいの代わりに使ったら、その分のお金をもらえる。足りなくて後日になるときもあります。' },
  { key:'ゲーム',         fb:'🎮',
    text:'もう少しゲームをしたいとき、親がOKしたときだけゲーム時間を追加できる。' },
  { key:'おかしチケット', fb:'🍬',
    text:'買い物に行った時にほしいおかしがあったとき、チケットを使うことでその分のおかしを買ってもらうことができる。' }
];

function renderItemHelp(kid){
  const wrap = $('itemHelp'); if(!wrap) return;

  const hits = ITEM_HELP.map(h=>{
    const own = kid.inventory.find(i=>String(i.name || '').includes(h.key));
    return own ? { h, icon: own.icon || '' } : null;
  }).filter(Boolean);

  const key = hits.map(x=>x.h.key + ':' + x.icon).join('|');

  section(wrap, key, ()=>
    hits.length
      ? `<div class="help-sec-title">アイテムの せつめい</div>
         <div class="help-list">${hits.map(x=>`
           <div class="help-row">
             ${renderIcon(x.icon, 's-use', x.h.fb)}
             <div class="help-body">
               <div class="help-name">${esc(x.h.key)}</div>
               <div class="help-text">${esc(x.h.text)}</div>
             </div>
           </div>`).join('')}</div>`
      : ''
  );
}

/* つかいたい（かくにん まち） */
function renderUseList(kid){
  const wrap = $('useWrap'); if(!wrap) return;
  const key = kid.useRequests.map(r=>[r.id,r.name,r.icon].join(',')).join('|');
  section(wrap, key, ()=>
    kid.useRequests.length
      ? `<div class="use-sec-title">つかっています（かんりしゃの かくにん まち）</div>
         <div class="use-list">${kid.useRequests.map(r=>`
           <div class="use-row">
             ${renderIcon(r.icon,'s-use','🎁')}
             <span class="u-name">${esc(r.name)}</span>
             <span class="u-state">使用中</span>
           </div>`).join('')}</div>`
      : ''
  );
}

/* アイテムのやりとり */
function renderTrade(kid){
  const wrap = $('tradeWrap'); if(!wrap) return;
  const others = otherProfiles();
  const key = kid.inventory.map(i=>i.id + ':' + i.qty + ':' + i.name).join('|')
    + '#' + others.map(o=>o.id + ':' + o.name).join(',');

  const changed = section(wrap, key, ()=>{
    if(!kid.inventory.length || !others.length){
      return `<div class="trade-title">★ アイテムのやりとり ★</div>
        <div class="trade-empty">${!others.length ? 'おくる相手がいません' : 'おくれるアイテムがありません'}</div>`;
    }
    return `
      <div class="trade-title">★ アイテムのやりとり ★</div>
      <div class="trade-row">
        <label for="tradeItem">アイテム</label>
        <select id="tradeItem">${kid.inventory.map(i=>
          `<option value="${esc(i.id)}">${esc(i.name)}（${i.qty}こ）</option>`).join('')}</select>
      </div>
      <div class="trade-row">
        <label for="tradeTo">だれに</label>
        <select id="tradeTo">${others.map(o=>
          `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('')}</select>
        <input id="tradeQty" type="number" value="1" min="1">
      </div>
      <button class="send-btn" id="tradeSend">おくる</button>
      <div class="trade-note">おくったアイテムは すぐに相手のもちものへ入ります</div>`;
  });
  if(!changed) return;

  const send = $('tradeSend'); if(!send) return;
  send.addEventListener('click', async ()=>{
    const invId = $('tradeItem').value, toId = $('tradeTo').value;
    const qty = Math.max(1, num($('tradeQty').value, 1));
    const it = kid.inventory.find(i=>i.id === invId);
    if(!it){ toast('アイテムが見つかりません'); return; }
    if(it.qty < qty){ toast('そんなに もっていません'); return; }
    send.disabled = true;
    try{
      await sendItem(invId, toId, qty);
      toast('「'+it.name+'」を おくりました！');
    }catch(e){ toast('おくれませんでした'); }
    finally{ send.disabled = false; }
  });
}

/* レベルコレクション */
async function renderGallery(kid){
  const wrap = $('galleryWrap'); if(!wrap) return;
  const key = 'lv' + kid.player.level;
  if(galleryKey === key) return;
  galleryKey = key;

  const list = await ownedLvImages(kid.player.level);
  wrap.innerHTML = `<div class="gallery-title">★ レベルコレクション ★</div>
    <div class="lv-grid">${
      list.length
        ? list.map(x=>`<div class="lv-cell" data-src="${esc(x.src)}" data-lv="${x.lv}" role="button" tabindex="0">
            <img class="lv-gallery-img" src="${esc(x.src)}" alt="Lv.${pad2(x.lv)}">
            <div class="lv-cap">Lv.${pad2(x.lv)}</div></div>`).join('')
        : '<div class="gallery-empty">まだ画像がありません</div>'
    }</div>`;

  wrap.querySelectorAll('.lv-cell').forEach(c=>{
    const open = ()=>openLvImage(c.dataset.src, c.dataset.lv);
    c.addEventListener('click', open);
    c.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); }
    });
  });
}

/* あとから画像を足したときのために、さがし直せるようにします */
export function resetGallery(){ galleryKey = ''; clearProbeCache(); }

function openLvImage(src, lv){
  const m = $('imgModal');
  $('imgModalPic').src = src;
  $('imgModalCap').textContent = 'Lv.' + pad2(num(lv,1));
  m.classList.add('show');
}
export function bindImgModal(){
  const m = $('imgModal');
  if(m) m.addEventListener('click', ()=>m.classList.remove('show'));
}
