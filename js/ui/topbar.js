/* 上のバー（レベル・けいけんち・日付・お金） */
import { $, setText, dateLabel } from '../core/util.js';

let lastLevel = null;

export function renderTop(kid){
  const p = kid.player;
  setText('lvText', p.level);
  setText('playerNameText', p.name);
  setText('dateText', dateLabel());
  setText('moneyText', p.money.toLocaleString());

  const pct = Math.min(100, Math.round(p.exp / p.expToNext * 100));
  const bar = $('expBar'); if(bar) bar.style.width = pct + '%';
  setText('expPct', pct + '%');

  /* レベルが上がったらピョコンとさせます */
  if(lastLevel !== null && p.level > lastLevel){
    const row = $('lvRow');
    if(row){ row.classList.remove('lv-pop'); void row.offsetWidth; row.classList.add('lv-pop'); }
  }
  lastLevel = p.level;
}
