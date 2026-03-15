import React, { useRef, useState, useCallback } from "react";
import { Search, Loader } from "lucide-react";

interface Short {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  embed_url: string;
  channel: string;
}

const VideoSlide = ({ src, title }: { src: string; title: string }) => {
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
          title={title}
        />
      </div>
    </div>
  );
};

const Shorts = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState("");

  const searchShorts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError("Please enter a search term");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastSearch(query);

    try {
      const response = await fetch("/api/videos/shorts/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, max_results: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch shorts");
      }

      const data = await response.json();
      setShorts(data.shorts || []);

      if (data.shorts.length === 0) {
        setError("No shorts found. Try a different search term.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error searching shorts");
      setShorts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchShorts(searchQuery);
  };

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

      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
        {/* Search Bar */}
        <div style={{ padding: "16px", backgroundColor: "#0a0a0a", borderBottom: "1px solid #333" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search for shorts... (e.g., 'AI tutorials', 'coding tips')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #444",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                fontSize: "14px",
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: isLoading ? "#555" : "#4f46e5",
                color: "#fff",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isLoading ? (
                <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Search size={18} />
              )}
            </button>
          </form>

          {/* Status Messages */}
          {error && (
            <div style={{ marginTop: "12px", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#7f1d1d", color: "#fca5a5", fontSize: "13px" }}>
              {error}
            </div>
          )}
          {lastSearch && !isLoading && shorts.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#888" }}>
              Found {shorts.length} shorts for "{lastSearch}" (powered by Gemini AI)
            </div>
          )}
        </div>

        {/* Shorts Display */}
        <div
          style={{
            flex: 1,
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
            display: shorts.length > 0 ? "block" : "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {shorts.length > 0 ? (
            shorts.map((short) => (
              <VideoSlide key={short.id} src={short.embed_url} title={short.title} />
            ))
          ) : (
            <div style={{ textAlign: "center", color: "#888" }}>
              <p style={{ fontSize: "16px" }}>Search for YouTube Shorts above</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Powered by Gemini AI for smart recommendations
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        button:disabled {
          opacity: 0.6;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Shorts;