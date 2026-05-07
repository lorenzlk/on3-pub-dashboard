import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ef4444 0%, #fb923c 60%, #0f172a 100%)",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: "white",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
          >
            On3
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

