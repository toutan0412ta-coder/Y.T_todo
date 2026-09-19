/* 日付が変わったときの処理
   ・日々タイル … 達成だけリセット（名前・画像・ごほうびはそのまま）
   ・通常／特別 … 達成ずみは翌日にかくれる
   ・申請中     … けっして消さず「くりこし申請（pendings）」へ移します
                  （かんりしゃ画面と同じ pd_タイルID なので二重になりません）*/
import { state, applyPatch, todayKey } from './store.js';
import { num } from './util.js';

let running = false;

export async function checkRollover(){
  if(running || !state.ready) return;
  const today = todayKey();

  if(!state.kid.lastResetDate){                 /* はじめての起動 */
    running = true;
    try{ await applyPatch({ lastResetDate: today }); } finally { running = false; }
    return;
  }
  if(state.kid.lastResetDate === today) return;

  running = true;
  const o = { lastResetDate: today };
  try{
    state.kid.tiles.forEach(t=>{
      if(t.pending && !t.completed){
        o['pendings.pd_' + t.id] = {
          tileId:t.id, label:t.label, kind:t.kind,
          icon:t.icon || '', cardImage:t.cardImage || '',
          rewardExp:num(t.rewardExp,0), rewardMoney:num(t.rewardMoney,0),
          at: t.pendingAt || Date.now(), date: state.kid.lastResetDate
        };
        o['tiles.' + t.id + '.pending']   = false;
        o['tiles.' + t.id + '.pendingAt'] = 0;
        o['tiles.' + t.id + '.archived']  = false;
      }
      if(t.kind === 'daily'){
        if(t.completed) o['tiles.' + t.id + '.completed'] = false;
      }else if(t.completed && !t.pending){
        o['tiles.' + t.id + '.archived'] = true;
      }
    });
    await applyPatch(o);
  }catch(e){ console.error(e); }
  finally{ running = false; }
}

/* 1分ごとに日付を見はります */
export function watchDay(){
  checkRollover();
  setInterval(checkRollover, 60000);
  window.addEventListener('focus', checkRollover);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checkRollover(); });
}
