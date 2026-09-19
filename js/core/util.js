/* 小道具（どのファイルからでも使います） */
export const $   = id => document.getElementById(id);
export const num = (v,d=0)=>{ const n = Number(v); return isNaN(n) ? d : n; };
export const pad2 = n => String(n).padStart(2,'0');
export const esc = s => String(s==null?'':s)
  .replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setText(id, v){ const el = $(id); if(el) el.textContent = v; }

const WD = ['日','月','火','水','木','金','土'];
export function dateLabel(d = new Date()){
  return d.getFullYear()+'/'+pad2(d.getMonth()+1)+'/'+pad2(d.getDate())+'（'+WD[d.getDay()]+'）';
}
export const dayKey = (d = new Date())=> d.toDateString();

/* 申請した日を「きのう」「M/D」で見せます */
export function whenLabel(ts){
  if(!ts) return '';
  const a = new Date(ts), b = new Date();
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const diff = Math.round((db - da) / 86400000);
  if(diff <= 0) return '';
  if(diff === 1) return 'きのう';
  return (a.getMonth()+1)+'/'+a.getDate();
}

export function toast(msg){
  const t = $('toast'); if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* 連続で呼ばれても1回だけ実行します */
export function debounce(fn, ms = 60){
  let t = null;
  return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

/* ★ 中身が変わっていないときは描きなおしません
   （GIFのちらつき・選択のリセット・スクロール位置のずれを防ぎます）
   もどり値が true のときだけ、イベントを付けなおしてください         */
export function section(el, key, build){
  if(!el) return false;
  if(el.dataset.key === key) return false;
  el.dataset.key = key;
  el.innerHTML = build();
  return true;
}
