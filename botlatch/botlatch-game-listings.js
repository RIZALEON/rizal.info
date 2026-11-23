/* rizal.info · BOTLATCH · TERAFORMR game listings panel (add-only, 20261122, Rizal 5:14 PM MT). ONE script for
 * /botlatch/, /botlatch/exchange/, /botlatch/contracts/, /botlatch/tracker/. View-only: live-reads
 *   https://rizal.pw/rtrackr/data/rgamechain-listings.json  (+ rgamechain.json for the chain tip)
 * written by RMINT's rtrackr_publish.py game on every game block. no-store + cache-busting query, polled every 10 s.
 * No keys, no trades, no writes, textContent only. Buying stays ЯCASKET-gated elsewhere. */
(function(){
'use strict';
var D='https://rizal.pw/rtrackr/data/',LIST=D+'rgamechain-listings.json',CHAIN=D+'rgamechain.json',VIEW='https://rizal.pw/rtrackr/#game',POLL=10000,box=null;
function el(t,x,css){var e=document.createElement(t);if(x!=null)e.textContent=String(x);if(css)e.style.cssText=css;return e}
function link(x,href){var a=el('a',x,'color:#b388ff');a.href=href;a.target='_blank';a.rel='noopener';return a}
function mt(ts){try{return new Date(ts).toLocaleString('en-US',{timeZone:'America/Denver',dateStyle:'medium',timeStyle:'short'})+' MT'}catch(e){return String(ts||'')}}
function get(u){return fetch(u+'?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
function mount(){box=el('section',null,'border:1px solid #39ff14;margin:12px auto;padding:10px;max-width:960px;font:12px Menlo,monospace;color:#39ff14;background:#000;text-align:left');box.id='bl-game';
  var ref=document.querySelector('h1')||document.querySelector('nav');if(ref&&ref.parentNode)ref.parentNode.insertBefore(box,ref.nextSibling);else (document.querySelector('main')||document.body).appendChild(box)}
function draw(j,c){if(!box)mount();box.textContent='';box.appendChild(el('b','Я BOTLATCH · TERAFORMR GAME LISTINGS','letter-spacing:.15em'));
  var h=el('div',null,'opacity:.8;margin:4px 0 8px');h.appendChild(document.createTextNode((j?(j.chain_id||'')+' · height '+j.height+' · updated '+mt(j.generated):'listings feed unavailable')+' · '));
  h.appendChild(link('game chain',VIEW));h.appendChild(document.createTextNode(' · '));h.appendChild(link('rgamechain.json',CHAIN));h.appendChild(document.createTextNode(' · '));h.appendChild(link('listings.json',LIST));box.appendChild(h);
  if(!j)return;var L=(j.open||[]).slice().reverse();if(!L.length)box.appendChild(el('div','no open listings','opacity:.7'));
  L.forEach(function(l){var it=l.item||{},r=el('div',null,'border-top:1px solid #1d5f12;padding:6px 0');
    r.appendChild(el('div',(it.name||it.id||'?')+' · '+(l.qty||1)+'× · '+l.price_rtoken+' '+(l.currency||'RToken'),'font-weight:bold'));
    r.appendChild(el('div',(it.rarity||'')+(it.stats?' · atk '+it.stats.atk+' / hp '+it.stats.hp:'')+' · seller '+(l.seller||'?')+' · '+(l.status||'open'),'opacity:.85'));
    r.appendChild(link('game block #'+l.game_block+' · '+String(l.game_hash||'').slice(0,12)+'… · '+mt(l.ts),VIEW));box.appendChild(r)});
  var s=j.sold||[];if(s.length)box.appendChild(el('div',s.length+' sold','opacity:.7;margin-top:6px'));
  if(c&&c.tip&&j.tip&&c.tip!==j.tip)box.appendChild(el('div','chain tip '+String(c.tip).slice(0,12)+'… (listings catching up)','opacity:.7'))}
function load(){Promise.all([get(LIST),get(CHAIN)]).then(function(r){draw(r[0],r[1])})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
setInterval(function(){if(!document.hidden)load()},POLL);
})();
