import { AbsoluteFill, Easing, Img, spring, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import "../brand/fonts";
import { hash } from "../components/Kinetic";
import { FPS, accentFill, accentGradient, color, font } from "../brand/theme";
import { lerp, prog } from "../lib/anim";

/**
 * Phone-call motion graphic, TRANSPARENT background, made to be overlaid on your own video.
 * An iPhone-style "island" rings, expands into a live call banner (logo pops in), stays live with
 * kinetic details, then collapses back to a pill, and repeats every `loopFrames`.
 */
export const callOverlaySchema = z.object({
  callerName: z.string().describe("name on the call, e.g. Gym Scene"),
  status: z.string().describe("small line under the name while the call is live"),
  logoSrc: z.string().describe("logo in video/public/ (transparent PNG), e.g. brand/gym-scene-logo.png"),
  seconds: z.number().describe("total length in seconds (53 = the full video)"),
  loopFrames: z.number().describe("length of one repeat in frames (30 per second). 265 = 8.8 s, so 53 s is exactly 6 repeats"),
  timerStartSeconds: z.number().describe("where the call timer starts, in seconds (it counts up the whole time)"),
  y: z.number().describe("top edge of the call UI in the 720×1280 layout (172 = just under Instagram's header)"),
  showButtons: z.boolean().describe("show the call buttons row (mute, keypad, speaker, add, end)"),
  pickupFrame: z
    .number()
    .describe("frame the call is answered (30 per second). Before it, the island rings and vibrates 'Calling…'. -1 = already in progress"),
  hangupFrame: z.number().describe("frame the call is hung up (30 per second). -1 = never"),
  afterHangup: z
    .enum(["fade", "leave", "stay"])
    .describe("fade = the UI fades out almost instantly once the hangup animation ends; leave = it collapses to a red bar then slides away; stay = the red 'Call ended' bar stays to the end"),
});

export type CallOverlayProps = z.infer<typeof callOverlaySchema>;

const W_PILL = 300;
const H_PILL = 56;
const W_BANNER = 640;
/** Frames the 'Call ended' state is held before the instant fade (end-button press + a beat to read it). */
const HANG_HOLD = 24;
const HANG_FADE = 5;
const H_BANNER = 262;

const spr = (f: number, damping = 13, stiffness = 150, mass = 0.8): number =>
  spring({ frame: f, fps: FPS, config: { damping, stiffness, mass } });

const Icon: React.FC<{ kind: "mute" | "keypad" | "speaker" | "add" | "end"; ink: string }> = ({ kind, ink }) => {
  const p = { stroke: ink, strokeWidth: 2.4, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "mute")
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" {...p}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" />
      </svg>
    );
  if (kind === "keypad")
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" fill={ink}>
        {[5, 12, 19].flatMap((x) => [5, 12, 19].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.9" />))}
      </svg>
    );
  if (kind === "speaker")
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" {...p}>
        <path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      </svg>
    );
  if (kind === "add")
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" {...p}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="#fff" style={{ transform: "rotate(135deg)" }}>
      <path d="M6.6 3.2c.5-.5 1.3-.5 1.8 0l2 2.3c.4.5.4 1.2 0 1.7l-1.2 1.3c1 2.1 2.7 3.8 4.8 4.8l1.3-1.2c.5-.4 1.2-.4 1.7 0l2.3 2c.5.5.5 1.3 0 1.8l-1.3 1.5c-.8.9-2 1.2-3.1.8C9.800 17.600 6.400 14.200 3.700 7.800 3.300 6.700 3.600 5.500 4.500 4.700L6.600 3.200z" />
    </svg>
  );
};

