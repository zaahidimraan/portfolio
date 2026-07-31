import { ImageResponse } from "next/og";
import { identity } from "@/content/profile";

export const dynamic = "force-static";

export const alt = `${identity.name} — ${identity.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card generated at build time; monochrome, mirrors the hero treatment. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            letterSpacing: "0.3em",
            color: "#a2a8ae",
            textTransform: "uppercase",
          }}
        >
          {identity.location}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: "160px", height: "8px", background: "#f5f5f5" }} />
          <div
            style={{
              fontSize: "128px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.02,
              marginTop: "20px",
            }}
          >
            {identity.name}
          </div>
          <div style={{ fontSize: "34px", color: "#a2a8ae", marginTop: "16px" }}>
            {identity.role}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "24px",
            color: "#a2a8ae",
          }}
        >
          <div>{identity.email}</div>
          <div>{identity.siteUrl.replace("https://", "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
