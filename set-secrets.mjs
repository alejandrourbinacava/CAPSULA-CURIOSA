import fs from "node:fs";
import sodium from "libsodium-wrappers";
const TOKEN = process.env.GH_TOKEN;
const OWNER = "alejandrourbinacava", REPO = "CAPSULA-CURIOSA";
if (!TOKEN) { console.error("sin token"); process.exit(1); }
const env = fs.readFileSync(new URL("./.env", import.meta.url), "utf8");
const get = (n) => (env.match(new RegExp(n + "\\s*=\\s*(.+)")) || [])[1]?.trim();
const secrets = { GENAIPRO_API_KEY: get("GENAIPRO_API_KEY"), PIXABAY_KEY: get("PIXABAY_KEY"), PEXELS_KEY: get("PEXELS_KEY"), GEMINI_API_KEY: get("GEMINI_API_KEY"), ANTHROPIC_API_KEY: get("ANTHROPIC_API_KEY"), GIPHY_KEY: get("GIPHY_KEY") };
const H = { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "capsula" };

await sodium.ready;
const pk = await (await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/secrets/public-key`, { headers: H })).json();
if (!pk.key) { console.error("no pude leer public-key:", JSON.stringify(pk).slice(0, 200)); process.exit(1); }
for (const [name, val] of Object.entries(secrets)) {
  if (!val) { console.log(name, "→ (vacío, salto)"); continue; }
  const enc = sodium.crypto_box_seal(sodium.from_string(val), sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL));
  const encrypted_value = sodium.to_base64(enc, sodium.base64_variants.ORIGINAL);
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/secrets/${name}`, { method: "PUT", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ encrypted_value, key_id: pk.key_id }) });
  console.log(name, "→", r.status === 201 ? "CREADO ✅" : r.status === 204 ? "ACTUALIZADO ✅" : "ERROR " + r.status);
}
