/* 画像パスの補正・アイコン描画・画像が無いときの代わり表示・GIFの停止 */
import { IMG, A, TILE_DIR } from './config.js';
import { esc } from './util.js';

export const brokenSrc = new Set();
let onBroken = null;                        /* 画像が壊れたときの再描画予約 */
export function setBrokenHandler(fn){ onBroken = fn; }

export function isImagePath(v){
  return typeof v === 'string' && (v.startsWith('data:') || /\.(png|jpe?g|gif|webp|svg)$/i.test(v));
}

/* 素材：ファイル名だけなら image/assets/ をつけます */
export function fixAsset(v){
  if(typeof v !== 'string') return v;
  v = v.trim();
  if(!v || v.startsWith('data:') || /^(https?:|\/\/|\/)/.test(v)) return v;
  if(!isImagePath(v)) return v;                    /* 絵文字はそのまま */
  if(/^assets\//.test(v)) return IMG + v;
  if(v.indexOf('/') < 0) return A + v;
  return v;
}

/* タイル：ファイル名だけなら image/tile_{この子}/ をつけます */
export function fixTile(v){
  if(typeof v !== 'string') return '';
  v = v.trim();
  if(!v || v.startsWith('data:') || /^(https?:|\/\/|\/)/.test(v)) return v;
  const base = v.split('/').pop();
  if(v.indexOf('/') < 0) return TILE_DIR + base;
  if(/^(?:\.\/)?(?:image\/)?(?:assets\/tile_|tile\/)/i.test(v)) return TILE_DIR + base;
  return v;
}

/* 画像が読めなかったら絵文字にさしかえます（演出GIFだけは残します） */
document.addEventListener('error', e=>{
  const el = e.target;
  if(!el || el.tagName !== 'IMG') return;
  const src = el.getAttribute('src') || '';
  if(src) brokenSrc.add(src);
  if(el.id === 'imgModalPic') return;
  if(el.id === 'gachaAnimGif') return;
  if(el.classList.contains('tile-card-img') || el.classList.contains('lv-gallery-img')){
    if(onBroken) onBroken();
    return;
  }
  const span = document.createElement('span');
  let cls = el.className || '';
  cls = /\bri\b/.test(cls) ? cls.replace(/\bri\b/,'ri-e') : (cls + ' icon-fb').trim();
  span.className = cls;
  span.textContent = el.dataset.fb || '▫️';
  if(el.dataset.icon) span.dataset.icon = el.dataset.icon;
  el.replaceWith(span);
}, true);

/* アイコン1つぶんのHTML（画像でも絵文字でもOK） */
export function renderIcon(icon, cls = 's-inv', fb = '▫️'){
  if(isImagePath(icon)){
    if(brokenSrc.has(icon)) return `<span class="ri-e ${cls}">${fb}</span>`;
    const lazy = /s-shop|s-lineup/.test(cls) ? ' loading="lazy"' : '';
    return `<img class="ri ${cls}" src="${esc(icon)}" data-fb="${esc(fb)}"${lazy} alt="">`;
  }
  return `<span class="ri-e ${cls}">${esc(icon || fb)}</span>`;
}
export function miniIcon(src, fb, cls = ''){
  if(src && !brokenSrc.has(src)) return `<img class="${cls}" src="${esc(src)}" data-fb="${fb}" alt="">`;
  return `<span class="${cls} icon-fb">${fb}</span>`;
}

/* いま出ているコマでGIFを止めます（2周目に入らないようにするため） */
export function freezeCurrentFrame(im){
  if(!im) return false;
  try{
    const w = im.naturalWidth  || im.clientWidth  || 480;
    const h = im.naturalHeight || im.clientHeight || 270;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, 0, 0, w, h);
    im.src = c.toDataURL('image/png');
    return true;
  }catch(e){
    try{ im.removeAttribute('src'); }catch(e2){}
    return false;
  }
}
