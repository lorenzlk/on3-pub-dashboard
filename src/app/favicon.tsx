import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Favicon() {
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
        <span
          style={{
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: -0.8,
            color: "white",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
          }}
        >
          On3
        </span>
      </div>
    ),
    size
  );
}

