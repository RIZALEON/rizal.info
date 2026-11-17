/* public-profile.js — visitor-only CryptoSocial / ASSM profile.
   No owner tools are ever written to the DOM: no ЯSYNC bar, Devices, export/import,
   wallet panels, profile edit, pin/delete, or diagnostics.
   Live comments for every visitor arrive with the ASSM server. Until then, comments
   typed here are stored in this browser only. */
(function (w) {
  "use strict";
  var CFG = w.PUBLIC_PROFILE || {};
  var WALL = String(CFG.wall || CFG.handle || "").toLowerCase();
  var LS_C = "assm.public.comments.v1";
  var LS_F = "assm.public.follow.v1";
  var MAX = 500, GAP = 20000;
  var lastAt = 0;

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function handleOf(h) { return String(h || "").toLowerCase(); }
  function isWall(h) { return handleOf(h) === WALL; }

  function loadJSON(u) {
    return fetch(u, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }
  function localComments() {
    try { return JSON.parse(localStorage.getItem(LS_C) || "[]"); } catch (e) { return []; }
  }
  function saveLocalComments(a) {
    try { localStorage.setItem(LS_C, JSON.stringify(a)); } catch (e) {}
  }
  function follows() {
    try { return JSON.parse(localStorage.getItem(LS_F) || "{}"); } catch (e) { return {}; }
  }
  function setFollow(h, on) {
    var o = follows(); o[h] = on; try { localStorage.setItem(LS_F, JSON.stringify(o)); } catch (e) {}
  }

  function postWall(p) {
    return handleOf(p.profile || p.wall || (p.t === "post" ? p.by : ""));
  }
  function onThisWall(e) {
    if (e.t === "post") return isWall(postWall(e)) || isWall(e.by);
    if (e.t === "comment") {
      var wall = e.profile || e.wall;
      if (wall) return isWall(wall);
      return false;
    }
    return false;
  }

  function when(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    if (isNaN(d)) return esc(ts);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function commentsFor(events, postId) {
    var out = [];
    events.forEach(function (e) {
      if (e.t === "comment" && (e.post === postId || e.parent === postId || e.root_id === postId)) out.push(e);
    });
    localComments().forEach(function (e) {
      if (e.post === postId || e.parent === postId) out.push(e);
    });
    out.sort(function (a, b) { return String(a.ts).localeCompare(String(b.ts)); });
    return out;
  }

  function badge(e) {
    if (e.badge) return '<span class="csp-badge">' + esc(e.badge) + "</span>";
    if (e.author_kind === "bot") return '<span class="csp-badge">' + esc((e.by || "bot") + " · bot") + "</span>";
    return "";
  }

  function commentHtml(c) {
    var local = c.deviceOnly ? '<span class="csp-local-tag">on this device only</span>' : "";
    return '<div class="csp-c' + (c.deviceOnly ? " csp-local" : "") + '"><div class="csp-dim">' +
      esc(c.by || "guest") + " " + badge(c) + local + " · " + esc(when(c.ts)) +
      "</div><div>" + esc(c.text) + "</div></div>";
  }

  function mediaHtml(p) {
    var h = "";
    if (p.cover) h += '<div class="csp-img" style="background-image:url(\'' + esc(p.cover) + "')\"></div>";
    (p.media || []).forEach(function (m) {
      if (m && m.src && (m.type === "image" || !m.type)) {
        h += '<div class="csp-img" style="background-image:url(\'' + esc(m.src) + "')\"></div>";
      }
    });
    return h;
  }

  function card(p, events, tab) {
    if (p.ptype === "video" && tab === "Posts") { /* still listed on Posts */ }
    if (tab === "Video" && p.ptype !== "video") return "";
    if (tab === "Articles" && p.ptype !== "article") return "";
    if (tab === "Projects" && p.ptype !== "project") return "";
    if (tab === "Kubo") return "";
    var pin = (p.id === "site-video-0001" || p.pinned) ? '<div><span class="csp-pinb" style="display:inline-block;font-size:11px;padding:0 6px;margin:0 0 4px;border:1px solid currentColor;border-radius:9px;opacity:.85">📌 pinned</span></div>' : "";
    var title = p.title ? "<div class=\"l\"><b>" + esc(p.title) + "</b></div>" : "";
    var threads = commentsFor(events, p.id);
    var box = '<div class="csp-cbox" data-post="' + esc(p.id) + '">' +
      '<div class="csp-hint">Live comments for every visitor will arrive with the ASSM server. Until then, a comment you write is saved on this device only.</div>' +
      '<textarea class="csp-in" maxlength="500" placeholder="Write a comment…"></textarea>' +
      '<button type="button" data-a="comment" data-post="' + esc(p.id) + '">comment</button>' +
      "</div>";
    return '<article class="csp-card" data-pid="' + esc(p.id) + '">' + pin +
      '<div class="csp-dim">' + esc(p.by || "") + " " + badge(p) + " · " + esc(when(p.ts)) + "</div>" +
      title + '<div class="w" style="white-space:pre-wrap">' + esc(p.text || "") + "</div>" +
      mediaHtml(p) +
      threads.map(commentHtml).join("") +
      box + "</article>";
  }

  function renderFeed(prof, events, tab) {
    var view = $("#csp-view");
    if (tab === "Kubo") {
      view.innerHTML = '<div class="csp-dim" style="padding:12px">Kubo lives on the live rizal.pw profile and in the RDRAGON app.</div>';
      return;
    }
    var posts = events.filter(function (e) { return e.t === "post" && onThisWall(e); });
    // Also show a post this wall commented on? No — comments appear on the author's wall.
    // For comments on this wall's posts, they're nested in cards.
    posts.sort(function (a, b) { return String(b.ts).localeCompare(String(a.ts)); });
    var html = posts.map(function (p) { return card(p, events, tab); }).filter(Boolean).join("");
    if (!html) {
      html = '<div class="csp-dim" style="padding:12px">No ' + esc(tab.toLowerCase()) + " on this profile yet.</div>";
    }
    view.innerHTML = html;
  }

  function toast(t) {
    var el = $(".csp-toast");
    if (!el) return;
    el.textContent = t;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 2400);
  }

  function addComment(postId, events, prof, tab) {
    var box = document.querySelector('.csp-cbox[data-post="' + postId + '"] textarea');
    var tx = box ? box.value.trim() : "";
    if (!tx) { toast("Type a comment first"); return; }
    if (tx.length > MAX) { toast("Comment is too long"); return; }
    var now = Date.now();
    if (now - lastAt < GAP) { toast("Please wait a moment before commenting again"); return; }
    lastAt = now;
    var ev = {
      id: "local-" + now.toString(36),
      t: "comment",
      text: tx,
      by: "guest",
      ts: new Date().toISOString(),
      parent: postId,
      post: postId,
      profile: prof.handle,
      author_kind: "user",
      signed: false,
      deviceOnly: true
    };
    var all = localComments();
    all.push(ev);
    saveLocalComments(all);
    if (box) box.value = "";
    renderFeed(prof, events, tab);
    toast("Saved on this device. Live comments arrive with the server.");
  }

  function chrome(prof) {
    var bot = prof.kind === "bot" || prof.author_kind === "bot";
    var walletBtn = (prof.wallet && !bot)
      ? '<span class="csp-b csp-bw" title="R wallet">&gt; Wallet</span>'
      : (bot ? '<span class="csp-b csp-bw csp-badge-bot" title="No wallet">KROG · bot</span>' : "");
    var verified = prof.verified !== false
      ? '<span class="csp-b csp-bv">✔ Verified</span>'
      : "";
    var followOn = !!follows()[prof.handle];
    var loc = prof.location ? '<div>location · ' + esc(prof.location) + "</div>" : "";
    var link = prof.link ? '<div>link · <a href="' + esc(prof.link) + '">' + esc(prof.link) + "</a></div>" : "";
    var joined = prof.joined ? '<div>joined · ' + esc(when(prof.joined)) + "</div>" : "";
    var other = bot
      ? '<a href="https://rizal.pw/">@chaserizal</a>'
      : '<a href="/krog/">@krog</a>';
    return '<div id="csp-panel" class="csp-visitor">' +
      '<div class="csp-top">' + esc(prof.title || "Anti Social Social Media") + "</div>" +
      '<div class="csp-banner" style="background-image:url(\'' + esc(prof.banner || "/assm/profile/assets/banner.jpg") + "')\">" +
        '<img class="csp-gm" src="' + esc(prof.logo || "/assm/profile/assets/ghostmachine-logo.jpg") + '" alt="GHOSTMACHINE">' +
        verified + walletBtn +
      "</div>" +
      '<div class="csp-av" style="background-image:url(\'' + esc(prof.avatar) + "')\"></div>" +
      '<div class="csp-name">' + esc(prof.name) + (bot ? ' <span class="csp-badge">' + esc(prof.badge || "KROG · bot") + "</span>" : "") + "</div>" +
      '<div class="csp-handle">' + esc(prof.handle) + (prof.rid ? " · " + esc(prof.rid) : "") + "</div>" +
      '<div class="csp-bm"><div>' + esc(prof.bio || "") +
        '<div class="csp-links"></div></div></div>' +
      '<div class="csp-metarow"><div class="csp-meta">' + loc + link + joined + "</div>" +
        '<div class="csp-pbtns">' +
          '<button class="csp-pill csp-msgbtn" type="button" data-a="msg">✉ Message</button>' +
          '<button class="csp-pill csp-follow' + (followOn ? " on" : "") + '" type="button" data-a="follow">' +
            (followOn ? "✓ Following" : "+ Follow") + "</button>" +
        "</div></div></div>" +
      '<div class="csp-ff"><span><b>0</b> Following</span> · <span><b>0</b> Followers</span></div>' +
      '<div class="csp-public-links">Public profiles · ' + other + ' · <a href="/krog/">@krog</a> · <a href="/assm/">ASSM</a> · <a href="/assm/feed.json">feed</a></div>' +
      '<div class="csp-tabs">' +
        ["Posts","Video","Articles","Projects","Kubo"].map(function (t, i) {
          return '<span data-a="tab" data-t="' + t + '"' + (i === 0 ? ' class="on"' : "") + ">" + t + "</span>";
        }).join("") +
      "</div>" +
      '<div class="csp-notice">Reading is open to everyone. Anyone can leave a comment. Live comments and replies from RDRAGON and KROG, visible to every visitor, will arrive with the ASSM server. Until then, comments you write stay on this device.</div>' +
      '<div id="csp-view" class="csp-view"></div>' +
      '<div id="csp-msgbox" class="csp-cbox" style="display:none">' +
        '<div class="csp-hint">Messages are saved on this device until the server is live.</div>' +
        '<textarea class="csp-in" id="csp-msg" maxlength="500" placeholder="Message ' + esc(prof.handle) + '…"></textarea>' +
        '<button type="button" data-a="sendmsg">send</button>' +
      "</div>" +
      '<div class="csp-ready"><b>R:\\SOCIAL&gt;</b><br>READY.</div>' +
      '<div class="csp-toast" id="csp-toast" style="display:none"></div>' +
      "</div>";
  }

  function bind(prof, events, state) {
    document.body.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-a]");
      if (!t) return;
      var a = t.getAttribute("data-a");
      if (a === "tab") {
        state.tab = t.getAttribute("data-t");
        document.querySelectorAll(".csp-tabs [data-a=tab]").forEach(function (x) {
          x.classList.toggle("on", x === t);
        });
        renderFeed(prof, events, state.tab);
      } else if (a === "follow") {
        var on = !follows()[prof.handle];
        setFollow(prof.handle, on);
        t.classList.toggle("on", on);
        t.textContent = on ? "✓ Following" : "+ Follow";
        toast(on ? "Following " + prof.handle + " on this device" : "Unfollowed " + prof.handle);
      } else if (a === "msg") {
        var box = $("#csp-msgbox");
        box.style.display = box.style.display === "none" ? "block" : "none";
      } else if (a === "sendmsg") {
        var v = ($("#csp-msg") || {}).value || "";
        v = v.trim();
        if (!v) { toast("Type a message first"); return; }
        $("#csp-msg").value = "";
        toast("Saved on this device. Delivery arrives with the server.");
      } else if (a === "comment") {
        addComment(t.getAttribute("data-post"), events, prof, state.tab);
      }
    });
  }

  function start() {
    document.body.classList.add("csp-public");
    var state = { tab: "Posts" };
    Promise.all([
      loadJSON(CFG.profileUrl || "data/profile.json"),
      loadJSON(CFG.feedUrl || "/assm/feed.json").catch(function () { return { events: [] }; })
    ]).then(function (pair) {
      var prof = pair[0], feed = pair[1] || {};
      var events = feed.events || [];
      document.title = (prof.name || prof.handle) + " · Anti Social Social Media";
      var mount = $("#mount") || document.body;
      if ($("#mount")) mount.innerHTML = chrome(prof);
      else {
        var wrap = document.createElement("div");
        wrap.id = "mount";
        wrap.innerHTML = chrome(prof);
        document.body.insertBefore(wrap, document.body.firstChild);
      }
      bind(prof, events, state);
      renderFeed(prof, events, state.tab);
    }).catch(function (e) {
      document.body.innerHTML = '<p style="color:#39ff14;font:14px monospace;padding:24px">Could not load this profile.</p>';
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window);
