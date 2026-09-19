/* この子のデータを読み（購読）・書く（更新）ところ
   ・自分のデータ … kids/{APP_ID}   ← 子ごとに完全に別
   ・商品とガチャ … catalog/main    ← 全員共通
   ・なまえ一覧   … profiles        ← アイテムのやりとり用          */
import { APP_ID, APP_NAME, DEFAULT_ICONS, DEFAULT_ICON_SIZE, KIND_META, KEEP } from './config.js';
import { num, dayKey } from './util.js';
import { fixAsset, fixTile } from './icons.js';
import { initFirebase, kidRef, catalogRef, profilesRef, watch, patch, txUpdate,
  getDoc, DEL, CFG } from './firebase.js';

/* ------- Firestore の形（マップ）→ 画面の形（配列） ------- */
const listOf = (o, descKey)=>{
  if(!o || typeof o !== 'object') return [];
  const a = Object.keys(o).filter(k=>o[k] && typeof o[k] === 'object')
    .map(k=>Object.assign({}, o[k], {id:k}));
  if(descKey) a.sort((x,y)=>num(y[descKey],0) - num(x[descKey],0));
  else a.sort((x,y)=> (num(x.ord,0) - num(y.ord,0)) || String(x.id).localeCompare(String(y.id)));
  return a;
};

function normKid(raw){
  const s = raw || {};
  const p = Object.assign({name:APP_NAME, level:1, exp:0, expToNext:100, money:0}, s.player || {});
  const kid = {
    id: APP_ID,
    player:{
      name: p.name || APP_NAME,
      level: Math.max(1, num(p.level,1)),
      exp: Math.max(0, num(p.exp,0)),
      expToNext: Math.max(1, num(p.expToNext,100)),
      money: Math.max(0, num(p.money,0))
    },
    message: typeof s.message === 'string' ? s.message : '',
    lastResetDate: s.lastResetDate || '',
    icons:{}, iconSize:{},
    tiles: listOf(s.tiles),
    pendings: listOf(s.pendings, 'at'),
    inventory: listOf(s.inventory),
    useRequests: listOf(s.useRequests, 'at'),
    useHistory: listOf(s.useHistory, 'usedAt'),
    gachaSeen: Object.keys(s.gachaSeen || {})
  };

  /* 既定のキー＋Firestore にある知らないキーも受けとります（将来ふえても動きます） */
  const iconKeys = new Set([...Object.keys(DEFAULT_ICONS), ...Object.keys(s.icons || {})]);
  iconKeys.forEach(k=>{
    if(k === 'character') return;                   /* 廃止した項目は使いません */
    const saved = (s.icons && typeof s.icons[k] === 'string') ? s.icons[k].trim() : '';
    const v = saved || DEFAULT_ICONS[k] || '';
    if(v) kid.icons[k] = fixAsset(v);
  });
  Object.keys(DEFAULT_ICON_SIZE).forEach(k=>{
    kid.iconSize[k] = Math.max(6, num(s.iconSize && s.iconSize[k], DEFAULT_ICON_SIZE[k]));
  });

  kid.tiles.forEach(t=>{
    if(!KIND_META[t.kind]) t.kind = 'daily';
    t.label = String(t.label || 'タイル');
    t.icon = fixAsset(t.icon || '');
    t.cardImage = fixTile(t.cardImage || '');
    t.rewardExp = num(t.rewardExp,0);
    t.rewardMoney = num(t.rewardMoney,0);
    t.completed = !!t.completed;
    t.pending   = !!t.pending;
    t.archived  = !!t.archived;
    t.pendingAt = num(t.pendingAt,0);
  });
  kid.inventory.forEach(i=>{
    i.qty = num(i.qty,1); i.icon = fixAsset(i.icon || ''); i.name = String(i.name || 'アイテム');
  });
  kid.useRequests.forEach(r=>{
    r.icon = fixAsset(r.icon || ''); r.name = String(r.name || 'アイテム');
  });
  return kid;
}

