/* レベル別キャラ画像さがし
   とうり … image/lv_touri/touri_01.png …
   ゆいか … image/lv_yuika/yuika_01.png …（2桁ゼロ埋め）*/
import { APP_ID, LV_DIR } from '../core/config.js';
import { pad2 } from '../core/util.js';

let cache = Object.create(null);
export const lvPath = lv => LV_DIR + APP_ID + '_' + pad2(lv) + '.png';
export function clearProbeCache(){ cache = Object.create(null); }

export function probe(src){
  return new Promise(res=>{
    if(src in cache) return res(cache[src]);
    const im = new Image();
    im.onload  = ()=>{ cache[src] = true;  res(true); };
    im.onerror = ()=>{ cache[src] = false; res(false); };
    im.src = src;
  });
}

/* いまのレベル以下で、いちばん新しい画像を返します（無ければ空） */
export async function resolveCharImage(level){
  for(let lv = Math.max(1, level); lv >= 1; lv--){
    const p = lvPath(lv);
    if(await probe(p)) return p;
  }
  return '';
}

/* コレクション用：Lv.1 から いまのレベルまでで、実際にある画像だけ */
export async function ownedLvImages(level){
  const out = [];
  for(let lv = 1; lv <= Math.max(1, level); lv++){
    const p = lvPath(lv);
    if(await probe(p)) out.push({lv, src:p});
  }
  return out;
}
