(function () {
  "use strict";
  var STAGE_TITLES = {
    "1": "Этап 1. Основы: файлы, текст, права, пользователи",
    "2": "Этап 2. Процессы, systemd, журналы, планировщики, пакеты",
    "3": "Этап 3. Диски, ФС, LVM, RAID, swap, архивы и бэкапы",
    "4": "Этап 4. Сеть, SSH, firewall",
    "5": "Этап 5. Мониторинг, безопасность, контейнеры, сборник связок"
  };
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function code(s) { return el("code", null, s); }
  // inline markdown: `code` and **bold**
  function rich(s) {
    var frag = document.createDocumentFragment();
    var re = /`([^`]+)`|\*\*([^*]+)\*\*/g, last = 0, m;
    s = String(s);
    while ((m = re.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      frag.appendChild(m[1] != null ? code(m[1]) : el("strong", null, m[2]));
      last = re.lastIndex;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    return frag;
  }
  function stageOf(c) { return c.title.split(".")[0]; }
  function cmdText(c) {
    return [c.n, c.t, c.d, c.s || "", c.w || "", c.note || ""].concat(c.f.map(function (r) { return r.join(" "); }), c.e.map(function (r) { return r.join(" "); })).join(" ").toLowerCase();
  }
  function comboText(c) {
    return [c.t, c.c, c.w || ""].concat(c.s.map(function (r) { return r.join(" "); })).join(" ").toLowerCase();
  }
  CATS.forEach(function (c) {
    c.cmds.forEach(function (m) { m._t = cmdText(m); });
    c.combos.forEach(function (m) { m._t = comboText(m); });
  });
  var TOTAL_CMDS = CATS.reduce(function (a, c) { return a + c.cmds.length; }, 0);
  var TOTAL_COMBOS = CATS.reduce(function (a, c) { return a + c.combos.length; }, 0);

  function table(cols, rows, codeFirst) {
    var w = el("div", "tbl"), t = el("table"), th = el("thead"), tr = el("tr");
    cols.forEach(function (c) { tr.appendChild(el("th", null, c)); });
    th.appendChild(tr); t.appendChild(th);
    var tb = el("tbody");
    rows.forEach(function (r) {
      var row = el("tr");
      r.forEach(function (cell, i) {
        var td = el("td");
        if (codeFirst && i === 0) td.appendChild(code(cell)); else td.appendChild(rich(cell));
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb); w.appendChild(t);
    return w;
  }

  function renderCmd(m, open) {
    var d = el("details", "card cmd");
    if (open) d.open = true;
    var s = el("summary");
    s.appendChild(code(m.n));
    s.appendChild(el("span", "t", "— " + m.t));
    if (m.w) s.appendChild(el("span", "badge", "Опасно"));
    d.appendChild(s);
    var b = el("div", "card-body");
    var p = el("p"); p.appendChild(rich(m.d)); b.appendChild(p);
    if (m.s) {
      var dl = el("dl", "props");
      dl.appendChild(el("dt", null, "Синтаксис"));
      var dd = el("dd"); dd.appendChild(code(m.s)); dl.appendChild(dd);
      b.appendChild(dl);
    }
    if (m.w) {
      var r = el("div", "risk"); r.appendChild(el("span", "badge", "Опасно"));
      r.appendChild(document.createTextNode(" ")); r.appendChild(rich(m.w)); b.appendChild(r);
    }
    if (m.note) { var n = el("p"); n.appendChild(document.createTextNode("Примечание: ")); n.appendChild(rich(m.note)); b.appendChild(n); }
    if (m.f.length) b.appendChild(table(["Флаг или форма", "Что делает"], m.f, true));
    if (m.e.length) b.appendChild(table(["Пример", "Пояснение"], m.e, true));
    d.appendChild(b);
    return d;
  }

  function renderCombos(cat, combos, open) {
    var d = el("details", "card combos");
    if (open) d.open = true;
    var s = el("summary");
    s.appendChild(document.createTextNode("Полезные связки: " + cat.title.replace(/^[0-9.]+ /, "")));
    s.appendChild(el("span", "t", "(" + combos.length + ")"));
    d.appendChild(s);
    var b = el("div", "card-body");
    combos.forEach(function (m, i) {
      var box = el("div", "combo combo-item");
      var t = el("p", "ct", (i + 1) + ". " + m.t);
      if (m.w) { t.appendChild(document.createTextNode(" ")); t.appendChild(el("span", "badge", "Опасно")); }
      box.appendChild(t);
      if (m.w) { var w = el("div", "risk"); w.appendChild(document.createTextNode("Осторожно: ")); w.appendChild(rich(m.w)); box.appendChild(w); }
      var c = el("p", "cc"); c.appendChild(code(m.c)); box.appendChild(c);
      var ol = el("ol", "steps");
      m.s.forEach(function (r) {
        var li = el("li"); li.appendChild(code(r[0]));
        li.appendChild(document.createTextNode(" — "));
        var sd = el("span", "sd"); sd.appendChild(rich(r[1])); li.appendChild(sd);
        ol.appendChild(li);
      });
      box.appendChild(ol);
      b.appendChild(box);
    });
    d.appendChild(b);
    return d;
  }

  // static parts
  $("summary").textContent = "Команды, флаги и готовые связки с пояснениями, сверенные с man-страницами и документацией дистрибутивов и проверенные на Debian 13. Все пять этапов готовы: " + TOTAL_CMDS + " команд и конструкций, " + TOTAL_COMBOS + " связок в " + CATS.length + " разделах.";
  STAGES.forEach(function (s) {
    var li = el("li", null, s.text);
    if (s.meta) li.appendChild(el("span", "meta", "(" + s.meta + ")"));
    $("stages").appendChild(li);
  });
  SOURCES.forEach(function (u) {
    var li = el("li"), a = el("a", null, u); a.href = u; a.rel = "noopener"; a.target = "_blank";
    li.appendChild(a); $("srcList").appendChild(li);
  });
  var sel = $("cat");
  var o = el("option", null, "Все разделы"); o.value = "all"; sel.appendChild(o);
  CATS.forEach(function (c) { var op = el("option", null, c.title); op.value = c.id; sel.appendChild(op); });

  function tocItem(label, id, depth) {
    var li = el("li", "d" + depth), a = el("a", null, label); a.href = "#" + id; li.appendChild(a); return li;
  }
  var toc = $("tocList");
  toc.appendChild(tocItem("План этапов", "plan", 0));
  toc.appendChild(tocItem("Поиск и фильтр", "filter", 0));
  Object.keys(STAGE_TITLES).forEach(function (k) {
    toc.appendChild(tocItem(STAGE_TITLES[k], "stage" + k, 0));
    CATS.filter(function (c) { return stageOf(c) === k; }).forEach(function (c) { toc.appendChild(tocItem(c.title, c.id, 1)); });
  });
  toc.appendChild(tocItem("Источники", "sources", 0));
  toc.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!document.getElementById(id) && (sel.value !== "all" || $("q").value || $("danger").checked)) { resetFilters(); }
  });

  function render() {
    var ql = $("q").value.trim().toLowerCase(), cat = sel.value, dz = $("danger").checked;
    var active = ql.length > 0 || cat !== "all" || dz;
    var out = $("content"); out.textContent = "";
    var fc = 0, fb = 0, lastStage = null;
    CATS.forEach(function (c) {
      if (cat !== "all" && c.id !== cat) return;
      var cmds = c.cmds.filter(function (m) { return (!dz || !!m.w) && (ql === "" || m._t.indexOf(ql) >= 0); });
      var combos = c.combos.filter(function (m) { return (!dz || !!m.w) && (ql === "" || m._t.indexOf(ql) >= 0); });
      if (cmds.length + combos.length === 0) return;
      fc += cmds.length; fb += combos.length;
      var st = stageOf(c);
      if (st !== lastStage) { var h = el("h2", "stage-h", STAGE_TITLES[st] || ("Этап " + st)); h.id = "stage" + st; out.appendChild(h); lastStage = st; }
      var sec = el("section", "block cat"); sec.id = c.id;
      sec.appendChild(el("h2", null, c.title));
      var ip = el("p", "intro"); ip.appendChild(rich(c.intro)); sec.appendChild(ip);
      if (c.cmp) {
        var d = el("details", "card cmp"), s = el("summary", null, c.cmp.title);
        d.appendChild(s); var b = el("div", "card-body"); b.appendChild(table(c.cmp.cols, c.cmp.rows, false)); d.appendChild(b);
        sec.appendChild(d);
      }
      cmds.forEach(function (m) { sec.appendChild(renderCmd(m, active)); });
      if (combos.length) sec.appendChild(renderCombos(c, combos, active));
      out.appendChild(sec);
    });
    $("status").textContent = active
      ? (fc + fb > 0 ? "Найдено: команд и конструкций — " + fc + ", связок — " + fb + ". Найденные карточки раскрыты."
                     : "По этому запросу ничего не найдено, попробуйте другое слово или сбросьте фильтр раздела.")
      : "Всего " + TOTAL_CMDS + " команд и " + TOTAL_COMBOS + " связок. Каждая команда свёрнута в карточку: нажмите на заголовок, чтобы раскрыть флаги и примеры. В примерах подразумевается запуск от root или через sudo там, где это нужно.";
  }
  function resetFilters() { $("q").value = ""; sel.value = "all"; $("danger").checked = false; render(); }
  var timer;
  $("q").addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 150); });
  sel.addEventListener("change", render);
  $("danger").addEventListener("change", render);
  $("reset").addEventListener("click", resetFilters);
  function setAll(open) { document.querySelectorAll("#content details").forEach(function (d) { d.open = open; }); }
  $("expand").addEventListener("click", function () { setAll(true); });
  $("collapse").addEventListener("click", function () { setAll(false); });

  // theme
  var modes = ["auto", "light", "dark"], names = { auto: "авто", light: "светлая", dark: "тёмная" };
  var mode = "auto";
  try { mode = localStorage.getItem("theme") || "auto"; } catch (e) {}
  function applyTheme() {
    if (mode === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", mode);
    $("theme").textContent = "Тема: " + names[mode];
  }
  $("theme").addEventListener("click", function () {
    mode = modes[(modes.indexOf(mode) + 1) % 3];
    try { localStorage.setItem("theme", mode); } catch (e) {}
    applyTheme();
  });
  applyTheme();
  render();
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
})();
