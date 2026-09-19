/* 起動ファイル。ここで全部をつなぎます */
import { APP_NAME } from './core/config.js';
import { $, toast, debounce } from './core/util.js';
import { setBrokenHandler } from './core/icons.js';
import { state, subscribe, start, notify, trimHistory } from './core/store.js';
import { runPathMigration } from './core/migrate.js';
import { watchDay } from './core/rollover.js';
import { mountLayout } from './ui/layout.js';
import { applyLook, resetCharCache } from './ui/look.js';
import { renderTop } from './ui/topbar.js';
import { renderNav, switchTab } from './ui/nav.js';
import { renderMain } from './pages/main.js';
import { renderStatus, bindImgModal, resetGallery } from './pages/status.js';
import { renderShop, bindShop } from './pages/shop.js';

/* 演出中・入力中は描きなおしません（ガチャが止まったり、選択が消えたりしないように） */
function busy(){
  const anim  = $('gachaAnim');
  const modal = $('gachaModal');
  if(anim  && anim.classList.contains('show'))  return true;
  if(modal && modal.classList.contains('show')) return true;
  const a = document.activeElement;
  return !!a && ['INPUT','SELECT','TEXTAREA'].includes(a.tagName);
}

let waiting = false;
function renderAll(){
  if(busy()){ waiting = true; return; }
  waiting = false;
  const kid = state.kid;
  applyLook(kid);
  renderTop(kid);
  renderMain(kid);
  renderStatus(kid);
  renderShop(kid, state.catalog);
  renderNav(kid);
}
const renderSoon = debounce(renderAll, 40);

(async function boot(){
  mountLayout();
  document.title = 'せいかつクエスト｜' + APP_NAME;
  bindImgModal();
  bindShop();
  switchTab('main');
  setBrokenHandler(renderSoon);

  if(!window.LQ_FIREBASE_CONFIG || !window.LQ_FIREBASE_CONFIG.projectId){
    toast('firebase-config.js を置いてください');
    return;
  }

  subscribe(renderSoon);
  try{
    await start();                 /* kids/{ID}・catalog/main・profiles を購読 */
    await runPathMigration();      /* ★ 初回だけ、古い画像パスを新しい場所へ */
    watchDay();                    /* 日付がかわったときの処理 */
    trimHistory();                 /* 古い記録のそうじ（待ちません） */
  }catch(e){
    console.error(e);
    toast('つながりませんでした（通信か設定をかくにんしてね）');
  }

  /* あとまわしにした描きなおしを、手がはなれたら実行します */
  document.addEventListener('focusout', ()=>setTimeout(()=>{ if(waiting) renderAll(); }, 250));
  document.addEventListener('click',    ()=>{ if(waiting) setTimeout(renderAll, 50); });

  /* 画面にもどってきたら、画像もさがし直します */
  window.addEventListener('focus', ()=>notify());
  document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden){ resetGallery(); resetCharCache(); notify(); }
  });
})();
