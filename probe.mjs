import fs from "node:fs";
const key = fs.readFileSync(new URL("./.env", import.meta.url), "utf8").match(/GENAIPRO_API_KEY\s*=\s*(.+)/)[1].trim();
const bases = [
  "https://genaipro.vn/api/v1",
  "https://api.genaipro.io/api/v1",
  "https://api.genaipro.io/v1",
  "https://genaipro.io/api/v1",
  "https://app.genaipro.io/api/v1",
  "https://genaipro.io/api",
];
for (const b of bases) {
  for (const ep of ["/labs/voices"]) {
    try {
      const r = await fetch(b + ep, { headers: { Authorization: "Bearer " + key } });
      const t = await r.text();
      console.log(r.status, b + ep, "→", t.slice(0, 120).replace(/\n/g, " "));
    } catch (e) {
      console.log("ERR", b + ep, e.cause?.code || e.message);
    }
  }
}
