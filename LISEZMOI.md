# atdc-modeles — copies des archives du copilote ATDC

Dépôt **public**, sans code du Compagnon : il garde, dans la publication **« copilote »**, une copie des archives que le
copilote du Compagnon ATDC télécharge avec une empreinte SHA-256 fixée (modèles d'écoute, programmes). Le Compagnon prend
d'abord cette copie, puis la source d'origine si elle manque ; l'empreinte est contrôlée dans les deux cas.

Pourquoi : le 07.11.2026, sherpa-onnx a remplacé en ligne l'archive Parakeet, à la même adresse ; plus aucune installation
du copilote ne passait jusqu'au 20.11.2026.

Ne jamais mettre ces copies dans **atdc-releases** : les Compagnons y lisent la dernière publication pour se mettre à jour.

- `manifeste.json` : les archives (nom, source, taille, empreintes acceptées, licence), à changer en même temps que
  `atdc-desktop/src/copilote.js` ; les fichiers seulement surveillés.
- `verifier.js`, `.github/workflows/verifier.yml` : chaque nuit, sources relues, copies manquantes ajoutées ; une archive
  remplacée à sa source fait échouer l'exécution (courriel de GitHub).

## Licences et attributions

- Parakeet TDT 0.6B v3 et Canary 180M Flash : NVIDIA, CC-BY-4.0 ; export ONNX par le projet sherpa-onnx (k2-fsa, Apache-2.0).
- Whisper large-v3 turbo : OpenAI, MIT ; export sherpa-onnx.
- Cohere Transcribe 03-2026 : Cohere ; pas copié tant que sa licence n'est pas confirmée.
- llama.cpp, whisper.cpp : ggml-org, MIT.
