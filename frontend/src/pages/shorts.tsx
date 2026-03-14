import React, { useRef, useEffect } from "react";

const videos = [
  "https://www.youtube.com/embed/aqz-KE-bpKQ",
  "https://www.youtube.com/embed/tgbNymZ7vqY",
  "https://www.youtube.com/embed/aqz-KE-bpKQ",
  "https://www.youtube.com/embed/tgbNymZ7vqY",
];

const VideoSlide = ({ src }: { src: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <iframe
          ref={iframeRef}
          src={`${src}?autoplay=1&mute=1&controls=0&loop=1`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    </div>
  );
};

const Shorts = () => {
  return (
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
  );
};

export default Shorts;