/** One rolling digit: when its value changes, the old digit slides up and the new one in. */
const Digit: React.FC<{ f: number; pos: number; startSec: number; size: number }> = ({ f, pos, startSec, size }) => {
  const val = (k: number): number => {
    const s = startSec + Math.max(0, k);
    const mm = Math.floor(s / 60) % 100;
    const ss = s % 60;
    return [Math.floor(mm / 10), mm % 10, Math.floor(ss / 10), ss % 10][pos];
  };
  const k = Math.floor((f + 6) / 30);
  const phase = (f + 6) % 30;
  const rolling = k > 0 && phase < 6 && val(k - 1) !== val(k);
  const p = rolling ? Easing.out(Easing.cubic)(phase / 6) : 1;
  const cur = val(k);
  const prev = val(k - 1);
  return (
    <span style={{ display: "inline-block", width: size * 0.56, height: size * 1.15, overflow: "hidden", position: "relative", verticalAlign: "top", textAlign: "center" }}>
      <span style={{ position: "absolute", left: 0, right: 0, top: 0, lineHeight: `${size * 1.15}px`, transform: `translateY(${rolling ? -p * size * 1.15 : 0}px)` }}>
        {rolling ? prev : cur}
      </span>
      {rolling && <span style={{ position: "absolute", left: 0, right: 0, top: size * 1.15, lineHeight: `${size * 1.15}px`, transform: `translateY(${-p * size * 1.15}px)` }}>{cur}</span>}
    </span>
  );
};

const Timer: React.FC<{ f: number; startSec: number; size?: number }> = ({ f, startSec, size = 28 }) => (
  <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: size, lineHeight: `${size * 1.15}px`, color: "rgba(255,255,255,0.9)", display: "inline-flex", alignItems: "center" }}>
    <Digit f={f} pos={0} startSec={startSec} size={size} />
    <Digit f={f} pos={1} startSec={startSec} size={size} />
    <span style={{ width: size * 0.3, textAlign: "center" }}>:</span>
    <Digit f={f} pos={2} startSec={startSec} size={size} />
    <Digit f={f} pos={3} startSec={startSec} size={size} />
  </span>
);

/** Speech-like bars (deterministic): syllable bursts with pauses, no audio needed. */
const Wave: React.FC<{ f: number; n: number; w: number; gap: number; maxH: number; seed?: number; active?: number }> = ({
  f,
  n,
  w,
  gap,
  maxH,
  seed = 0,
  active = 1,
}) => {
  const talk = 0.8 + 0.2 * Math.sin(f / 23 + seed) * Math.sin(f / 61 + 1 + seed);
  return (
    <div style={{ display: "flex", alignItems: "center", gap, height: maxH }}>
      {Array.from({ length: n }, (_, i) => {
        const syl = Math.abs(Math.sin(f / 4.2 + i * 0.85 + seed));
        const jit = 0.55 + 0.45 * hash(Math.floor(f / 2) * 17 + i * 5 + seed);
        const mid = 1 - Math.abs(i - (n - 1) / 2) / n; // taller in the middle
        const h = 6 + (maxH - 6) * Math.min(1, (0.3 + 0.7 * syl) * jit * talk * (0.6 + 0.55 * mid)) * active;
        return <div key={i} style={{ width: w, height: h, borderRadius: w, background: accentGradient }} />;
      })}
    </div>
  );
};

