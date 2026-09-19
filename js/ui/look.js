/* アイコンの大きさ・背景画像をCSS変数に流しこみます
   ★ レベル画像が1枚も無いときは、キャラ枠は単色背景だけになります */
import { DEFAULT_ICON_SIZE } from '../core/config.js';
import { num } from '../core/util.js';
import { brokenSrc } from '../core/icons.js';
import { resolveCharImage } from './levelart.js';

let charLv = -1;

/* CSS変数の url() は「css/app.css の場所」を基準に読まれてしまうので、
   ここで HTML の場所を基準にした絶対URLへ直してから渡します        */
function toUrl(src){
  if(!src) return 'none';
  try{
    return `url('${new URL(src, document.baseURI).href}')`;
  }catch(e){
    return `url('${src}')`;
  }
}

export function applyLook(kid){
  const rs = document.documentElement.style;

  Object.keys(DEFAULT_ICON_SIZE).forEach(k=>{
    rs.setProperty('--ic-' + k, Math.max(6, num(kid.iconSize[k], DEFAULT_ICON_SIZE[k])) + 'px');
  });

  const room = kid.icons.bgRoom;
  rs.setProperty('--bg-room', (room && !brokenSrc.has(room)) ? toUrl(room) : 'none');

  /* 雛形に置いたアイコン（コイン・星・ガチャ絵）に src を入れます */
  document.querySelectorAll('img[data-icon]').forEach(im=>{
    const src = kid.icons[im.dataset.icon];
    if(src && !brokenSrc.has(src) && im.getAttribute('src') !== src) im.src = src;
  });

  /* キャラ画像はレベルが変わったときだけ探しなおします */
  if(charLv !== kid.player.level){
    charLv = kid.player.level;
    resolveCharImage(charLv).then(src=>{
      rs.setProperty('--bg-character', src ? toUrl(src) : 'none');
    });
  }
}
export function resetCharCache(){ charLv = -1; }
