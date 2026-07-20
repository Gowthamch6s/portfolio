import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from 'framer-motion';

// Blocky Minecraft-style avatar: cube head with brown fringe peeking out of a
// green creeper hoodie, pixel-shaded torso with a creeper-face patch, blocky
// green sleeves ending in skin-tone cube hands, pixel pants + sneakers.
// - Head + eyes track the cursor with springs (same rig as every character before).
// - Both arms are responsive: they rise together as the cursor moves up, with a
//   gentle idle sway layered on top.
// - Legs AND arms march in a real opposite-phase walk cycle whenever
//   `walking` is true (driven by the floating companion while it's gliding
//   to a new section) — right arm swings forward with the left leg and vice
//   versa, like an actual gait, instead of freezing at whatever the cursor
//   last put them at. Everything settles back to a neutral standing pose
//   the moment it stops.
// - `lookY` (-1 look up, 1 look down, null = follow the cursor as usual) lets
//   the companion glance toward the section it just arrived at instead of
//   wherever the mouse happens to be.
// - `greeting` (true at the hero) raises just the right arm into a waving
//   hello, overriding its cursor-tracked/walk pose until it clears; the left
//   arm keeps doing whatever it was already doing.
// - Click him → excited jump: both arms punch straight up "raise the roof" style,
//   eyes go wide, mouth grins wider, then everything settles back.
export default function Character({ walking = false, lookY = null, greeting = false } = {}) {
  const wrapRef = useRef(null);
  const [excited, setExcited] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const armBoost = useMotionValue(0); // 0 → resting · 1 → arms punched up
  const jumpY = useMotionValue(0);
  const leftLegRotate = useMotionValue(0);
  const rightLegRotate = useMotionValue(0);
  const leftArmWalk = useMotionValue(0); // walk-cycle swing, paired with the right leg
  const rightArmWalk = useMotionValue(0); // walk-cycle swing, paired with the left leg
  const walkLevel = useMotionValue(0); // 0 normal arm pose · 1 fully in the walk swing
  const greetLevel = useMotionValue(0); // 0 normal arm pose · 1 fully waving
  const waveWiggle = useMotionValue(0); // oscillates while waving

  const headSpring = { stiffness: 120, damping: 14, mass: 0.6 };
  const armSpring = { stiffness: 90, damping: 12, mass: 0.7 };
  const eyeSpring = { stiffness: 300, damping: 20, mass: 0.3 };

  const sx = useSpring(mx, headSpring);
  const sy = useSpring(my, headSpring);
  const ax = useSpring(mx, armSpring);
  const ay = useSpring(my, armSpring);
  const ex = useSpring(mx, eyeSpring);
  const ey = useSpring(my, eyeSpring);

  const headRotate = useTransform(sx, [-1, 1], [-10, 10]);
  const headX = useTransform(sx, [-1, 1], [-12, 12]);
  const headY = useTransform(sy, [-1, 1], [-7, 8]);
  const pupilX = useTransform(ex, [-1, 1], [-6, 6]);
  const pupilY = useTransform(ey, [-1, 1], [-4, 4]);
  const bodyRotate = useTransform(ax, [-1, 1], [-2.5, 2.5]);

  // Rest pose: both arms track the cursor, plus a small outward lean from
  // cursor X so it doesn't feel perfectly symmetric; click flings both
  // straight up in a victory pose. `walkLevel` blends this over to a real
  // walking arm swing (see the walk-cycle effect below) while `walking` is
  // true, and `greetLevel` blends the RIGHT arm only over to a raised,
  // oscillating wave on top of that — the left arm just keeps doing
  // whatever its rest/walk pose already was, so only one hand waves.
  // The arm rects hang straight down from their shoulder pivot at rotate=0,
  // so a rotation near ±95° swings them in-and-across the chest (crossed
  // arms) rather than up — a raised "hand in the air" wave needs an angle
  // near ±170°, which points the arm up and slightly outward instead.
  const leftArmRotate = useTransform(
    [ay, ax, armBoost, walkLevel, leftArmWalk],
    ([y, x, b, wl, aw]) => {
      const normal = -(y * 24) - x * 6 - b * 90;
      return normal * (1 - wl) + aw * wl;
    }
  );
  const rightArmRotate = useTransform(
    [ay, ax, armBoost, walkLevel, rightArmWalk, greetLevel, waveWiggle],
    ([y, x, b, wl, aw, g, w]) => {
      const normal = y * 24 - x * 6 + b * 90;
      const rest = normal * (1 - wl) + aw * wl;
      const wave = -170 - w * 15;
      return rest * (1 - g) + wave * g;
    }
  );

  // Wave hello: just the right arm lifts into the raised pose and oscillates
  // while `greeting` is true, then blends back to whatever it was doing.
  useEffect(() => {
    let wiggleControls;
    if (greeting) {
      animate(greetLevel, 1, { type: 'spring', stiffness: 120, damping: 14 });
      wiggleControls = animate(waveWiggle, [0, 1, 0, -1, 0], {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    } else {
      animate(greetLevel, 0, { type: 'spring', stiffness: 120, damping: 14 });
    }
    return () => wiggleControls && wiggleControls.stop();
  }, [greeting, greetLevel, waveWiggle]);

  // Walk cycle: legs swing opposite-phase, and each arm swings in sync with
  // the OPPOSITE leg (right arm forward with left leg forward, like an
  // actual gait) rather than sitting frozen near the belly, while `walking`
  // is true — everything springs back to a neutral standing pose the moment
  // it stops.
  useEffect(() => {
    let controls;
    if (walking) {
      controls = [
        animate(leftLegRotate, [0, 26, 0, -26, 0], { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }),
        animate(rightLegRotate, [0, -26, 0, 26, 0], { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }),
        animate(rightArmWalk, [0, 24, 0, -24, 0], { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }),
        animate(leftArmWalk, [0, -24, 0, 24, 0], { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }),
        animate(walkLevel, 1, { type: 'spring', stiffness: 200, damping: 20 }),
      ];
    } else {
      controls = [
        animate(leftLegRotate, 0, { type: 'spring', stiffness: 220, damping: 18 }),
        animate(rightLegRotate, 0, { type: 'spring', stiffness: 220, damping: 18 }),
        animate(walkLevel, 0, { type: 'spring', stiffness: 200, damping: 20 }),
      ];
    }
    return () => controls.forEach((c) => c.stop());
  }, [walking, leftLegRotate, rightLegRotate, leftArmWalk, rightArmWalk, walkLevel]);

  // Glance toward the section just scrolled to. This only nudges `my` once
  // when `lookY` changes — the existing pointermove listener below keeps
  // working underneath it, so a real mouse move immediately takes back over.
  useEffect(() => {
    if (lookY == null) return undefined;
    const controls = animate(my, lookY, { type: 'spring', stiffness: 90, damping: 14 });
    return () => controls.stop();
  }, [lookY, my]);

  useEffect(() => {
    const onMove = (e) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.3;
      mx.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.4))));
      my.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.45))));
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [mx, my]);

  const powerMove = () => {
    if (excited) return;
    setExcited(true);
    animate(armBoost, 1, { type: 'spring', stiffness: 260, damping: 11 });
    animate(jumpY, [0, -40, 0, -14, 0], { duration: 0.85, ease: 'easeOut' });
    setTimeout(() => {
      animate(armBoost, 0, { type: 'spring', stiffness: 120, damping: 14 });
      setExcited(false);
    }, 1000);
  };

  // A sparse scatter of slightly darker/lighter squares over a base rect —
  // cheap way to fake Minecraft's per-pixel shading without hand-authoring
  // hundreds of individual rects.
  const pixelNoise = (x, y, w, h, cell, colors, seed = 1) => {
    const cols = Math.floor(w / cell);
    const rows = Math.floor(h / cell);
    const rects = [];
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() < 0.4) {
          rects.push(
            <rect
              key={`${seed}-${r}-${c}`}
              x={x + c * cell}
              y={y + r * cell}
              width={cell}
              height={cell}
              fill={colors[Math.floor(rand() * colors.length)]}
              opacity={0.5}
            />
          );
        }
      }
    }
    return rects;
  };

  return (
    <motion.div
      ref={wrapRef}
      className="select-none cursor-pointer"
      onPointerDown={powerMove}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      title="click me!"
    >
      <motion.div style={{ y: jumpY }}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            viewBox="0 0 480 640"
            className="w-[300px] sm:w-[360px] lg:w-[420px] h-auto drop-shadow-[0_0_45px_var(--accent-glow)]"
            role="img"
            aria-label="Blocky Minecraft-style avatar of Gowtham wearing a green creeper hoodie"
            shapeRendering="crispEdges"
          >
            {/* ground shadow */}
            <ellipse cx="240" cy="618" rx="112" ry="14" fill="rgba(0,0,0,0.3)" />

            {/* ============ BODY ============ */}
            <motion.g
              style={{
                rotate: bodyRotate,
                transformBox: 'view-box',
                originX: '240px',
                originY: '470px',
              }}
            >
              {/* ---- LEFT LEG (walk-cycle pivot at the hip) ---- */}
              <motion.g
                style={{
                  rotate: leftLegRotate,
                  transformBox: 'view-box',
                  originX: '207px',
                  originY: '472px',
                }}
              >
                <rect x="184" y="470" width="46" height="110" fill="#3fae44" />
                {pixelNoise(184, 470, 46, 110, 10, ['#2f8f38', '#59c25c'], 11)}
                <rect x="184" y="470" width="46" height="110" fill="none" stroke="#1f2023" strokeWidth="4" />
                <rect x="178" y="572" width="58" height="26" fill="#181818" stroke="#000" strokeWidth="4" />
                <rect x="178" y="590" width="58" height="10" fill="#f4f2ec" stroke="#000" strokeWidth="3" />
              </motion.g>

              {/* ---- RIGHT LEG (walk-cycle pivot at the hip) ---- */}
              <motion.g
                style={{
                  rotate: rightLegRotate,
                  transformBox: 'view-box',
                  originX: '273px',
                  originY: '472px',
                }}
              >
                <rect x="250" y="470" width="46" height="110" fill="#3fae44" />
                {pixelNoise(250, 470, 46, 110, 10, ['#2f8f38', '#59c25c'], 22)}
                <rect x="250" y="470" width="46" height="110" fill="none" stroke="#1f2023" strokeWidth="4" />
                <rect x="244" y="572" width="58" height="26" fill="#181818" stroke="#000" strokeWidth="4" />
                <rect x="244" y="590" width="58" height="10" fill="#f4f2ec" stroke="#000" strokeWidth="3" />
              </motion.g>

              {/* torso — hoodie */}
              <rect x="164" y="330" width="152" height="150" fill="#3fae44" stroke="#1f2023" strokeWidth="5" />
              {pixelNoise(164, 330, 152, 150, 12, ['#2f8f38', '#59c25c', '#7ed67f'], 33)}
              <rect x="164" y="330" width="152" height="150" fill="none" stroke="#1f2023" strokeWidth="5" />

              {/* creeper-face patch, centered on the chest */}
              <rect x="200" y="360" width="80" height="80" fill="#5bc25f" stroke="#1f2023" strokeWidth="4" />
              <rect x="212" y="374" width="16" height="16" fill="#151515" />
              <rect x="252" y="374" width="16" height="16" fill="#151515" />
              <rect x="228" y="396" width="24" height="16" fill="#151515" />
              <rect x="216" y="404" width="12" height="16" fill="#151515" />
              <rect x="252" y="404" width="12" height="16" fill="#151515" />

              {/* hood strings */}
              <line x1="216" y1="336" x2="212" y2="378" stroke="#151515" strokeWidth="4" />
              <line x1="264" y1="336" x2="268" y2="378" stroke="#151515" strokeWidth="4" />
              <circle cx="212" cy="380" r="5" fill="#151515" />
              <circle cx="268" cy="380" r="5" fill="#151515" />

              {/* ---- LEFT ARM (viewer-left, responsive) ---- */}
              <motion.g
                style={{
                  rotate: leftArmRotate,
                  transformBox: 'view-box',
                  originX: '178px',
                  originY: '346px',
                }}
              >
                <motion.g
                  animate={{ rotate: [0, -3, 0, 2, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformBox: 'view-box', originX: '178px', originY: '346px' }}
                >
                  <rect x="150" y="340" width="40" height="96" fill="#3fae44" stroke="#1f2023" strokeWidth="5" />
                  {pixelNoise(150, 340, 40, 96, 10, ['#2f8f38', '#59c25c'], 44)}
                  <rect x="150" y="340" width="40" height="96" fill="none" stroke="#1f2023" strokeWidth="5" />
                  {/* skin-tone cube hand */}
                  <rect x="150" y="432" width="40" height="34" fill="#f0be96" stroke="#1f2023" strokeWidth="5" />
                </motion.g>
              </motion.g>

              {/* ---- RIGHT ARM (viewer-right, responsive) ---- */}
              <motion.g
                style={{
                  rotate: rightArmRotate,
                  transformBox: 'view-box',
                  originX: '302px',
                  originY: '346px',
                }}
              >
                <motion.g
                  animate={{ rotate: [0, 3, 0, -2, 0] }}
                  transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformBox: 'view-box', originX: '302px', originY: '346px' }}
                >
                  <rect x="290" y="340" width="40" height="96" fill="#3fae44" stroke="#1f2023" strokeWidth="5" />
                  {pixelNoise(290, 340, 40, 96, 10, ['#2f8f38', '#59c25c'], 55)}
                  <rect x="290" y="340" width="40" height="96" fill="none" stroke="#1f2023" strokeWidth="5" />
                  <rect x="290" y="432" width="40" height="34" fill="#f0be96" stroke="#1f2023" strokeWidth="5" />
                </motion.g>
              </motion.g>
            </motion.g>

            {/* ============ HEAD (mouse-tracked cube) ============ */}
            <motion.g
              style={{
                rotate: headRotate,
                x: headX,
                y: headY,
                transformBox: 'view-box',
                originX: '240px',
                originY: '260px',
              }}
            >
              {/* neck */}
              <rect x="216" y="308" width="48" height="26" fill="#f0be96" stroke="#1f2023" strokeWidth="4" />

              {/* hood — green cube framing the face, sits behind everything else in the head */}
              <rect x="140" y="120" width="200" height="200" rx="6" fill="#3fae44" stroke="#1f2023" strokeWidth="5" />
              {pixelNoise(140, 120, 200, 60, 12, ['#2f8f38', '#59c25c'], 66)}
              <rect x="140" y="120" width="200" height="200" rx="6" fill="none" stroke="#1f2023" strokeWidth="5" />

              {/* face — inset skin cube */}
              <rect x="164" y="164" width="152" height="140" fill="#f0be96" stroke="#1f2023" strokeWidth="5" />

              {/* brown fringe peeking out from under the hood */}
              <rect x="164" y="164" width="152" height="26" fill="#5a3a24" />
              <rect x="164" y="164" width="30" height="46" fill="#5a3a24" />
              <rect x="286" y="164" width="30" height="46" fill="#5a3a24" />
              <rect x="196" y="182" width="18" height="20" fill="#5a3a24" />
              <rect x="266" y="182" width="18" height="20" fill="#5a3a24" />

              {/* ears */}
              <rect x="150" y="220" width="14" height="30" fill="#f0be96" stroke="#1f2023" strokeWidth="3" />
              <rect x="316" y="220" width="14" height="30" fill="#f0be96" stroke="#1f2023" strokeWidth="3" />

              {/* eyebrows */}
              <rect x="190" y="212" width="34" height="8" fill="#4a2f1c" />
              <rect x="256" y="212" width="34" height="8" fill="#4a2f1c" />

              {/* eyes — green sockets with a tracked pupil block */}
              <rect x="190" y="226" width="36" height="30" fill="#f4f2ec" stroke="#1f2023" strokeWidth="3" />
              <rect x="254" y="226" width="36" height="30" fill="#f4f2ec" stroke="#1f2023" strokeWidth="3" />
              <motion.g style={{ x: pupilX, y: pupilY }}>
                <rect x="200" y="234" width="18" height="18" fill="#4caf50" stroke="#1f2023" strokeWidth="2" />
                <rect x="264" y="234" width="18" height="18" fill="#4caf50" stroke="#1f2023" strokeWidth="2" />
                <rect x="206" y="236" width="6" height="6" fill="#e9ffe8" />
                <rect x="270" y="236" width="6" height="6" fill="#e9ffe8" />
              </motion.g>

              {/* scar, echoing the earlier characters' small signature detail */}
              <rect x="286" y="252" width="4" height="20" fill="#c96f4a" />

              {/* nose */}
              <rect x="234" y="256" width="12" height="10" fill="#dba57e" />

              {/* mouth — flat smile, widens on the power move */}
              <rect
                x={excited ? 202 : 212}
                y="278"
                width={excited ? 76 : 56}
                height="8"
                fill="#1f2023"
              />

              {/* blush */}
              <rect x="180" y="262" width="14" height="10" fill="#e78a72" opacity="0.55" />
              <rect x="286" y="262" width="14" height="10" fill="#e78a72" opacity="0.55" />
            </motion.g>
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
