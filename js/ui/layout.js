/* 画面のHTML雛形。touri_app.html と yuika_app.html で共通です
   （クラス名・IDは今までと同じなので、見た目は変わりません）     */
export const LAYOUT = `
<div class="app" id="app">
  <div class="app-body" id="appBody">
    <div class="topbar" id="topbar">
      <div class="pill lv-wrap">
        <div class="lv-row" id="lvRow">
          <span class="lv-label">Lv.</span><span id="lvText">1</span>
          <span class="player-name" id="playerNameText"></span>
        </div>
        <div class="lv-bar-row">
          <img class="icon-img lg" data-icon="star" data-fb="⭐" alt="EXP">
          <div class="lv-bar-bg"><div class="lv-bar-fill" id="expBar" style="width:0%"></div></div>
          <div class="lv-pct" id="expPct">0%</div>
        </div>
      </div>
      <div class="pill money-pill">
        <div class="date-row" id="dateText">----/--/--</div>
        <div class="money-row">
          <img class="icon-img xl" data-icon="coin" data-fb="🪙" alt="お金"><span id="moneyText">0</span>
        </div>
      </div>
    </div>

    <div class="screen screen-main" id="screen-main">
      <section class="msg-box" id="msgBox" hidden>
        <div class="msg-head">💬 メッセージ</div>
        <div class="msg-body" id="msgBody"></div>
      </section>
      <div id="tileSections"></div>
    </div>

    <div class="screen screen-status hidden" id="screen-status">
      <div class="status-title">★ ステータス ★</div>
      <div class="status-cards">
        <div class="status-card">
          <div class="label">レベル / けいけんち</div>
          <div class="value">
            <img class="lv-star" data-icon="star" data-fb="⭐" alt="EXP">
            <span id="statusLv">Lv. 1</span>
          </div>
          <div class="lv-bar-row">
            <div class="lv-bar-bg"><div class="lv-bar-fill" id="statusExpBar" style="width:0%"></div></div>
            <div class="lv-pct" id="statusExpPct">0%</div>
          </div>
          <div class="exp-text"><span id="statusExpText">0 / 100</span> EXP</div>
        </div>
        <div class="status-card">
          <div class="label">お金</div>
          <div class="value">
            <img class="icon-img lg" data-icon="coin" data-fb="🪙" alt="お金"><span id="statusMoney">0</span>
          </div>
          <div class="status-date" id="statusDateText">----/--/--</div>
        </div>
      </div>
      <div class="avatar-stage" id="avatarStage">
        <div class="avatar-name" id="avatarName">プレイヤー</div>
        <div class="avatar-lv" id="avatarLv">Lv.1</div>
      </div>
      <div class="inv-wrap">
        <div class="inv-title">★ もちもの ★</div>
        <div class="inv-grid" id="invGrid"></div>
        <div id="itemHelp"></div> 
        <div id="useWrap"></div>
      </div>
      <div class="trade-wrap" id="tradeWrap"></div>
      <div class="gallery-wrap" id="galleryWrap"></div>
    </div>

    <div class="screen screen-shop hidden" id="screen-shop">
      <div class="shop-header">
        <div class="shop-title">🏪 お店</div>
        <div class="shop-money">
          <img class="icon-img lg" data-icon="coin" data-fb="🪙" alt="お金"><span id="shopMoney">0</span>
        </div>
      </div>
      <div class="shop-tabs">
        <div class="shop-tab-btn active" data-shoptab="buy">商品購入</div>
        <div class="shop-tab-btn" data-shoptab="gacha">ガチャ</div>
      </div>
      <div class="shop-panel active" id="panel-buy">
        <div class="shop-section-title">✦ おすすめ商品</div>
        <div class="shared-note">※ 商品のならびは、みんなの画面で共通です</div>
        <div id="shopList"></div>
      </div>
      <div class="shop-panel" id="panel-gacha">
        <div class="gacha-box">
          <div class="gacha-stage">
            <img class="gacha-emoji" data-icon="gacha" data-fb="🎰" alt="ガチャ">
          </div>
          <div class="gacha-desc">レアなアイテムをゲット！</div>
          <div class="gacha-cost">1回
            <img class="icon-img lg" data-icon="coin" data-fb="🪙" alt="お金">
            <span id="gachaCostText">300</span>
          </div>
          <button class="gacha-btn" id="gachaBtn">ガチャを回す</button>
        </div>
        <div class="lineup-wrap" id="gachaLineup"></div>
      </div>
    </div>
  </div>

  <div class="navbar" id="navbar"></div>
</div>

<div class="toast" id="toast"></div>

<div class="gacha-anim" id="gachaAnim" aria-hidden="true">
  <img class="anim-pic" id="gachaAnimGif" alt="ガチャ演出">
  <div class="anim-cap" id="gachaAnimCap">ガチャを回しています…</div>
  <div class="anim-hint">さいごまで見てね<br>いそぐときは下の「スキップ」をおしてね</div>
  <button class="anim-skip" id="gachaSkipBtn" type="button">スキップ ▶</button>
</div>

<div class="modal-back" id="gachaModal">
  <div class="modal-box">
    <div class="big-icon" id="modalIcon">🎁</div>
    <div class="rarity" id="modalRarity">RARE</div>
    <div class="name" id="modalName">アイテム名</div>
    <button class="close-btn" id="modalClose">とじる</button>
  </div>
</div>

<div class="img-modal" id="imgModal">
  <img id="imgModalPic" alt="">
  <div class="cap" id="imgModalCap">Lv.1</div>
  <div class="hint">画面をタップでとじる</div>
</div>
`;

export function mountLayout(){
  const root = document.getElementById('appRoot');
  if(root) root.outerHTML = LAYOUT;
  else document.body.insertAdjacentHTML('beforeend', LAYOUT);
}
