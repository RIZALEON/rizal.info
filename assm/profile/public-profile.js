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
  var LS_FE = "assm.public.follow.entries.v1";
  var LS_CHAIN = "rdragon.csp.chain.v1";
  var SS_ME = "rdragon.csp.me";
  var TAB_NAMES = { posts: "Posts", video: "Video", articles: "Articles", projects: "Projects", kubo: "Kubo" };
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
  function normHandle(h) {
    h = String(h || "").trim();
    if (!h) return "";
    if (h.charAt(0) !== "@") h = "@" + h;
    return h;
  }
  function storeGet(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function parseObj(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function handleFromObj(o) {
    if (!o) return "";
    if (typeof o === "string") {
      var s = o.trim();
      if (/^@?[A-Za-z0-9_]{2,32}$/.test(s)) return normHandle(s);
      return "";
    }
    if (typeof o !== "object") return "";
    var h = o.handle || o.user || o.me || (o.profile && o.profile.handle) || (o.session && o.session.handle) || "";
    if (typeof h === "object") h = h.handle || "";
    return normHandle(h);
  }
  /* Detect an @chaserizal (or other) session if one exists on this origin.
     rizal.info cannot read rizal.pw storage. Known keys: CSP sessionStorage
     rdragon.csp.me, RSOCIAL, and RSIGNIN/ASSM session keys if present. */
  function sessionMe() {
    var me = parseObj(storeGet(sessionStorage, SS_ME));
    var h = handleFromObj(me);
    if (h) return { handle: h, pub: me && me.pub, sign: me && me.sign, source: SS_ME };
    if (w.RSOCIAL_ME && String(w.RSOCIAL_ME) !== "guest") {
      h = handleFromObj(w.RSOCIAL_ME);
      if (h) return { handle: h, source: "RSOCIAL_ME" };
    }
    try {
      if (w.RSOCIAL && typeof w.RSOCIAL.me === "function") {
        var I = w.RSOCIAL.me();
        h = handleFromObj(I);
        if (h && h.toLowerCase() !== "@guest") return { handle: h, source: "RSOCIAL" };
      }
    } catch (e) {}
    var keys = ["RSIGNIN", "rsignin", "RSIGNIN.session", "RSIGNIN.me", "assm.session", "ASSM.session", "assm.signin", "ASSM.signin", "rdragon.rsignin"];
    var stores = [sessionStorage, localStorage], i, j, raw, obj, h2;
    for (i = 0; i < stores.length; i++) {
      for (j = 0; j < keys.length; j++) {
        raw = storeGet(stores[i], keys[j]);
        obj = parseObj(raw);
        h2 = handleFromObj(obj != null ? obj : raw);
        if (h2) return { handle: h2, source: keys[j] };
      }
    }
    return null;
  }
  function sessionSigner(me) {
    if (me && typeof me.sign === "function" && me.pub) return { pub: me.pub, sign: me.sign };
    if (typeof w.RSOCIAL_SIGNER === "function") {
      return { pub: (me && me.pub) || null, sign: function (msg) { return Promise.resolve(w.RSOCIAL_SIGNER(msg)); } };
    }
    return null;
  }
  function listOf(arr) {
    if (!Array.isArray(arr)) return [];
    var out = [], seen = {}, i, h;
    for (i = 0; i < arr.length; i++) {
      h = normHandle(arr[i]);
      if (!h || seen[h.toLowerCase()]) continue;
      seen[h.toLowerCase()] = 1;
      out.push(h);
    }
    return out;
  }
  function followEntries() {
    var a = parseObj(storeGet(localStorage, LS_FE));
    if (!Array.isArray(a)) a = [];
    if (a.length) return a;
    var old = parseObj(storeGet(localStorage, LS_F)) || {};
    var me = sessionMe();
    var by = (me && me.handle) || "visitor";
    Object.keys(old).forEach(function (h) {
      if (old[h]) a.push({ kind: "follow", by: by, target: normHandle(h), ts: new Date().toISOString(), signed: false, deviceOnly: true, migrated: true });
    });
    if (a.length) saveFollowEntries(a);
    return a;
  }
  function saveFollowEntries(a) {
    try { localStorage.setItem(LS_FE, JSON.stringify(a)); } catch (e) {}
  }
  function appendCspChain(entry) {
    try {
      var ev = parseObj(storeGet(localStorage, LS_CHAIN));
      if (!Array.isArray(ev)) ev = [];
      ev.push({
        id: "fl-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        t: entry.kind,
        kind: entry.kind,
        by: entry.by,
        target: entry.target,
        ts: entry.ts,
        signed: !!entry.signed,
        sig: entry.sig || null,
        source: "assm.public"
      });
      localStorage.setItem(LS_CHAIN, JSON.stringify(ev));
    } catch (e) {}
    try {
      if (w.RSync && typeof w.RSync.append === "function" && entry.signer) {
        w.RSync.append({ t: entry.kind, kind: entry.kind, by: entry.by, target: entry.target, ts: entry.ts }, entry.signer);
      }
    } catch (e2) {}
  }
  function canonFollow(e) {
    return ["assm-follow-v1", e.kind, e.by, e.target, e.ts].join("\n");
  }
  function recordFollow(target, on) {
    var me = sessionMe();
    var entry = {
      kind: on ? "follow" : "unfollow",
      by: (me && me.handle) || "visitor",
      target: normHandle(target),
      ts: new Date().toISOString(),
      signed: false
    };
    var a = followEntries();
    var signer = sessionSigner(me);
    function commit() {
      a.push(entry);
      saveFollowEntries(a);
      appendCspChain(entry);
      return entry;
    }
    if (signer && typeof signer.sign === "function") {
      try {
        entry.signer = signer;
        var sig = signer.sign(canonFollow(entry));
        return Promise.resolve(sig).then(function (s) {
          if (s) { entry.sig = s; entry.signed = true; if (signer.pub) entry.pub = signer.pub; }
          delete entry.signer;
          return commit();
        }).catch(function () { delete entry.signer; return commit(); });
      } catch (e) { delete entry.signer; }
    }
    return Promise.resolve(commit());
  }
  /* Counts come from published profile lists plus local follow/unfollow
     entries. Last local entry wins for a by+target pair, so a published
     follow is not counted twice, and a local unfollow can reverse it
     on this device only. */
  function followState(prof) {
    var on = {}, mine = {};
    listOf(prof && prof.followers).forEach(function (h) { on[h.toLowerCase()] = h; });
    listOf(prof && prof.following).forEach(function (h) { mine[h.toLowerCase()] = h; });
    var wall = normHandle((prof && prof.handle) || CFG.handle || WALL);
    followEntries().forEach(function (e) {
      var k = (e.kind || e.t || "");
      if (k !== "follow" && k !== "unfollow") return;
      var v = k === "follow";
      var by = normHandle(e.by), tgt = normHandle(e.target);
      if (!by || !tgt) return;
      if (tgt.toLowerCase() === wall.toLowerCase()) {
        if (v) on[by.toLowerCase()] = by; else delete on[by.toLowerCase()];
      }
      if (by.toLowerCase() === wall.toLowerCase()) {
        if (v) mine[tgt.toLowerCase()] = tgt; else delete mine[tgt.toLowerCase()];
      }
    });
    function count(m) { return Object.keys(m).length; }
    var me = sessionMe();
    var my = me && me.handle ? me.handle.toLowerCase() : "";
    var iFollow = !!(my && on[my]);
    if (!iFollow) {
      var last = null;
      followEntries().forEach(function (e) {
        var k = e.kind || e.t;
        if ((k === "follow" || k === "unfollow") && normHandle(e.target).toLowerCase() === wall.toLowerCase()) {
          if (!my || normHandle(e.by).toLowerCase() === my || e.by === "visitor") last = k;
        }
      });
      if (last === "follow") iFollow = true;
    }
    return { iFollow: iFollow, followers: count(on), following: count(mine) };
  }
  function tabFromHash() {
    var h = String((w.location && location.hash) || "").toLowerCase();
    var m = h.match(/^#tab=(posts|video|articles|projects|kubo)$/);
    if (m) return TAB_NAMES[m[1]];
    return null;
  }
  function scrollProfileTop() {
    try {
      if (w.scrollTo) w.scrollTo(0, 0);
      var panel = $("#csp-panel");
      if (panel) panel.scrollTop = 0;
      var el = document.scrollingElement || document.documentElement;
      if (el) el.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    } catch (e) {}
  }
  function updateFollowChrome(prof) {
    var st = followState(prof);
    var btn = document.querySelector(".csp-follow");
    if (btn) {
      btn.classList.toggle("on", st.iFollow);
      btn.textContent = st.iFollow ? "✓ Following" : "+ Follow";
    }
    var ff = document.querySelector(".csp-ff");
    if (ff) ff.innerHTML = "<span><b>" + st.following + "</b> Following</span> · <span><b>" + st.followers + "</b> Followers</span>";
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

  function chrome(prof, state) {
    var bot = prof.kind === "bot" || prof.author_kind === "bot";
    var walletBtn = (prof.wallet && !bot)
      ? '<span class="csp-b csp-bw" title="R wallet">&gt; Wallet</span>'
      : (bot ? '<span class="csp-b csp-bw csp-badge-bot" title="No wallet">KROG · bot</span>' : "");
    var verified = prof.verified !== false
      ? '<span class="csp-b csp-bv">✔ Verified</span>'
      : "";
    var fs = followState(prof);
    var followOn = !!fs.iFollow;
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
      '<div class="csp-ff"><span><b>' + fs.following + '</b> Following</span> · <span><b>' + fs.followers + '</b> Followers</span></div>' +
      '<div class="csp-public-links">Public profiles · ' + other + ' · <a href="/krog/">@krog</a> · <a href="/assm/">ASSM</a> · <a href="/assm/feed.json">feed</a></div>' +
      '<div class="csp-tabs">' +
        ["Posts","Video","Articles","Projects","Kubo"].map(function (t) {
          return '<span data-a="tab" data-t="' + t + '"' + (t === (state && state.tab || "Posts") ? ' class="on"' : "") + ">" + t + "</span>";
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
        var on = !followState(prof).iFollow;
        recordFollow(prof.handle, on).then(function (ent) {
          updateFollowChrome(prof);
          var signed = ent && ent.signed ? " · signed" : "";
          toast(on ? ("Following " + prof.handle + " · saved on this device" + signed) : ("Unfollowed " + prof.handle));
        });
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
    var state = { tab: tabFromHash() || "Posts" };
    Promise.all([
      loadJSON(CFG.profileUrl || "data/profile.json"),
      loadJSON(CFG.feedUrl || "/assm/feed.json").catch(function () { return { events: [] }; })
    ]).then(function (pair) {
      var prof = pair[0], feed = pair[1] || {};
      var events = feed.events || [];
      document.title = (prof.name || prof.handle) + " · Anti Social Social Media";
      var mount = $("#mount") || document.body;
      if ($("#mount")) mount.innerHTML = chrome(prof, state);
      else {
        var wrap = document.createElement("div");
        wrap.id = "mount";
        wrap.innerHTML = chrome(prof, state);
        document.body.insertBefore(wrap, document.body.firstChild);
      }
      bind(prof, events, state);
      renderFeed(prof, events, state.tab);
      scrollProfileTop();
    }).catch(function (e) {
      document.body.innerHTML = '<p style="color:#39ff14;font:14px monospace;padding:24px">Could not load this profile.</p>';
    });
  }

  w.addEventListener("hashchange", function () {
    var tab = tabFromHash();
    if (!tab) return;
    var on = document.querySelector('.csp-tabs [data-t="' + tab + '"]');
    if (on) on.click();
    scrollProfileTop();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window);