const Logo: React.FC<{ src: string; size: number; shine: number }> = ({ src, size, shine }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }} />
    {/* diagonal shine sweep, masked to the logo's own shape */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        WebkitMaskImage: `url(${staticFile(src)})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -10,
          left: `${lerp(-60, 130, shine)}%`,
          width: "34%",
          height: "130%",
          background: "linear-gradient(90deg, transparent, rgba(255,226,153,0.95), transparent)",
          transform: "skewX(-18deg)",
        }}
      />
    </div>
  </div>
);

export const CallOverlay: React.FC<CallOverlayProps> = (c) => {
  const frame = useCurrentFrame();
  const L = c.loopFrames;
  const P = c.pickupFrame;
  const Hg = c.hangupFrame;
  const scripted = P >= 0; // ring → answer, otherwise the call is already live at frame 0
  const calling = scripted && frame < P;
  const hung = Hg >= 0 && frame >= Hg;
  const d = frame - Hg; // frames since hangup

  // Cycle clock: the island expands, stays live, collapses to a pill, and repeats every L frames.
  const expandStart = scripted ? P + 4 : 0;
  const expandAt = 20;
  const collapseAt = Math.round(L * 0.78);
  const origin = scripted ? expandStart - expandAt : -70; // unscripted: start part-way through, already live
  const cycleOf = (fr: number): { t: number; cycle: number } => {
    const ph = fr - origin;
    return { t: ((ph % L) + L) % L, cycle: Math.floor(ph / L) };
  };
  const cycleM = (fr: number): number => {
    if (scripted && fr < expandStart) return 0;
    const { t } = cycleOf(fr);
    if (t < expandAt) return 0;
    if (t < collapseAt) return Math.min(1.04, spr(t - expandAt));
    return Math.max(0, 1 - spr(t - collapseAt, 15, 170, 0.7));
  };
  const { t, cycle } = cycleOf(frame);

  // Hangup: hold the banner expanded while the end button is pressed, then collapse to a red pill.
  const mH0 = Hg >= 0 ? cycleM(Hg) : 0;
  const m = hung
    ? Math.min(1.04, lerp(mH0, 1, prog(d, 0, 6))) * (c.afterHangup === "fade" || d < 34 ? 1 : Math.max(0, 1 - spr(d - 34, 15, 170, 0.7)))
    : cycleM(frame);
  const mm = Math.min(1, Math.max(0, m));

  const x = (720 - lerp(W_PILL, W_BANNER, mm)) / 2;
  const w = lerp(W_PILL, W_BANNER, m);
  const h = lerp(H_PILL, H_BANNER, m);
  const r = lerp(28, 40, mm);

  // island entrance + incoming-call vibration + the answer bump
  const pop = scripted ? spr(frame, 11, 220, 0.6) : 1;
  const callingT = frame - 12;
  const buzz = calling && callingT > 0 ? Math.sin(frame * 3.4) * 5 * (1 - Math.min(1, callingT / Math.max(1, P - 12)) * 0.5) : 0;
  const answerD = scripted ? frame - P : 99;
  const bump = answerD >= 0 && answerD < 10 ? 0.09 * Math.sin((Math.PI * answerD) / 10) : 0;
  const answered = answerD >= 0 && answerD < 5;

  // "after hangup": leave = slide up and fade away after the bar has collapsed
  const leaveP = hung && c.afterHangup === "leave" ? prog(d, 62, 16) : 0;
  // fade: the whole UI disappears almost instantly right after the hangup animation
  const fadeP = hung && c.afterHangup === "fade" ? prog(d, HANG_HOLD, HANG_FADE, (x) => x) : 0;

  const base = scripted ? P : 0;
  const tf = Math.max(0, (hung ? Hg : frame) - base); // timer frame (freezes at hangup)
  const startSec = c.timerStartSeconds;
  const ended = hung;
  const dotColor = ended ? "#E5342B" : "#3DDC84";
  const logoPop = m > 0.2 ? spr(Math.max(0, (hung ? 99 : t - expandAt - 4)), 9, 200, 0.55) : 0;
  const logoRot = lerp(-18, 0, Math.min(1, logoPop));
  const contentIn = hung ? 1 : scripted && frame < expandStart + 6 ? 0 : prog(t, expandAt + 6, 8);
  const pillContent = 1 - Math.min(1, mm * 2.2);
  const waveActive = ended ? Math.max(0, 1 - d / 8) : 1;
  const hangPress = ended && d < 10 ? Math.sin((Math.PI * d) / 10) : 0;

  // kinetic loops while live
  const shineP = (frame % 100) / 100;
  const ripple = (k: number): { r: number; o: number } => {
    const pp = ((frame + k * 22) % 66) / 66;
    return { r: lerp(70, 168, pp), o: (1 - pp) * 0.55 * mm * (ended ? 0 : 1) };
  };
  const btnKinds = ["mute", "keypad", "speaker", "add"] as const;
  const hot = Math.floor(frame / 60) % 4; // which button is "pressed" now
  const hotP = (frame % 60) / 60;

  const ringBurst = (pp: number, col: string, spreadX: number, spreadY: number, k: number): React.ReactNode => (
    <div
      key={k}
      style={{
        position: "absolute",
        left: 360 - (W_PILL / 2 + pp * spreadX),
        top: H_PILL / 2 - (H_PILL / 2 + pp * spreadY),
        width: W_PILL + pp * spreadX * 2,
        height: H_PILL + pp * spreadY * 2,
        borderRadius: 40 + pp * 40,
        border: `2px solid ${col}`,
        opacity: (1 - pp) * 0.75,
      }}
    />
  );

  const pillLabel = calling ? "Calling…" : answered ? "Connected" : ended ? "Call ended" : c.callerName;

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: c.y - leaveP * 140,
          width: 720,
          height: H_BANNER + 80,
          opacity: (1 - leaveP) * (1 - fadeP),
        }}
      >
        {/* ripples from the logo while live */}
        {mm > 0.6 &&
          [0, 1].map((k) => {
            const rp = ripple(k);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: x + 24 + 64 - rp.r,
                  top: 24 + 64 - rp.r,
                  width: rp.r * 2,
                  height: rp.r * 2,
                  borderRadius: "50%",
                  border: `2px solid ${color.accent}`,
                  opacity: rp.o,
                }}
              />
            );
          })}
        {/* ringing rings from the island (before pickup) */}
        {calling && frame >= 12 && [0, 1, 2].map((k) => ringBurst(Math.max(0, ((frame - 12 - k * 8) % 24) / 24), color.accent, 60, 50, k))}
        {/* green answer burst */}
        {answerD >= 0 && answerD < 16 && ringBurst(answerD / 16, "#3DDC84", 90, 70, 10)}
        {/* red hang-up burst */}
        {ended && d < 14 && mm > 0.5 && (
          <div
            style={{
              position: "absolute",
              left: x + (W_BANNER - 24 - 32) - (32 + (d / 14) * 70),
              top: 172 + 32 - (32 + (d / 14) * 70),
              width: (32 + (d / 14) * 70) * 2,
              height: (32 + (d / 14) * 70) * 2,
              borderRadius: "50%",
              border: "2px solid #E5342B",
              opacity: 1 - d / 14,
            }}
          />
        )}

        {/* the island / banner */}
        <div
          style={{
            position: "absolute",
            left: x + buzz,
            top: 0,
            width: w,
            height: h,
            borderRadius: r,
            transform: `translateY(${mm > 0.9 && !ended ? Math.sin(frame / 18) * 3 : 0}px) scale(${Math.min(1.05, pop) + bump})`,
            transformOrigin: "50% 0%",
            background: "linear-gradient(150deg, rgba(26,26,30,0.97), rgba(9,9,11,0.97))",
            border: `1.5px solid ${ended ? `rgba(229,52,43,${0.35 + 0.3 * mm})` : `rgba(255,183,0,${0.25 + 0.35 * mm})`}`,
            boxShadow: `0 0 ${10 + 26 * mm}px ${ended ? "rgba(229,52,43,0.25)" : `rgba(255,183,0,${0.12 + 0.2 * mm})`}, inset 0 1px 0 rgba(255,255,255,0.22), 0 18px 40px rgba(0,0,0,0.5)`,
            overflow: "hidden",
            opacity: Math.min(1, pop * 2),
          }}
        >
          {/* pill content (calling / idle / ended) */}
          <div style={{ position: "absolute", inset: 0, opacity: pillContent, display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
            <div style={{ width: 36, height: 36, flexShrink: 0, opacity: ended ? 0.7 : 1 }}>
              <Logo src={c.logoSrc} size={36} shine={shineP} />
            </div>
            <div style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 24, color: ended ? "#FF6B63" : "#fff", lineHeight: 1, whiteSpace: "nowrap", width: 120 }}>
              {pillLabel}
            </div>
            {calling ? (
              <div style={{ marginLeft: "auto", width: 12, height: 12, borderRadius: "50%", background: "#3DDC84", boxShadow: "0 0 12px #3DDC84", opacity: 0.5 + 0.5 * Math.sin(frame / 2) }} />
            ) : (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <Wave f={frame} n={7} w={4} gap={3} maxH={26} seed={cycle} active={waveActive} />
                <Timer f={tf} startSec={startSec} size={22} />
              </div>
            )}
          </div>

          {/* banner content */}
          <div style={{ position: "absolute", left: 0, top: 0, width: W_BANNER, height: H_BANNER, opacity: Math.min(1, contentIn) * Math.min(1, mm * 1.6) }}>
            <div
              style={{
                position: "absolute",
                left: 24,
                top: 22,
                width: 128,
                height: 128,
                opacity: ended ? 0.7 : 1,
                transform: `scale(${Math.min(1.18, logoPop)}) rotate(${logoRot}deg)`,
              }}
            >
              <Logo src={c.logoSrc} size={128} shine={shineP} />
            </div>
            <div style={{ position: "absolute", left: 172, top: 24, fontFamily: font.sans, fontWeight: 700, fontSize: 54, lineHeight: 1, color: "#fff", letterSpacing: "0.01em" }}>
              {c.callerName}
            </div>
            <div style={{ position: "absolute", left: 172, top: 84, display: "flex", alignItems: "center", gap: 10, fontFamily: font.sans, fontWeight: 500, fontSize: 28, color: ended ? "#FF6B63" : "rgba(255,255,255,0.72)", lineHeight: "32px" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: dotColor, boxShadow: `0 0 ${ended ? 6 : 8 + 8 * Math.sin(frame / 5)}px ${dotColor}` }} />
              <span>{ended ? "Call ended" : c.status}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
              <Timer f={tf} startSec={startSec} />
            </div>
            <div style={{ position: "absolute", left: 172, top: 120 }}>
              <Wave f={frame} n={22} w={8} gap={5} maxH={42} seed={cycle + 3} active={waveActive} />
            </div>
            {c.showButtons && (
              <div style={{ position: "absolute", left: 24, top: 172, width: 592, display: "flex", justifyContent: "space-between" }}>
                {btnKinds.map((kind, i) => {
                  const on = !ended && i === hot;
                  const press = on ? Math.sin(Math.PI * Math.min(1, hotP * 3)) : 0;
                  const enter = hung ? 1 : prog(t, expandAt + 12 + i * 3, 8);
                  return (
                    <div
                      key={kind}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: on ? accentFill(4) : "rgba(255,255,255,0.12)",
                        border: on ? "none" : "1px solid rgba(255,255,255,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `scale(${(0.6 + 0.4 * enter) * (1 + 0.14 * press)})`,
                        opacity: enter * (ended ? Math.max(0.3, 1 - d / 8) : 1),
                        boxShadow: on ? `0 0 ${14 + 14 * press}px ${color.glow}` : "none",
                      }}
                    >
                      <Icon kind={kind} ink={on ? color.onAccent : "#fff"} />
                    </div>
                  );
                })}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#E5342B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${(hung ? 1 : 0.6 + 0.4 * prog(t, expandAt + 24, 8)) * (1 + 0.3 * hangPress)})`,
                    opacity: hung ? 1 : prog(t, expandAt + 24, 8),
                    boxShadow: hangPress > 0 ? `0 0 ${10 + 24 * hangPress}px rgba(229,52,43,0.8)` : "none",
                  }}
                >
                  <Icon kind="end" ink="#fff" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
