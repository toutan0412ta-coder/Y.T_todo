/* ③お店画面：商品購入とガチャ（品ぞろえは catalog/main＝全員共通） */
import { GACHA_ANIM, SHOP_ICON_MAX, SHOP_ICON_STACK } from '../core/config.js';
import { $, esc, num, setText, toast, section } from '../core/util.js';
import { renderIcon, brokenSrc, freezeCurrentFrame } from '../core/icons.js';
import { state, buyItem, payAndGetPrize } from '../core/store.js';

let shopTab = 'buy', spinning = false;
const natural = {};                       /* 画像のもとの大きさを覚えます */

export function renderShop(kid, catalog){
  setText('shopMoney', kid.player.money.toLocaleString());
  setText('gachaCostText', catalog.gacha.cost);
  renderBuyPanel(kid, catalog);
  renderGachaPanel(kid, catalog);
}

/* ---------- 商品購入 ---------- */
function renderBuyPanel(kid, catalog){
  const list = $('shopList'); if(!list) return;
  const key = catalog.shopItems.map(i=>[i.id,i.name,i.price,i.desc,i.icon].join(',')).join('|')
    + '#' + kid.player.money;

  const changed = section(list, key, ()=>
    catalog.shopItems.length
      ? catalog.shopItems.map(it=>{
          const poor = kid.player.money < it.price;
          return `<div class="shop-item-row" data-item="${esc(it.id)}">
            <div class="shop-item-icon">${renderIcon(it.icon,'s-shop','🎁')}</div>
            <div class="shop-item-info">
              <div class="shop-item-name">${esc(it.name)}</div>
              <div class="shop-item-desc">${esc(it.desc)}</div>
              <div class="shop-item-price">${renderIcon(kid.icons.coin,'s-use','🪙')}${it.price.toLocaleString()}</div>
            </div>
            <button class="buy-btn" data-buy="${esc(it.id)}" ${poor ? 'disabled' : ''}>${poor ? 'おかね不足' : '購入'}</button>
          </div>`;
        }).join('')
      : '<div class="sec-empty">商品が まだ ありません</div>'
  );
  if(!changed) return;

  list.querySelectorAll('.shop-item-row').forEach(fitShopIcon);
  list.querySelectorAll('.buy-btn').forEach(b=>{
    b.addEventListener('click', async ()=>{
      const it = catalog.shopItems.find(x=>x.id === b.dataset.buy);
      if(!it) return;
      b.disabled = true;
      try{ await buyItem(it); toast('「'+it.name+'」を購入しました！'); }
      catch(e){
        toast(e.message === 'money' ? 'お金が足りません！' : '購入できませんでした');
        b.disabled = false;
      }
    });
  });
}

/* 大きい商品アイコン（〜512px）は、その行を縦ならびにします */
function shopIconBase(){
  const cs = getComputedStyle(document.documentElement);
  const base  = parseFloat(cs.getPropertyValue('--ic-shop'))  || 30;
  const scale = parseFloat(cs.getPropertyValue('--ic-scale')) || 1;
  return Math.min(SHOP_ICON_MAX, base * scale * 1.9);
}
function applySize(img, row, w, h){
  const size = Math.min(shopIconBase(), Math.max(w, h));   /* 元の絵より大きくはしません */
  if(size <= SHOP_ICON_STACK){
    img.classList.remove('shop-icon-big');
    img.style.width = '';
    row.classList.remove('has-big-icon');
    return;
  }
  img.classList.add('shop-icon-big');
  img.style.width = size + 'px';
  row.classList.add('has-big-icon');
}
function fitShopIcon(row){
  const img = row.querySelector('.shop-item-icon img.ri');
  if(!img) return;                                   /* 絵文字のときは何もしません */
  const src = img.getAttribute('src') || '';
  if(natural[src]) applySize(img, row, natural[src].w, natural[src].h);
  if(img.complete && img.naturalWidth){
    natural[src] = {w:img.naturalWidth, h:img.naturalHeight};
    applySize(img, row, img.naturalWidth, img.naturalHeight);
    return;
  }
  img.addEventListener('load', ()=>{
    if(!img.naturalWidth) return;
    natural[src] = {w:img.naturalWidth, h:img.naturalHeight};
    applySize(img, row, img.naturalWidth, img.naturalHeight);
  }, {once:true});
}

/* ---------- ガチャ ---------- */
const isMiss = g => /はずれ|外れ|MISS/i.test(String(g.name) + ' ' + String(g.rarity));

