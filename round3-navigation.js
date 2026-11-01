/* Spherical walking routes. All distances are surface metres, not angles.
   Obstacle disks include the explorer's footprint, so neither short cuts nor
   clicks inside a pond can put the character through its collision boundary. */
(() => {
  function create({ THREE: T, obstacles, SURF, playerRadius = .24 }) {
    const V = T.Vector3, clamp = x => Math.max(-1, Math.min(1, x));
    const clearance = playerRadius + .035;
    let disks = [], originals = [], graph = null, revision = 0;
    let last = { found: true, length: 0, waypoints: 0, elapsedMs: 0 };
    const distance = (a, b) => Math.acos(clamp(a.dot(b))) * SURF;
    function refresh() {
      const source = obstacles.filter(o => o.r > 0 && o.enabled !== false);
      const changed = source.length !== originals.length || source.some((o, i) => {
        const p = originals[i];
        return !p || p.ref !== o || p.r !== o.r || p.x !== o.dir.x || p.y !== o.dir.y || p.z !== o.dir.z;
      });
      if (!changed) return;
      originals = source.map(o => ({ ref: o, r: o.r, x: o.dir.x, y: o.dir.y, z: o.dir.z }));
      disks = source.map(o => ({ dir: o.dir.clone().normalize(), r: o.r + clearance, cos: Math.cos((o.r + clearance) / SURF) }));
      graph = null; revision++;
    }
    function safe(p, tolerance = 0) {
      return disks.every(d => p.dot(d.dir) <= d.cos + tolerance);
    }
    function basis(p, preferred) {
      const axis = preferred ? preferred.clone() : new V(Math.abs(p.y) < .85 ? 0 : 1, Math.abs(p.y) < .85 ? 1 : 0, 0);
      axis.addScaledVector(p, -axis.dot(p));
      if (axis.lengthSq() < 1e-12) return basis(p);
      return axis.normalize();
    }
    function move(p, heading, metres) {
      const a = metres / SURF;
      return p.clone().multiplyScalar(Math.cos(a)).addScaledVector(heading, Math.sin(a)).normalize();
    }
    function intermediate(a, b, amount) {
      const angle = Math.acos(clamp(a.dot(b)));
      if (angle < 1e-8) return a.clone();
      return move(a, basis(a, b), angle * SURF * amount);
    }
    // The maximum dot product with the obstacle centre on the minor arc gives
    // its exact closest approach. This avoids sampling gaps on large ponds.
    function clear(a, b) {
      const cosine = clamp(a.dot(b)), theta = Math.acos(cosine);
      if (theta < 1e-8) return safe(a, 1e-10);
      if (theta > Math.PI - .001) {
        const mid = move(a, basis(a, b), Math.PI * SURF / 2);
        return clear(a, mid) && clear(mid, b);
      }
      const sine = Math.sin(theta), forward = b.clone().addScaledVector(a, -cosine).multiplyScalar(1 / sine);
      for (const d of disks) {
        const x = d.dir.dot(a), y = d.dir.dot(forward);
        let nearest = Math.max(x, d.dir.dot(b));
        if (y >= 0 && y * cosine <= x * sine) nearest = Math.max(nearest, Math.hypot(x, y));
        if (nearest > d.cos + 1e-10) return false;
      }
      return true;
    }
    function constrained(input, preferred) {
      const p = input.clone().normalize();
      if (safe(p)) return p;
      // Project outside every containing disk; repeated passes handle overlap.
      for (let pass = 0; pass < 24; pass++) {
        let touched = false;
        for (const d of disks) {
          if (p.dot(d.dir) <= d.cos) continue;
          const outward = p.clone().addScaledVector(d.dir, -p.dot(d.dir));
          if (outward.lengthSq() < 1e-12) outward.copy(basis(d.dir, preferred));
          p.copy(move(d.dir, outward.normalize(), d.r + .015));
          touched = true;
        }
        if (!touched || safe(p, 1e-10)) return p;
      }
      // Overlapping disks can make alternating projections converge slowly.
      // A deterministic expanding search supplies an exterior destination.
      const e = basis(input, preferred), n = new V().crossVectors(input, e).normalize();
      for (let radius = .35; radius < Math.PI * SURF; radius += .35) {
        for (let j = 0; j < 32; j++) {
          const angle = j * Math.PI / 16, h = e.clone().multiplyScalar(Math.cos(angle)).addScaledVector(n, Math.sin(angle));
          const q = move(input, h, radius);
          if (safe(q)) return q;
        }
      }
      return p;
    }
    function makeGraph() {
      if (graph) return graph;
      const points = [], ringEdges = [], add = p => { if (!safe(p)) return -1; points.push(p); return points.length - 1; };
      // A coarse global mesh connects the far side of the planet. Fine obstacle
      // rings let the character smoothly round corners without a dense grid.
      const count = 420, golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - 2 * (i + .5) / count, radial = Math.sqrt(1 - y * y);
        add(new V(Math.cos(i * golden) * radial, y, Math.sin(i * golden) * radial));
      }
      for (const d of disks) {
        const e = basis(d.dir), n = new V().crossVectors(d.dir, e).normalize(), ring = [];
        // Ring chords stay outside the disk even for wide building footprints.
        const radius = (d.r + .085) / Math.cos(Math.PI / 16);
        for (let j = 0; j < 16; j++) {
          const a = j * Math.PI / 8;
          ring.push(add(move(d.dir, e.clone().multiplyScalar(Math.cos(a)).addScaledVector(n, Math.sin(a)), radius)));
        }
        for (let j = 0; j < 16; j++) if (ring[j] >= 0 && ring[(j + 1) % 16] >= 0) ringEdges.push([ring[j], ring[(j + 1) % 16]]);
      }
      const links = points.map(() => []), edgeKeys = new Set();
      function link(i, j) {
        const key = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (edgeKeys.has(key)) return;
        edgeKeys.add(key);
        if (clear(points[i], points[j])) {
          const cost = distance(points[i], points[j]);
          links[i].push([j, cost]); links[j].push([i, cost]);
        }
      }
      ringEdges.forEach(([i, j]) => link(i, j));
      for (let i = 0; i < points.length; i++) {
        const near = [];
        for (let j = 0; j < points.length; j++) {
          if (j === i) continue;
          const dot = points[i].dot(points[j]);
          // A 7.8 metre edge can bridge sparse patches without connecting every
          // obstacle to the far side of the world.
          if (dot > Math.cos(7.8 / SURF)) near.push([j, dot]);
        }
        near.sort((a, b) => b[1] - a[1]);
        near.slice(0, 20).forEach(([j]) => link(i, j));
      }
      graph = { points, links };
      return graph;
    }
    function plan(start, target, stop = 0) {
      const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
      const began = now(); refresh();
      const origin = constrained(start), desired = target.clone().normalize();
      const targetDistance = distance(origin, desired);
      let endpoint = targetDistance <= stop ? origin.clone() : intermediate(desired, origin, Math.min(1, Math.max(0, stop) / Math.max(targetDistance, .001)));
      endpoint = constrained(endpoint, basis(endpoint, origin));
      let route = [], found = true;
      if (distance(origin, endpoint) < .015) route = [];
      else if (clear(origin, endpoint)) route = [endpoint];
      else {
        const base = makeGraph(), points = [origin, endpoint, ...base.points], links = [[], [], ...base.links.map(list => list.map(([i, cost]) => [i + 2, cost]))];
        for (const endpointIndex of [0, 1]) {
          const nearest = base.points.map((p, i) => [i + 2, distance(points[endpointIndex], p)]).sort((a, b) => a[1] - b[1]);
          let connected = 0;
          for (const [i, cost] of nearest) {
            if (clear(points[endpointIndex], points[i])) {
              links[endpointIndex].push([i, cost]); links[i].push([endpointIndex, cost]);
              if (++connected >= 30) break;
            }
          }
        }
        const costs = new Float64Array(points.length).fill(Infinity), estimates = new Float64Array(points.length).fill(Infinity), previous = new Int32Array(points.length).fill(-1), closed = new Uint8Array(points.length);
        costs[0] = 0; estimates[0] = distance(origin, endpoint);
        const open = new Set([0]); let arrived = false;
        while (open.size) {
          let current = -1, best = Infinity;
          for (const i of open) if (estimates[i] < best) { current = i; best = estimates[i]; }
          if (current === 1) { arrived = true; break; }
          open.delete(current); closed[current] = 1;
          for (const [next, edge] of links[current]) {
            if (closed[next]) continue;
            const cost = costs[current] + edge;
            if (cost >= costs[next]) continue;
            previous[next] = current; costs[next] = cost; estimates[next] = cost + distance(points[next], endpoint); open.add(next);
          }
        }
        if (arrived) {
          let i = 1;
          while (i > 0) { route.unshift(points[i].clone()); i = previous[i]; }
          // Visibility pruning eliminates grid zigzags while retaining clearance.
          const smooth = []; let anchor = origin, cursor = 0;
          while (cursor < route.length) {
            let next = route.length - 1;
            while (next > cursor && !clear(anchor, route[next])) next--;
            smooth.push(route[next]); anchor = route[next]; cursor = next + 1;
          }
          route = smooth;
        } else {
          // Never fall back to a straight line through solid geometry.
          route = []; found = false;
        }
      }
      // Opposite directions have no unique tangent. Expose an explicit
      // midpoint so the caller's ordinary moveAlong() never receives one.
      const traversable = []; let previous = origin;
      for (const p of route) {
        if (previous.dot(p) < -.9999995) traversable.push(intermediate(previous, p, .5));
        traversable.push(p); previous = p;
      }
      route = traversable;
      let from = origin, length = 0;
      route.forEach(p => { length += distance(from, p); from = p; });
      last = { found, length, waypoints: route.length, elapsedMs: now() - began, endpoint: endpoint.toArray(), revision };
      return route;
    }
    return {
      plan,
      constrain(dir, preferred) { refresh(); return constrained(dir.clone().normalize(), preferred); },
      isClear(a, b) { refresh(); return clear(a.clone().normalize(), b.clone().normalize()); },
      isSafe(dir) { refresh(); return safe(dir.clone().normalize(), 1e-10); },
      snapshot: () => ({ ...last, obstacles: disks.length, graphNodes: graph ? graph.points.length : 0, playerRadius }),
    };
  }
  window.YayaNavigation = { create };
})();
