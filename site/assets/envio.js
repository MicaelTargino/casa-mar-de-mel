/* Casa Mar de Mel — envio para o Google Drive da casa (via Apps Script) e alternativa pelo WhatsApp. */
(function () {
  const C = window.CASA;
  const ativo = () => !!C.envioUrl;

  // Reduz fotos grandes de celular para ~1600px em JPEG. PDFs e imagens que não abrirem vão como estão.
  async function prepararArquivo(file) {
    if (!file.type.startsWith("image/") || file.size < 900 * 1024) return file;
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const escala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * escala);
      cv.height = Math.round(bmp.height * escala);
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.85));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
      return file;
    }
  }

  function paraBase64(blob) {
    return new Promise((ok, falha) => {
      const fr = new FileReader();
      fr.onload = () => ok(String(fr.result).split(",")[1]);
      fr.onerror = () => falha(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  async function anexo(blob) {
    return { tipo: blob.type || "application/octet-stream", base64: await paraBase64(blob) };
  }

  // text/plain evita a checagem prévia (CORS) que o Apps Script não responde.
  async function chamar(acao, corpo) {
    if (!ativo()) throw new Error("Envio automático ainda não configurado.");
    let resp;
    try {
      resp = await fetch(C.envioUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ acao, ...corpo }),
        redirect: "follow",
      });
    } catch {
      throw new Error("Sem conexão com o servidor de envio. Confira a internet e tente de novo.");
    }
    let json;
    try { json = await resp.json(); } catch { throw new Error("O servidor de envio não respondeu como esperado. Tente de novo em alguns minutos."); }
    if (!json.ok) throw new Error(json.erro || "Não foi possível concluir o envio.");
    return json;
  }

  // Abre o menu de compartilhar do celular com os arquivos anexados (para mandar no WhatsApp).
  function podeCompartilhar(files) {
    try { return !!(navigator.canShare && navigator.canShare({ files })); } catch { return false; }
  }
  async function compartilhar(files, texto) {
    await navigator.share({ files, text: texto, title: C.nome });
  }

  window.MDMEnvio = { ativo, prepararArquivo, anexo, chamar, podeCompartilhar, compartilhar };
})();
