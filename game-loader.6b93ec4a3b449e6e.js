/* Download feedback, bounded retry, then execute the unchanged game in order. */
(function () {
  'use strict';
  var button = document.getElementById('start');
  var scriptURL = 'game-start.93873fc0f496542f.js', expectedBytes = 2827687;
  var boot = window.YayaBoot;
  function label(text) { if (button) button.textContent = text; }
  async function download(attempt) {
    var controller = new AbortController();
    var timer;
    function activity() {
      clearTimeout(timer);
      timer = setTimeout(function () { controller.abort(); }, 45000);
    }
    activity();
    try {
      label(attempt ? '连接较慢，正在重新连接…' : '正在下载星球… 0%');
      if (boot) boot.step('下载游戏资源');
      var response = await fetch(scriptURL, {signal: controller.signal});
      if (!response.ok) throw new Error('下载未完成（' + response.status + '）');
      var blob;
      if (response.body && response.body.getReader) {
        var reader = response.body.getReader(), chunks = [], received = 0;
        while (true) {
          var result = await reader.read();
          if (result.done) break;
          activity();
          chunks.push(result.value); received += result.value.length;
          label('正在下载星球… ' + Math.min(99, Math.floor(received / expectedBytes * 100)) + '%');
        }
        blob = new Blob(chunks, {type: 'text/javascript'});
      } else {
        blob = new Blob([await response.arrayBuffer()], {type: 'text/javascript'});
      }
      clearTimeout(timer);
      label('下载完成，正在准备星球…');
      if (boot) boot.step('准备星球');
      var url = URL.createObjectURL(blob);
      var script = document.createElement('script');
      script.src = url;
      script.onload = function () { URL.revokeObjectURL(url); };
      script.onerror = function () {
        URL.revokeObjectURL(url);
        if (boot) boot.fail('游戏未能启动，请重新加载。');
      };
      document.body.appendChild(script);
    } catch (error) {
      clearTimeout(timer);
      if (!attempt) {
        await new Promise(function (resolve) { setTimeout(resolve, 1000); });
        return download(1);
      }
      label('星球暂时没有下载完成');
      if (boot) boot.fail('网络连接中断或等待过久，请点下面按钮重试。');
    }
  }
  download(0);
})();