function normCatalog(raw){
  const c = raw || {};
  const shopItems = listOf(c.shopItems);
  const pool = listOf(c.gacha && c.gacha.pool);
  shopItems.forEach(x=>{
    x.name = String(x.name || '商品'); x.price = num(x.price,0);
    x.desc = String(x.desc || '');     x.icon  = fixAsset(x.icon || '');
  });
  pool.forEach(g=>{
    g.name = String(g.name || '景品'); g.rarity = String(g.rarity || 'N');
    g.weight = Math.max(0, num(g.weight,1)); g.icon = fixAsset(g.icon || '');
  });
  return { shopItems, gacha:{ cost:num(c.gacha && c.gacha.cost, 300), pool } };
}

/* ------- 画面に渡す状態 ------- */
export const state = {
  ready:false, connected:false,
  kid: normKid(null),
  catalog: normCatalog(null),
  profiles: []
};
const listeners = new Set();
export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
function emit(){ listeners.forEach(fn=>{ try{ fn(state); }catch(e){ console.error(e); } }); }
export function notify(){ emit(); }

/* ------- 接続と購読 ------- */
export async function start(){
  if(!CFG) throw new Error('config');
  await initFirebase();
  state.connected = true;

  watch(kidRef(APP_ID), snap=>{
    state.kid = normKid(snap.exists() ? snap.data() : null);
    state.ready = true;
    emit();
  }, e=>console.error(e));

  watch(catalogRef(), snap=>{
    state.catalog = normCatalog(snap.exists() ? snap.data() : null);
    emit();
  }, e=>console.error(e));

  watch(profilesRef(), snap=>{
    const rows = [];
    snap.forEach(d=>{
      const v = d.data() || {};
      rows.push({id:d.id, name:v.name || d.id, ord:num(v.ord, 99)});
    });
    rows.sort((a,b)=> a.ord - b.ord || a.id.localeCompare(b.id));
    state.profiles = rows;
    emit();
  }, e=>console.error(e));
}
export const otherProfiles = ()=> state.profiles.filter(p=>p.id !== APP_ID);

/* ------- 更新（ぜんぶ自分のドキュメントだけ） ------- */
const me = ()=> kidRef(APP_ID);
const logKey = ()=> 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
export const applyPatch = fields => patch(me(), fields);
export const todayKey = dayKey;

/* タイルの申請／取り消し */
export function setTilePending(tileId, on){
  const b = 'tiles.' + tileId + '.';
  return patch(me(), {
    [b+'pending']  : !!on,
    [b+'pendingAt']: on ? Date.now() : 0,
    [b+'archived'] : false
  });
}

/* 商品を買う */
export function buyItem(item){
  return txUpdate(me(), cur=>{
    const money = Math.max(0, num(cur.player && cur.player.money, 0));
    if(money < num(item.price,0)) throw new Error('money');
    const inv = cur.inventory || {};
    const hit = Object.keys(inv).find(k=>inv[k] && inv[k].refId === item.id);
    const key = hit || ('inv_' + item.id + '_' + Date.now());
    const qty = hit ? num(inv[hit].qty,1) + 1 : 1;
    return {
      player:{ money: money - num(item.price,0) },
      inventory:{ [key]:{ refId:item.id, icon:item.icon || '', name:item.name || 'アイテム', qty } },
      logs:{ [logKey()]:{ ts:Date.now(), text:'お店で「'+(item.name||'商品')+'」を購入' } }
    };
  });
}

