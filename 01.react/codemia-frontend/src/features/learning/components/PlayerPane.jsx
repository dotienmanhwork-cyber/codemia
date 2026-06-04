// features/learning/components/PlayerPane.jsx
import { useEffect, useRef } from "react";

// ── Detect platform từ URL ────────────────────────────────────────────────────
function detectPlatform(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be")
      return "youtube";
    if (parsed.hostname.includes("vimeo.com"))
      return "vimeo";
  } catch { /* ignore */ }
  return null;
}

// ── Tách YouTube video ID ─────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("?")[0];
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/embed/"))
        return parsed.pathname.split("/embed/")[1]?.split("?")[0] ?? null;
      return parsed.searchParams.get("v");
    }
  } catch { /* ignore */ }
  return null;
}

// ── Tách Vimeo video ID ───────────────────────────────────────────────────────
function extractVimeoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("vimeo.com")) {
      // dạng: /123456789 hoặc /manage/videos/123456789
      const parts = parsed.pathname.split("/").filter(Boolean);
      // lấy phần tử cuối là số
      const id = [...parts].reverse().find((p) => /^\d+$/.test(p));
      return id ?? null;
    }
  } catch { /* ignore */ }
  return null;
}

// ── Vimeo Player (dùng iframe embed) ─────────────────────────────────────────
function VimeoPlayer({ vimeoId, onComplete, onTimeUpdate, onReady }) {
  const iframeRef = useRef(null);
  const intervalRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!vimeoId) return;

    // Load Vimeo Player SDK
    const loadSdk = () => {
      return new Promise((resolve) => {
        if (window.Vimeo?.Player) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://player.vimeo.com/api/player.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadSdk().then(() => {
      if (!iframeRef.current) return;

      const player = new window.Vimeo.Player(iframeRef.current);
      playerRef.current = player;

      player.ready().then(() => {
        // Trả seekTo cho parent (SummaryPanel timestamp click)
        onReady?.((seconds) => {
          player.setCurrentTime(seconds);
          player.play();
        });
      });

      player.on("ended", () => {
        clearInterval(intervalRef.current);
        onComplete?.();
      });

      player.on("play", () => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
          const t = await player.getCurrentTime();
          if (t != null) onTimeUpdate?.(t);
        }, 5000);
      });

      player.on("pause", () => clearInterval(intervalRef.current));
    });

    return () => {
      clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [vimeoId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 w-full h-full">
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        title="Vimeo video player"
      />
    </div>
  );
}

// ── YouTube Player (giữ nguyên logic cũ) ─────────────────────────────────────
function YouTubePlayer({ videoId, onComplete, onTimeUpdate, onReady }) {
  const containerRef = useRef(null);
  const playerRef    = useRef(null);
  const intervalRef  = useRef(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const mountDiv = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(mountDiv);

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(mountDiv, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (event) => {
            onReady?.((seconds) => {
              event.target.seekTo(seconds, true);
              event.target.playVideo();
            });
          },
          onStateChange: (event) => {
            const YT = window.YT.PlayerState;
            if (event.data === YT.ENDED) {
              clearInterval(intervalRef.current);
              onComplete?.();
            }
            if (event.data === YT.PLAYING) {
              clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const t = playerRef.current?.getCurrentTime?.();
                if (t != null) onTimeUpdate?.(t);
              }, 5000);
            } else {
              clearInterval(intervalRef.current);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };
    }

    return () => {
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}

// ── Fallback: chưa có video ───────────────────────────────────────────────────
function NoVideoPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-2 text-white/60">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 9.75v9A2.25 2.25 0 004.5 18.75z" />
        </svg>
        <p className="text-sm">Bài học này chưa có video</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PlayerPane({ lesson, onTimeUpdate, onComplete, onReady }) {
  const url      = lesson?.videoUrl;
  const platform = detectPlatform(url);

  return (
    <div className="relative bg-black w-full aspect-video flex-shrink-0">
      {platform === "vimeo" && (
        <VimeoPlayer
          vimeoId={extractVimeoId(url)}
          onTimeUpdate={onTimeUpdate}
          onComplete={onComplete}
          onReady={onReady}
        />
      )}
      {platform === "youtube" && (
        <YouTubePlayer
          videoId={extractYouTubeId(url)}
          onTimeUpdate={onTimeUpdate}
          onComplete={onComplete}
          onReady={onReady}
        />
      )}
      {!platform && <NoVideoPlaceholder />}
    </div>
  );
}