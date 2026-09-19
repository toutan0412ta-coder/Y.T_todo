/* ==========================================================
   初回起動時のパス移行（一度きり）
     ・むかしの既定ファイル名で保存されているアイコンを、
       新しい既定ファイル名に置きかえます
     ・タイルの絵を image/tile_{この子}/ に付けかえます
     ・廃止した character の設定は削除します
     ・自分で別の画像を指定していたものは、いっさい触りません
     ・kids/{ID}.pathMigratedAt を見て、二度めは走りません
   ========================================================== */
import { APP_ID, DEFAULT_ICONS, TILE_DIR } from './config.js';
import { kidRef, getDoc, patch, DEL } from './firebase.js';

/* むかしの既定ファイル名（これと一致したときだけ差し替えます） */
const OLD_DEFAULTS = {
  gacha    : 'scene_gachamachine.png',
  gachaGif : 'gatyagif.gif',            /* 比べるときは小文字にそろえます */
  navHome  : 'icon_nav_home.png',
  navStatus: 'icon_nav_status.png',
  bgRoom   : 'bg_room.png'
};

const baseName = v => String(v || '').split('?')[0].split('#')[0].split('/').pop().toLowerCase();
const isExternal = v => /^(data:|blob:|https?:|\/\/)/i.test(String(v || '').trim());
/* むかしのタイル置き場（image/tile/ と assets/tile_） */
const OLD_TILE_RE = /^(?:\.\/)?(?:image\/)?(?:assets\/tile_|tile\/)/i;

export async function runPathMigration(){
  let snap;
  try{
    snap = await getDoc(kidRef(APP_ID));
  }catch(e){ console.error(e); return false; }

  if(!snap.exists()) return false;            /* まだデータが無いので何もしません */
  const d = snap.data() || {};
  if(d.pathMigratedAt) return false;          /* もう終わっています */

  const o = {};

  /* ① アイコン：むかしの既定値とおなじものだけ、新しい既定値へ */
  const icons = d.icons || {};
  Object.keys(OLD_DEFAULTS).forEach(key=>{
    const cur = icons[key];
    if(typeof cur !== 'string' || !cur.trim()) return;
    if(isExternal(cur)) return;                              /* 外部URLは触りません */
    if(baseName(cur) !== OLD_DEFAULTS[key]) return;          /* 自分で変えた絵は触りません */
    const next = DEFAULT_ICONS[key];
    if(next && next !== cur) o['icons.' + key] = next;
  });
  /* 廃止した項目を消します */
  if(Object.prototype.hasOwnProperty.call(icons, 'character')) o['icons.character'] = DEL();

  /* ② タイルの絵：image/tile_{この子}/ に付けかえます */
  const tiles = d.tiles || {};
  Object.keys(tiles).forEach(tid=>{
    const t = tiles[tid];
    if(!t || typeof t !== 'object') return;
    const cur = typeof t.cardImage === 'string' ? t.cardImage.trim() : '';
    if(!cur || isExternal(cur)) return;
    if(cur.indexOf(TILE_DIR) === 0) return;                  /* すでに新しい場所です */
    const onlyName = cur.indexOf('/') < 0;
    if(!onlyName && !OLD_TILE_RE.test(cur)) return;          /* 自分で決めた別の場所は触りません */
    const next = TILE_DIR + cur.split('/').pop();
    if(next !== cur) o['tiles.' + tid + '.cardImage'] = next;
  });

  /* ③ 終わったしるし（該当が無くても書きます） */
  o.pathMigratedAt = Date.now();

  try{
    await patch(kidRef(APP_ID), o);
    const n = Object.keys(o).length - 1;
    if(n > 0) console.info('[migrate] 画像パスを ' + n + ' 件、新しい場所に直しました');
    return n > 0;
  }catch(e){ console.error(e); return false; }
}
