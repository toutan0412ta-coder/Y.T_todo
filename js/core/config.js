/* 設定と定数。ここだけ直せば2つのアプリ両方に効きます */

/* ファイル名から「だれの画面か」を決めます（touri_app.html → touri） */
export function detectAppId(){
  const file = decodeURIComponent((location.pathname.split('/').pop() || '').trim());
  const m = file.match(/^(.+?)_app[-_]?\d*\.html?$/i);
  return (m && m[1]) ? m[1] : 'yuika';
}
export const NAME_MAP = { yuika:'ゆいか', touri:'とうり' };
export const APP_ID   = detectAppId();
export const APP_NAME = NAME_MAP[APP_ID]
  || (()=>{ const m = APP_ID.match(/^user(\d+)$/i); return m ? ('プレイヤー'+m[1]) : APP_ID; })();

/* ▼ 画像フォルダ
   assets  … 2人共通（アイコン・商品・ガチャ景品）
   lv_◯◯  … 子ごとに別（レベル別キャラ）
   tile_◯◯… 子ごとに別（タイルの絵）                */
export const IMG      = 'image/';
export const A        = IMG + 'assets/';
export const LV_DIR   = IMG + 'lv_'   + APP_ID + '/';
export const TILE_DIR = IMG + 'tile_' + APP_ID + '/';

/* Firestore のコレクション名（かんりしゃ画面と同じ決まり） */
export const ROOT = window.LQ_ROOT || 'lifequest';
const NS = (!ROOT || ROOT === 'lifequest') ? '' : (String(ROOT).replace(/[^A-Za-z0-9_-]/g,'') + '_');
export const COL = { kids:NS+'kids', profiles:NS+'profiles', catalog:NS+'catalog' };
export const CATALOG_DOC = 'main';

/* ▼ 既定アイコン（かんりしゃ画面「見た目」タブで差し替えできます）
   navStatus だけは子ごとに別の絵です                      */
export const DEFAULT_ICONS = {
  coin         : A + 'coin.gif',
  star         : A + 'star.gif',
  gacha        : A + 'g_gachamachine.png',
  gachaGif     : A + 'g_movie.gif',
  gachaUnknown : A + 'icon_unknown.png',
  navHome      : A + 'icon_nav_main.png',
  navStatus    : A + 'icon_nav_' + APP_ID + '_status.png',
  navShop      : A + 'icon_nav_shop.png',
  bgRoom       : A + 'main_room.png'
};

/* 既定のアイコンの大きさ（CSSの --ic-◯◯ になります） */
export const DEFAULT_ICON_SIZE = {
  sm:16, lg:22, status:28, money:34, reward:14,
  tile:58, inv:26, shop:30, use:22, nav:26, gacha:110
};

/* タイルの種類 */
export const KIND_META = {
  daily  :{label:'日々', title:'☀ 日々のタイル', note:'毎日24時に達成だけリセット'},
  normal :{label:'通常', title:'◆ 通常タイル',   note:'達成すると翌日に消えます'},
  special:{label:'特別', title:'★ 特別タイル',   note:'達成すると翌日に消えます'}
};
export const KIND_ORDER = ['daily','normal','special'];

/* ガチャ演出：12秒だけ再生して止める（ループしません） */
export const GACHA_ANIM = { playMs:12000, holdMs:0 };

/* お店の商品アイコン（CSSの --ic-shop-max と同じ数字にしてください） */
export const SHOP_ICON_MAX   = 512;
export const SHOP_ICON_STACK = 120;

/* 記録のもちすぎ防止（Firestore は1ドキュメント約1MBまで） */
export const KEEP = { useHistory:100, logs:200 };

/* フッターの3ページ */
export const NAV_ITEMS = [
  {tab:'main',   icon:'navHome',   fb:'🏠', label:'メイン'},
  {tab:'status', icon:'navStatus', fb:'📊', label:'ステータス'},
  {tab:'shop',   icon:'navShop',   fb:'🏪', label:'お店'}
];