/* ガチャを1回まわす（あたりの選定は shop.js 側でおわっています） */
export function payAndGetPrize(cost, prize, isMiss){
  return txUpdate(me(), cur=>{
    const money = Math.max(0, num(cur.player && cur.player.money, 0));
    if(money < num(cost,0)) throw new Error('money');
    const out = {
      player:{ money: money - num(cost,0) },
      gachaSeen:{ [prize.id]: true },
      logs:{ [logKey()]:{ ts:Date.now(), text:'ガチャ：'+(prize.name||'景品')+(isMiss?'（はずれ）':'') } }
    };
    if(!isMiss){
      const inv = cur.inventory || {};
      const hit = Object.keys(inv).find(k=>inv[k] && inv[k].refId === prize.id);
      const key = hit || ('inv_' + prize.id + '_' + Date.now());
      out.inventory = { [key]:{
        refId:prize.id, icon:prize.icon || '', name:prize.name || 'アイテム',
        qty: hit ? num(inv[hit].qty,1) + 1 : 1
      }};
    }
    return out;
  });
}

/* もちものを「つかいたい」（かんりしゃの確認まちへ） */
export function useItem(invId){
  return txUpdate(me(), cur=>{
    const inv = cur.inventory || {};
    const it  = inv[invId];
    if(!it) throw new Error('none');
    const left = num(it.qty,1) - 1;
    return {
      useRequests:{ ['use_' + Date.now().toString(36)]:{
        refId: it.refId || 'x', icon: it.icon || '', name: it.name || 'アイテム',
        at: Date.now(), state:'using'
      }},
      inventory:{ [invId]: left > 0 ? Object.assign({}, it, {qty:left}) : DEL() },
      logs:{ [logKey()]:{ ts:Date.now(), text:'「'+(it.name||'アイテム')+'」をつかいたい' } }
    };
  });
}

/* アイテムを相手にわたす（相手のドキュメントにも書きます） */
export async function sendItem(invId, toId, qty){
  const give = Math.max(1, num(qty,1));
  let moved = null;

  await txUpdate(me(), cur=>{
    const inv = cur.inventory || {};
    const it  = inv[invId];
    if(!it) throw new Error('none');
    if(num(it.qty,1) < give) throw new Error('qty');
    moved = { refId:it.refId || 'x', icon:it.icon || '', name:it.name || 'アイテム' };
    const left = num(it.qty,1) - give;
    return {
      inventory:{ [invId]: left > 0 ? Object.assign({}, it, {qty:left}) : DEL() },
      logs:{ [logKey()]:{ ts:Date.now(), text:'「'+moved.name+'」×'+give+' を '+toId+' にわたした' } }
    };
  });

  await txUpdate(kidRef(toId), cur=>{
    const inv = cur.inventory || {};
    const hit = Object.keys(inv).find(k=>inv[k] && inv[k].refId === moved.refId);
    const key = hit || ('inv_' + moved.refId + '_' + Date.now());
    return {
      inventory:{ [key]: Object.assign({}, moved, {qty:(hit ? num(inv[hit].qty,1) : 0) + give}) },
      logs:{ [logKey()]:{ ts:Date.now(), text:APP_NAME+'から「'+moved.name+'」×'+give+' がとどいた' } },
      notify:{ ['n' + Date.now().toString(36)]:{ ts:Date.now(), text:'プレゼントがとどきました！' } }
    };
  });
  return moved;
}

/* ------- 記録がふえすぎないように、古いものを消します ------- */
export async function trimHistory(){
  try{
    const snap = await getDoc(me());
    if(!snap.exists()) return;
    const d = snap.data() || {};
    const o = {};
    const cut = (mapObj, field, keep, sortKey)=>{
      const keys = Object.keys(mapObj || {});
      if(keys.length <= keep) return;
      keys.map(k=>({k, v:num((mapObj[k] || {})[sortKey], 0)}))
        .sort((a,b)=>b.v - a.v)
        .slice(keep)
        .forEach(x=>{ o[field + '.' + x.k] = DEL(); });
    };
    cut(d.useHistory, 'useHistory', KEEP.useHistory, 'usedAt');
    cut(d.logs,       'logs',       KEEP.logs,       'ts');
    if(Object.keys(o).length) await patch(me(), o);
  }catch(e){ console.error(e); }
}
