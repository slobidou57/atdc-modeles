/* COPIES DES ARCHIVES DU COPILOTE ET SURVEILLANCE DE LEURS SOURCES (dépôt public slobidou57/atdc-modeles, 20.11.2026).
 * Chaque nuit (verifier.yml) : 1. chaque source est relue (en-têtes seulement) : taille différente → archive téléchargée et
 * empreinte calculée ; une empreinte inconnue fait ÉCHOUER l'exécution (GitHub l'envoie par courriel) — la nouvelle archive
 * est à vérifier, puis son empreinte à ajouter au pack du copilote (« empreintes ») et à copilote.js ; 2. une archive absente
 * de la publication « copilote » y est copiée depuis sa source, seulement si son empreinte est connue ; 3. les fichiers
 * « surveillés » (sans empreinte fixée) doivent encore répondre.
 * Quotas : dépôt public (minutes d'Actions gratuites) ; d'ordinaire, quelques requêtes d'en-têtes, rien n'est téléchargé ;
 * une archive n'est téléchargée qu'une fois (copie absente) ou quand sa source change ; aucun artefact, aucun cache.
 *   node verifier.js manifeste.json */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto"), { execFileSync } = require("child_process");
const M = JSON.parse(fs.readFileSync(process.argv[2] || "manifeste.json", "utf8")), TAG = M.publication || "copilote";
const gh = (...a) => execFileSync("gh", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const erreurs = [], notes = [];
const tete = async url => { try { const r = await fetch(url, { method: "HEAD", redirect: "follow" }); return { ok: r.ok, statut: r.status, octets: Number(r.headers.get("content-length")) || 0, modifie: r.headers.get("last-modified") || "" }; } catch (e) { return { ok: false, statut: e.message, octets: 0 }; } };
async function telecharger(url, dest) {
  const r = await fetch(url, { redirect: "follow" }); if (!r.ok) throw new Error(`${url} : ${r.status}`);
  const h = crypto.createHash("sha256"), f = fs.createWriteStream(dest);
  for await (const c of r.body) { h.update(c); if (!f.write(c)) await new Promise(res => f.once("drain", res)); }
  await new Promise(res => f.end(res)); return h.digest("hex");
}
(async () => {
  let publiees = null;
  try { publiees = JSON.parse(gh("release", "view", TAG, "--json", "assets")).assets.map(a => ({ nom: a.name, octets: a.size })); }
  catch { gh("release", "create", TAG, "--title", "Copies des archives du copilote ATDC", "--latest=false", "--notes", "Copies des archives à empreinte fixée du copilote du Compagnon ATDC (voir LISEZMOI.md : licences et attributions)."); publiees = []; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "modeles-"));
  for (const a of M.archives) {
    const h = await tete(a.source), f = path.join(dir, a.nom), copier = a.copie !== false && !publiees.some(p => p.nom === a.nom);
    let sha = "";   // (archive téléchargée au plus une fois par nuit : source changée, ou copie à faire)
    if (!h.ok) erreurs.push(`${a.nom} : source injoignable (${h.statut}) — ${a.source}`);
    else if ((h.octets && h.octets !== a.octets) || copier) {
      sha = await telecharger(a.source, f);
      if (!a.sha256.includes(sha)) erreurs.push(`${a.nom} : ARCHIVE REMPLACÉE À LA SOURCE (${h.octets} octets, ${a.octets} attendus, modifiée ${h.modifie}) — nouvelle empreinte ${sha} : la vérifier, puis l'ajouter au pack du copilote (« empreintes ») et à copilote.js ; les Compagnons continuent avec la copie de l'escadron`);
      else notes.push(`${a.nom} : ${h.octets !== a.octets ? "taille annoncée différente, mais " : ""}empreinte connue`);
    } else notes.push(`${a.nom} : source inchangée (${a.octets} octets)`);
    if (a.copie === false) notes.push(`${a.nom} : pas de copie (licence à confirmer)`);
    else if (copier && sha && a.sha256.includes(sha)) { gh("release", "upload", TAG, f, "--clobber"); notes.push(`${a.nom} : copie ajoutée (${sha})`); }
    fs.rmSync(f, { force: true });
  }
  for (const s of M.surveiller || []) { const h = await tete(s.source); if (!h.ok) erreurs.push(`${s.nom} : ne répond plus (${h.statut}) — ${s.source}`); else notes.push(`${s.nom} : répond (${h.octets} octets, modifié ${h.modifie || "?"})`); }
  for (const n of notes) console.log(n);
  for (const e of erreurs) console.log(`::error::${e}`);
  process.exit(erreurs.length ? 1 : 0);
})();
