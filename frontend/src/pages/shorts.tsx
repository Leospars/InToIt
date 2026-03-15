import { useRef, useState } from "react";

const videos = [
  "https://www.youtube.com/embed/aqz-KE-bpKQ",
  "https://www.youtube.com/embed/tgbNymZ7vqY",
  "https://www.youtube.com/embed/aqz-KE-bpKQ",
  "https://www.youtube.com/embed/tgbNymZ7vqY",
];

const VideoSlide = ({ src }: { src: string; }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        scrollSnapAlign: "start",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          height: "calc(100% - 100px)",
          aspectRatio: "9 / 16",
          borderRadius: 32,
          overflow: "hidden",
          position: "relative",
          background: "#111",
        }}
      >

        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #111 25%, #222 37%, #111 63%)",
              backgroundSize: "400% 100%",
              animation: "skeleton 1.4s ease infinite",
            }}
          />
        )}

        <iframe
          ref={iframeRef}
          src={`${src}?autoplay=1&mute=1&controls=0&loop=1`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
};

const Shorts = () => {
  return (
    <>
      <style>
        {`
          @keyframes skeleton {
            0% { background-position: 200% 0 }
            100% { background-position: -200% 0 }
          }
        `}
      </style>

      <div
        style={{
          height: "100%",
          width: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
        }}
      >
        {videos.map((src, i) => (
          <VideoSlide key={i} src={src} />
        ))}
      </div>
    </>
  );
};

export default Shorts;