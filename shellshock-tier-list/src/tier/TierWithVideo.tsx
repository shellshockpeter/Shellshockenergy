import React, { useEffect, useState } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useDelayRender } from "remotion";
import { TierOverlay, TierOverlayProps } from "./TierOverlay";

// The background video lives in public/. First name that exists wins.
const VIDEO_CANDIDATES = ["1123(1).mp4", "1123.mp4", "lower_res.mp4"];

const probe = async (name: string): Promise<boolean> => {
  try {
    const r = await fetch(staticFile(name), { headers: { Range: "bytes=0-0" } });
    const type = r.headers.get("content-type") ?? "";
    return r.ok && !type.includes("text/html");
  } catch {
    return false;
  }
};

/** Full-frame video underneath the overlay. No video found → dark gray placeholder. */
export const TierWithVideo: React.FC<TierOverlayProps> = ({ DEBUG = false }) => {
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("looking for the background video"));
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const name of VIDEO_CANDIDATES) {
        if (await probe(name)) {
          if (alive) setSrc(name);
          break;
        }
      }
      continueRender(handle);
    })();
    return () => {
      alive = false;
    };
  }, [continueRender, handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1d20" }}>
      {src ? (
        <OffthreadVideo
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <TierOverlay DEBUG={DEBUG} />
    </AbsoluteFill>
  );
};
