import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from 'framer-motion';

// Cute rounded chibi-style avatar — round head, big friendly eyes, soft
// tousled hair, a cozy rounded sweater, capsule arms/legs. Replaces the
// earlier blocky Minecraft-style avatar (too "sad"/blocky per feedback)
// while keeping every interaction identical:
// - Head + eyes track the cursor with springs (same rig as before).
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
  // The arm shapes hang straight down from their shoulder pivot at rotate=0,
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

  // Palette — warm and friendly, tuned to sit comfortably on the site's
  // cream/olive "Trailhead" theme instead of clashing with a saturated
  // primary color.
  const SKIN = '#f0c19a';
  const SKIN_SHADE = '#dba576';
  const HAIR = '#3c2a1e';
  const HAIR_SHADE = '#2b1d14';
  const SWEATER = '#4a6741';
  const SWEATER_SHADE = '#3a5233';
  const SWEATER_TRIM = '#e7c98f';
  const PANTS = '#3a4a63';
  const PANTS_SHADE = '#2c3a4e';
  const SHOE = '#5a3a24';
  const INK = '#26301f';

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
            aria-label="Cute rounded cartoon avatar of Gowtham wearing a cozy sweater"
          >
            {/* ground shadow */}
            <ellipse cx="240" cy="618" rx="112" ry="14" fill="rgba(0,0,0,0.22)" />

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
                <rect x="184" y="470" width="46" height="104" rx="23" fill={PANTS} />
                <rect x="184" y="520" width="46" height="54" rx="18" fill={PANTS_SHADE} opacity="0.5" />
                <ellipse cx="207" cy="594" rx="32" ry="18" fill={SHOE} />
                <ellipse cx="207" cy="588" rx="32" ry="10" fill="#f4f2ec" opacity="0.9" />
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
                <rect x="250" y="470" width="46" height="104" rx="23" fill={PANTS} />
                <rect x="250" y="520" width="46" height="54" rx="18" fill={PANTS_SHADE} opacity="0.5" />
                <ellipse cx="273" cy="594" rx="32" ry="18" fill={SHOE} />
                <ellipse cx="273" cy="588" rx="32" ry="10" fill="#f4f2ec" opacity="0.9" />
              </motion.g>

              {/* torso — cozy rounded sweater */}
              <rect x="160" y="326" width="160" height="156" rx="46" fill={SWEATER} />
              <path d="M164 400 Q240 424 316 400 L316 470 Q240 486 164 470 Z" fill={SWEATER_SHADE} opacity="0.55" />
              {/* collar */}
              <path d="M210 330 Q240 356 270 330 L262 348 Q240 364 218 348 Z" fill={SWEATER_TRIM} />

              {/* ---- LEFT ARM (viewer-left, responsive) ---- */}
              <motion.g
                style={{
                  rotate: leftArmRotate,
                  transformBox: 'view-box',
                  originX: '178px',
                  originY: '350px',
                }}
              >
                <motion.g
                  animate={{ rotate: [0, -3, 0, 2, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformBox: 'view-box', originX: '178px', originY: '350px' }}
                >
                  <rect x="150" y="342" width="52" height="102" rx="26" fill={SWEATER} />
                  <circle cx="176" cy="452" r="26" fill={SKIN} />
                </motion.g>
              </motion.g>

              {/* ---- RIGHT ARM (viewer-right, responsive) ---- */}
              <motion.g
                style={{
                  rotate: rightArmRotate,
                  transformBox: 'view-box',
                  originX: '302px',
                  originY: '350px',
                }}
              >
                <motion.g
                  animate={{ rotate: [0, 3, 0, -2, 0] }}
                  transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformBox: 'view-box', originX: '302px', originY: '350px' }}
                >
                  <rect x="278" y="342" width="52" height="102" rx="26" fill={SWEATER} />
                  <circle cx="304" cy="452" r="26" fill={SKIN} />
                </motion.g>
              </motion.g>
            </motion.g>

            {/* ============ HEAD (mouse-tracked, round + friendly) ============ */}
            <motion.g
              style={{
                rotate: headRotate,
                x: headX,
                y: headY,
                transformBox: 'view-box',
                originX: '240px',
                originY: '230px',
              }}
            >
              {/* neck */}
              <rect x="216" y="292" width="48" height="34" rx="16" fill={SKIN_SHADE} />

              {/* ears */}
              <circle cx="146" cy="232" r="18" fill={SKIN} />
              <circle cx="334" cy="232" r="18" fill={SKIN} />

              {/* head */}
              <circle cx="240" cy="222" r="104" fill={SKIN} />

              {/* hair — short, tousled, side-swept */}
              <path
                d="M132 210
                   Q120 108 240 100
                   Q360 108 348 210
                   Q346 160 322 150
                   Q330 190 312 178
                   Q300 130 240 128
                   Q180 130 168 178
                   Q150 190 158 150
                   Q134 160 132 210 Z"
                fill={HAIR}
              />
              <path d="M132 210 Q140 176 160 160 Q150 188 152 206 Z" fill={HAIR_SHADE} opacity="0.6" />
              <path d="M348 210 Q340 176 320 160 Q330 188 328 206 Z" fill={HAIR_SHADE} opacity="0.6" />

              {/* eyebrows */}
              <path d="M184 214 Q202 202 222 210" fill="none" stroke={HAIR} strokeWidth="8" strokeLinecap="round" />
              <path d="M258 210 Q278 202 296 214" fill="none" stroke={HAIR} strokeWidth="8" strokeLinecap="round" />

              {/* eyes — big, round, friendly */}
              <ellipse cx="203" cy="240" rx="24" ry={excited ? 28 : 26} fill="#ffffff" stroke={INK} strokeWidth="3" />
              <ellipse cx="277" cy="240" rx="24" ry={excited ? 28 : 26} fill="#ffffff" stroke={INK} strokeWidth="3" />
              <motion.g style={{ x: pupilX, y: pupilY }}>
                <circle cx="203" cy="244" r="13" fill="#3d2b1f" />
                <circle cx="277" cy="244" r="13" fill="#3d2b1f" />
                <circle cx="208" cy="239" r="4" fill="#ffffff" />
                <circle cx="282" cy="239" r="4" fill="#ffffff" />
              </motion.g>

              {/* blush */}
              <ellipse cx="176" cy="270" rx="16" ry="9" fill="#f2937a" opacity="0.5" />
              <ellipse cx="304" cy="270" rx="16" ry="9" fill="#f2937a" opacity="0.5" />

              {/* nose */}
              <path d="M240 250 Q246 262 238 266" fill="none" stroke={SKIN_SHADE} strokeWidth="4" strokeLinecap="round" />

              {/* mouth — warm smile, widens on the power move */}
              <path
                d={excited ? 'M204 284 Q240 314 276 284' : 'M214 284 Q240 300 266 284'}
                fill="none"
                stroke={INK}
                strokeWidth="7"
                strokeLinecap="round"
              />
            </motion.g>
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
