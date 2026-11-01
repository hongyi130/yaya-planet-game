/* Approved v2 art details. This module draws presentation only; game state stays in app.js. */
(function (global) {
  "use strict";

  const PALETTE = { cream: "#fffdf5", berry: "#765782", mint: "#91c696", salmon: "#eda088", honey: "#ffe48c" };
  const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

  function roundedRect(g, x, y, width, height, radius) {
    g.beginPath();
    g.moveTo(x + radius, y);
    g.arcTo(x + width, y, x + width, y + height, radius);
    g.arcTo(x + width, y + height, x, y + height, radius);
    g.arcTo(x, y + height, x, y, radius);
    g.arcTo(x, y, x + width, y, radius);
    g.closePath();
  }

  function polygon(g, points, fill) {
    g.beginPath();
    points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  }

  function cube(g, x, y, colors) {
    g.save();
    g.translate(x, y);
    g.shadowColor = "rgba(111, 86, 115, .14)";
    g.shadowBlur = 4;
    g.shadowOffsetY = 3;
    polygon(g, [[0, -24], [26, -14], [24, 17], [0, 28], [-24, 17], [-26, -14]], colors[1]);
    g.shadowColor = "transparent";
    polygon(g, [[0, -24], [26, -14], [0, -3], [-26, -14]], colors[0]);
    polygon(g, [[-26, -14], [0, -3], [0, 28], [-24, 17]], colors[1]);
    polygon(g, [[0, -3], [26, -14], [24, 17], [0, 28]], colors[2]);
    g.lineWidth = 3;
    g.strokeStyle = "rgba(255, 255, 238, .7)";
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-17, -14);
    g.lineTo(-3, -19);
    g.stroke();
    g.fillStyle = "rgba(255, 255, 239, .65)";
    roundedRect(g, -17, -3, 7, 11, 2);
    g.fill();
    g.restore();
  }

  function fitText(g, text, x, y, maxWidth, startSize, weight) {
    let size = startSize;
    do {
      g.font = `${weight} ${size}px ${FONT}`;
      if (g.measureText(text).width <= maxWidth) break;
      size -= 1;
    } while (size > 24);
    g.fillText(text, x, y);
  }

  /** Return a transparent 512×256 plaque texture. Pass the existing main/note strings. */
  function createAltarLabel(THREE, main, note, options = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const g = canvas.getContext("2d");

    g.shadowColor = "rgba(99, 68, 104, .20)";
    g.shadowBlur = 10;
    g.shadowOffsetY = 8;
    roundedRect(g, 22, 21, 468, 212, 62);
    g.fillStyle = "#d5c6c8";
    g.fill();
    g.shadowColor = "transparent";

    const face = g.createLinearGradient(0, 14, 0, 220);
    face.addColorStop(0, "#fffef9");
    face.addColorStop(1, "#f6efe5");
    roundedRect(g, 22, 13, 468, 211, 62);
    g.fillStyle = face;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = "#fffef8";
    g.stroke();

    const word = options.word !== undefined ? String(options.word) : (/^[?？a-z\s]+$/i.test(String(main || "")) && /[a-z]/i.test(String(main || "")) ? String(main) : "");
    const label = String(options.label || note || (/^[\u3400-\u9fff\s]+$/.test(String(main || "")) ? main : "拼一拼"));
    g.textAlign = "center";
    g.textBaseline = "middle";

    if (word) {
      g.fillStyle = PALETTE.berry;
      fitText(g, word, 256, 91, 354, 61, 900);
    } else {
      cube(g, 149, 86, ["#b9dda0", "#8dc886", "#71ad7b"]);
      cube(g, 361, 86, ["#ffc2a1", "#eea18b", "#d77d76"]);
      g.strokeStyle = "#9874a4";
      g.lineWidth = 9;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.beginPath();
      g.moveTo(204, 77);
      g.quadraticCurveTo(253, 43, 305, 67);
      g.stroke();
      g.beginPath();
      g.moveTo(295, 49);
      g.lineTo(308, 69);
      g.lineTo(285, 73);
      g.stroke();
    }

    g.fillStyle = options.color || PALETTE.berry;
    fitText(g, label, 256, 171, 408, label.length <= 4 ? 57 : 39, 800);

    const texture = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace !== undefined && "colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding !== undefined) texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = Math.max(1, Math.min(8, Number(options.anisotropy) || 1));
    texture.needsUpdate = true;
    texture.name = "yaya-art-altar-plaque";
    return texture;
  }

  let pathEl = null;
  let dots = [];
  let arrow = null;
  let lastPath = "";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function ensureHintPath() {
    if (pathEl) return;
    pathEl = document.createElementNS(SVG_NS, "svg");
    pathEl.id = "art-hint-path";
    pathEl.setAttribute("aria-hidden", "true");
    pathEl.setAttribute("focusable", "false");
    pathEl.hidden = true;
    pathEl.style.display = "none";
    for (let i = 0; i < 6; i++) {
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("class", "art-hint-dot");
      dot.setAttribute("r", i === 0 ? "3.2" : "3.6");
      pathEl.appendChild(dot);
      dots.push(dot);
    }
    arrow = document.createElementNS(SVG_NS, "path");
    arrow.setAttribute("class", "art-hint-arrow");
    arrow.setAttribute("d", "M-7-6 0 0-7 6M-12 0H0");
    pathEl.appendChild(arrow);
    document.body.appendChild(pathEl);
  }

  /** Points are projected block centers in viewport CSS pixels, in reading order. */
  function updateHintPath(points, active, options = {}) {
    const valid = Array.isArray(points) && points.length >= 2 && points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!active || !valid) {
      if (pathEl) { pathEl.hidden = true; pathEl.style.display = "none"; }
      lastPath = "";
      return;
    }
    ensureHintPath();
    const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : -26;
    const width = global.innerWidth;
    const height = global.innerHeight;
    const signature = `${width},${height},${offsetY},${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(";")}`;
    pathEl.hidden = false;
    pathEl.style.display = "block";
    if (signature === lastPath) return;
    lastPath = signature;
    pathEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const segments = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
    const total = segments.reduce((sum, length) => sum + length, 0);
    if (total < 20) { pathEl.hidden = true; pathEl.style.display = "none"; lastPath = ""; return; }
    function at(t) {
      let distance = t * total;
      let i = 0;
      while (i < segments.length - 1 && distance > segments[i]) distance -= segments[i++];
      const k = segments[i] ? distance / segments[i] : 0;
      return { x: points[i].x + (points[i + 1].x - points[i].x) * k,
        y: points[i].y + (points[i + 1].y - points[i].y) * k + offsetY - 7 * Math.sin(Math.PI * t) };
    }
    dots.forEach((dot, i) => {
      const p = at(.18 + i * .12);
      dot.setAttribute("cx", p.x.toFixed(1));
      dot.setAttribute("cy", p.y.toFixed(1));
    });
    const end = at(.98);
    const before = at(.9);
    const angle = Math.atan2(end.y - before.y, end.x - before.x) * 180 / Math.PI;
    arrow.setAttribute("transform", `translate(${end.x.toFixed(1)} ${end.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
  }

  global.YayaArtUI = Object.assign(global.YayaArtUI || {}, { createAltarLabel, updateHintPath });
})(window);
