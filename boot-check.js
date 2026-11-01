/* Startup feedback and same-device-server diagnostics. No progress or personal data is sent. */
(function () {
  'use strict';
  var phase = '页面资源', started = Date.now(), finished = false, failed = false, pending = null, attempt = String(Date.now()), seq = 0, sent = [];
  function report(kind, message) {
    if (!/^https?:$/.test(location.protocol) || !/(?:^|[?&])diagnostics=1(?:&|$)/.test(location.search)) return;
    var img = new Image(); sent.push(img);
    img.src = 'boot-status.gif?attempt=' + attempt + '&n=' + (++seq) + '&event=' + kind + '&phase=' + encodeURIComponent(phase) + '&ms=' + (Date.now() - started) + '&message=' + encodeURIComponent(String(message || '').slice(0, 1000)) + (kind === 'open' ? '&browser=' + encodeURIComponent(navigator.userAgent) : '');
    img.onload = img.onerror = function () { var i = sent.indexOf(img); if (i >= 0) sent.splice(i, 1); };
  }
  function show(message) {
    var button = document.getElementById('start');
    if (!button) { pending = message; return; }
    var detail = document.getElementById('boot-detail');
    if (!detail) { detail = document.createElement('div'); detail.id = 'boot-detail'; detail.setAttribute('role', 'status'); detail.style.cssText = 'font-size:13px;line-height:1.5;color:#865854;overflow-wrap:anywhere;margin:12px 0'; button.parentNode.insertBefore(detail, button); }
    detail.textContent = '加载停在“' + phase + '”：' + message;
    var retry = document.createElement('button'); retry.type = 'button'; retry.className = 'primary'; retry.textContent = '重新加载星球'; retry.style.marginTop = '8px'; detail.appendChild(retry);
    retry.addEventListener('click', function () { var u = new URL(location.href); u.searchParams.set('reload', String(Date.now())); location.replace(u.href); });
  }
  function fail(error) {
    if (finished || failed) return; failed = true;
    var message = error && error.message ? error.message : String(error || '未知错误');
    report('error', message); show(message);
  }
  window.YayaBoot = {
    step: function (name) { if (finished || failed) return; phase = name; report('step', name); },
    fail: fail,
    ready: function () { if (finished || failed) return; finished = true; var detail = document.getElementById('boot-detail'); if (detail) detail.parentNode.removeChild(detail); report('ready', ''); }
  };
  window.addEventListener('error', function (event) {
    if (event.target && event.target.tagName === 'SCRIPT') fail('文件未载入：' + event.target.getAttribute('src'));
    else if (event.message) fail(event.message + (event.filename ? ' (' + event.filename.split('/').pop() + ':' + event.lineno + ')' : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (event) { fail(event.reason); });
  document.addEventListener('DOMContentLoaded', function () { if (pending) show(pending); });
  setTimeout(function () { if (!finished && !failed) { report('slow', 'still loading'); show('等待时间较长，可以点下面按钮重试。'); } }, 20000);
  report('open', '');
})();
