/* rsocial-widget.js v1 20261104 - Message/Follow pills (rizal.pw profile style) for sites without the RDRAGON sidebar. Uses window.RSOCIAL (rsocial-rmail.js v2). No keys. */
(function(){var H=window.RSOCIAL_HANDLE||"@chaserizal";
function css(){var s=document.createElement("style");s.textContent=".rsw{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;font:13px monospace}"+
".rsw .csp-row{display:flex;gap:8px}.csp-pill{border-radius:999px;padding:7px 16px;font:bold 13px monospace;cursor:pointer;min-width:104px;letter-spacing:.5px;border:1px solid #c9a227;background:#0b0b0b;color:#f2d16b}"+
".csp-pill.on{background:#c9a227;color:#0b0b0b}.rsw-box{display:none;background:#0b0b0b;border:1px solid #c9a227;border-radius:12px;padding:10px;width:260px;color:#eee}.rsw-box.open{display:block}"+
".rsw-box textarea{width:100%;box-sizing:border-box;height:70px;background:#111;color:#eee;border:1px solid #444;border-radius:8px;font:13px monospace}.rsw-t{color:#f2d16b;margin:6px 0 0}";document.head.appendChild(s)}
function ui(){css();var w=document.createElement("div");w.className="rsw";
w.innerHTML='<div class="rsw-box"><div class="csp-dmto">dm '+H+'</div><textarea id="csp-msg" placeholder="Message via RMAIL"></textarea><div class="csp-row"><button class="csp-pill" data-a="sendmsg">Send</button></div><div class="rsw-t"></div></div>'+
'<div class="csp-row"><button class="csp-pill csp-msgbtn">✉ Message</button><button class="csp-pill csp-follow">Follow</button></div>';
document.body.appendChild(w);var box=w.querySelector(".rsw-box"),fb=w.querySelector(".csp-follow"),t=w.querySelector(".rsw-t");
function sync(){var on=window.RSOCIAL&&RSOCIAL.follows()[H];fb.classList.toggle("on",!!on);fb.textContent=on?"Following":"Follow"}
w.querySelector(".csp-msgbtn").onclick=function(){box.classList.toggle("open")};
fb.onclick=function(){if(window.RSOCIAL){RSOCIAL.follow(H);sync()}};
w.querySelector('[data-a="sendmsg"]').addEventListener("click",function(){setTimeout(function(){t.textContent="✉ RMAIL: queued";document.getElementById("csp-msg").value=""},50)});
var n=0,iv=setInterval(function(){if(window.RSOCIAL||++n>40){clearInterval(iv);sync()}},250)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ui);else ui()})();
