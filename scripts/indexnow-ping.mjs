/**
 * Ping IndexNow after a deploy (E51) so Bing/Yandex-family engines re-crawl
 * immediately. Google does not support IndexNow — Google coverage comes from
 * Search Console + the sitemap (a manual, account-bound step).
 *
 * Usage: node scripts/indexnow-ping.mjs
 */
const HOST = "zahid-imran.pages.dev";
const KEY = "7f3a9c1e5b8d4f60a2c7e9d1b3f5a8c4";

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: [`https://${HOST}/`, `https://${HOST}/services`],
  }),
});
console.log("IndexNow:", res.status, res.status === 200 || res.status === 202 ? "accepted" : await res.text());
