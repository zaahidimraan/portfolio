import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { identity } from "@/content/profile";

export const dynamic = "force-static";

export const alt = `${identity.name} — ${identity.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card generated at build time; monochrome, mirrors the hero (with portrait, GLW-1.5). */
export default async function OpenGraphImage() {
  const portrait = await readFile(join(process.cwd(), "public", "portrait.png"));
  const portraitSrc = `data:image/png;base64,${portrait.toString("base64")}`;
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
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- satori element, not DOM */}
        <img
          src={portraitSrc}
          alt=""
          width={480}
          height={410}
          style={{ position: "absolute", right: "24px", bottom: "0px", opacity: 0.9 }}
        />
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
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "720px" }}>
          <div style={{ width: "160px", height: "8px", background: "#f5f5f5" }} />
          <div
            style={{
              fontSize: "104px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.02,
              marginTop: "20px",
            }}
          >
            {identity.name}
          </div>
          <div style={{ fontSize: "32px", color: "#a2a8ae", marginTop: "16px" }}>
            {identity.role}
          </div>
        </div>
        <div style={{ display: "flex", gap: "28px", fontSize: "24px", color: "#a2a8ae" }}>
          <div>{identity.email}</div>
          <div>·</div>
          <div>{identity.siteUrl.replace("https://", "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
