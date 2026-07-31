import { ImageResponse } from "next/og";
import { identity } from "@/content/profile";

export const dynamic = "force-static";

export const alt = `${identity.name} — ${identity.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card generated at build time; colors mirror the site's dark theme. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0c0e12",
          color: "#e8eaed",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "14px",
              height: "120px",
              background: "#8da2fb",
              borderRadius: "7px",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "72px", fontWeight: 700 }}>
              {identity.name}
            </div>
            <div style={{ fontSize: "36px", color: "#8da2fb", marginTop: "8px" }}>
              {identity.role}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "100px",
            fontSize: "28px",
            color: "#9aa1a9",
          }}
        >
          <div>{identity.location}</div>
          <div>{identity.siteUrl.replace("https://", "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
