/* host shim: one chat-list row for the wired local bot */
document.addEventListener("DOMContentLoaded",()=>{
  const nav=document.getElementById("roster-list"); const ul=document.createElement("ul"); ul.id="chatlist";
  const li=document.createElement("li"); li.className="cl-row"; li.setAttribute("aria-label","DRAGON SKULL DRAGON-SKULL-1");
  li.innerHTML='<img src="./ds-icon-32.png" alt="" width="28" height="28"> DRAGON SKULL'; li.onclick=()=>li.classList.add("sel");
  ul.appendChild(li); nav.appendChild(ul);
});
