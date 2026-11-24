import React, { useEffect, useState } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useDelayRender } from "remotion";
import { TierOverlay, TierOverlayProps } from "./TierOverlay";

const VIDEO = "1123(1).mp4";

/** Wrapper: full-frame video underneath the overlay. Missing file → dark gray placeholder. */
export const TierWithVideo: React.FC<TierOverlayProps> = ({ DEBUG = false }) => {
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("checking for the video file"));
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(staticFile(VIDEO), { method: "HEAD" })
      .then((r) => {
        const type = r.headers.get("content-type") ?? "";
        if (alive) setExists(r.ok && (type.startsWith("video") || type.includes("octet")));
      })
      .catch(() => alive && setExists(false))
      .finally(() => continueRender(handle));
    return () => {
      alive = false;
    };
  }, [continueRender, handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1c1d20" }}>
      {exists ? (
        <OffthreadVideo
          src={staticFile(VIDEO)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <TierOverlay DEBUG={DEBUG} />
    </AbsoluteFill>
  );
};