function renderGachaPanel(kid, catalog){
  const pool = catalog.gacha.pool;
  const btn = $('gachaBtn');
  if(btn){
    btn.disabled = spinning || !pool.length || kid.player.money < catalog.gacha.cost;
    btn.textContent = spinning ? '…' : (!pool.length ? '準備中' : 'ガチャを回す');
  }

  const wrap = $('gachaLineup'); if(!wrap) return;
  const seen = new Set(kid.gachaSeen);
  const key = pool.map(g=>[g.id,g.name,g.rarity,g.icon,seen.has(g.id)?1:0].join(',')).join('|')
    + '#' + (kid.icons.gachaUnknown || '');

  section(wrap, key, ()=>
    `<div class="lineup-title">★ ラインナップ（${pool.filter(g=>seen.has(g.id)).length} / ${pool.length}）★</div>
     <div class="lineup-grid">${
       pool.length ? pool.map(g=>{
         const got = seen.has(g.id);
         const cls = 'lineup-cell' + (got ? (isMiss(g) ? ' miss' : '') : ' unknown');
         const icon = got ? g.icon : kid.icons.gachaUnknown;
         const name = got ? esc(g.name) : '?'.repeat(Math.min(8, String(g.name).length || 3));
         return `<div class="${cls}">
           <div class="lineup-icon">${renderIcon(icon,'s-lineup', got ? '🎁' : '❓')}</div>
           <div class="lineup-name">${name}</div>
           <div class="lineup-rarity">${got ? esc(g.rarity) : '???'}</div>
         </div>`;
       }).join('') : '<div class="lineup-empty">準備中です</div>'
     }</div>
     <div class="lineup-note">※ ガチャの内容は、みんなの画面で共通です</div>`
  );
}

function pickPrize(pool){
  const total = pool.reduce((a,g)=>a + Math.max(0, num(g.weight,1)), 0);
  if(total <= 0) return pool[0];
  let r = Math.random() * total;
  for(const g of pool){ r -= Math.max(0, num(g.weight,1)); if(r < 0) return g; }
  return pool[pool.length - 1];
}

/* 演出：12秒だけ再生 → そのコマで静止 → 結果
   画面タップでは進みません。「スキップ」ボタンだけで進みます */
function playAnim(kid, done){
  const src = kid.icons.gachaGif;
  const box = $('gachaAnim'), im = $('gachaAnimGif'), btn = $('gachaSkipBtn');
  if(!src || brokenSrc.has(src) || !box){ done(); return; }

  let finished = false, t1 = null, t2 = null;
  const finish = ()=>{
    if(finished) return;
    finished = true;
    clearTimeout(t1); clearTimeout(t2);
    box.classList.remove('show');
    box.setAttribute('aria-hidden','true');
    im.removeAttribute('src');
    done();
  };
  btn.onclick = finish;
  im.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'r=' + Date.now();   /* 毎回1コマ目から */
  box.classList.add('show');
  box.setAttribute('aria-hidden','false');
  t1 = setTimeout(()=>{
    freezeCurrentFrame(im);
    t2 = setTimeout(finish, GACHA_ANIM.holdMs);
  }, GACHA_ANIM.playMs);
}

function showResult(prize, miss){
  const m = $('gachaModal');
  $('modalIcon').innerHTML = renderIcon(prize.icon, 's-modal', miss ? '💨' : '🎁');
  $('modalRarity').textContent = miss ? 'MISS' : prize.rarity;
  $('modalName').textContent   = miss ? (prize.name || 'はずれ…') : prize.name;
  m.classList.add('show');
}

export function bindShop(){
  document.querySelectorAll('.shop-tab-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      shopTab = b.dataset.shoptab;
      document.querySelectorAll('.shop-tab-btn').forEach(x=>x.classList.toggle('active', x === b));
      $('panel-buy').classList.toggle('active', shopTab === 'buy');
      $('panel-gacha').classList.toggle('active', shopTab === 'gacha');
    });
  });
  $('modalClose').addEventListener('click', ()=>$('gachaModal').classList.remove('show'));

  $('gachaBtn').addEventListener('click', async ()=>{
    const kid = state.kid, cat = state.catalog;
    if(spinning) return;
    if(!cat.gacha.pool.length){ toast('ガチャの準備中です'); return; }
    if(kid.player.money < cat.gacha.cost){ toast('お金が足りません！'); return; }

    const prize = pickPrize(cat.gacha.pool);
    const miss  = isMiss(prize);
    spinning = true;
    $('gachaBtn').disabled = true;
    try{
      await payAndGetPrize(cat.gacha.cost, prize, miss);
      playAnim(kid, ()=>{ spinning = false; showResult(prize, miss); });
    }catch(e){
      spinning = false;
      toast(e.message === 'money' ? 'お金が足りません！' : 'ガチャを回せませんでした');
    }
  });
}
