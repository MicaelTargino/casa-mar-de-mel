/* Casa Mar de Mel — funções compartilhadas (orçamento, WhatsApp, contrato, anexos). */
(function () {
  const C = window.CASA;
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const money = (v) => brl.format(v);

  /* ---------- Datas ---------- */
  function parseISO(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getMonth() === m - 1 ? dt : null;
  }
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const br = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const brLong = (d) => d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const mmdd = (d) => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function temporadaDaNoite(d) {
    const k = mmdd(d);
    for (const t of C.precos.temporadas) {
      if (t.datas) {
        const a = parseISO(t.datas[0]), b = parseISO(t.datas[1]);
        if (d >= a && d <= b) return t;
        continue;
      }
      const dentro = t.inicio <= t.fim ? k >= t.inicio && k <= t.fim : k >= t.inicio || k <= t.fim;
      if (dentro) return t;
    }
    return C.precos.padrao;
  }

  /* ---------- Orçamento ---------- */
  function orcamento({ entrada, saida, hospedes = 1, desconto = 0 }) {
    const a = parseISO(entrada), b = parseISO(saida);
    if (!a || !b) return { erro: "Escolha a data de entrada e a de saída." };
    const noites = Math.round((b - a) / 86400000);
    if (noites < 1) return { erro: "A saída precisa ser depois da entrada." };
    if (noites > 90) return { erro: "Locação por temporada vai até 90 dias. Para períodos maiores, fale com a gente." };
    if (hospedes > C.capacidade) return { erro: `A casa recebe até ${C.capacidade} pessoas, contando as crianças.` };

    const grupos = [];
    let minimo = 1;
    for (let i = 0; i < noites; i++) {
      const t = temporadaDaNoite(addDays(a, i));
      minimo = Math.max(minimo, t.minimo || 1);
      const g = grupos.find((x) => x.nome === t.nome);
      if (g) g.noites++;
      else grupos.push({ nome: t.nome, diaria: t.diaria, noites: 1 });
    }
    grupos.forEach((g) => (g.subtotal = g.noites * g.diaria));
    const aluguel = grupos.reduce((s, g) => s + g.subtotal, 0);
    const limpeza = C.precos.limpeza;
    desconto = Math.max(0, Math.min(Number(desconto) || 0, aluguel));
    const total = aluguel + limpeza - desconto;

    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const venceSaldo = addDays(a, -C.precos.diasAntesSaldo);
    const parcelas = C.precos.pagamento.map((p, i) => {
      const valor = i === C.precos.pagamento.length - 1
        ? total - C.precos.pagamento.slice(0, -1).reduce((s, q) => s + Math.round((total * q.pct) / 100), 0)
        : Math.round((total * p.pct) / 100);
      const vence = p.quando === "reserva" ? hoje : venceSaldo < hoje ? hoje : venceSaldo;
      return { rotulo: p.rotulo, pct: p.pct, valor, vence, quandoTexto: p.quando === "reserva" ? "na confirmação da reserva" : p.quando };
    });

    return {
      entrada: a, saida: b, noites, hospedes, grupos, aluguel, limpeza, desconto, total,
      caucao: C.precos.caucao, parcelas, minimo,
      abaixoDoMinimo: noites < minimo,
    };
  }

  /* ---------- WhatsApp ---------- */
  const zap = (texto) => `https://wa.me/${C.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

  /* ---------- Código da reserva ---------- */
  function codigoReserva(entrada, nome) {
    const d = parseISO(entrada);
    const base = d ? `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}` : "000000";
    const sobrenome = (nome || "").trim().split(/\s+/).pop() || "";
    const ini = sobrenome.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "XXXX";
    return `MDM-${base}-${ini}`;
  }

  /* ---------- Documento: blocos que viram HTML e PDF ---------- */
  // Tipos: {h:"texto"} título de seção, {p:"texto"} parágrafo,
  // {kv:[[rótulo, valor],...]}, {tabela:{cab:[...], linhas:[[...]...], larguras?}}, {lista:[...]}, {quebra:true}
  function anexoA(r, d) {
    const linhasPreco = r.grupos.map((g) => [`Aluguel — ${g.nome} (${g.noites} ${g.noites > 1 ? "diárias" : "diária"} × ${money(g.diaria)})`, money(g.subtotal)]);
    linhasPreco.push(["Limpeza final", money(r.limpeza)]);
    if (r.desconto) linhasPreco.push(["Desconto", "− " + money(r.desconto)]);
    linhasPreco.push(["Total da locação, sem caução", money(r.total)]);
    return [
      { titulo: "Anexo A — Resumo da reserva e condições comerciais" },
      { kv: [
        ["Reserva nº", d.codigo],
        ["Locatário", `${d.nome || "—"} · ${d.telefone || "—"}`],
        ["Entrada", `${br(r.entrada)} às ${C.checkin}`],
        ["Saída", `${br(r.saida)} às ${C.checkout}`],
        ["Diárias", String(r.noites)],
        ["Ocupação contratada", `${d.adultos} adulto(s) e ${d.criancas} criança(s) — capacidade máxima ${C.capacidade}`],
        ["Chegada prevista", d.horaChegada || "a combinar"],
        ["Veículos", d.veiculos || "0"],
        ["Contato de emergência", d.emergencia || "não informado"],
      ] },
      { h: "Composição do preço" },
      { tabela: { cab: ["Descrição", "Valor"], linhas: linhasPreco, larguras: ["*", "auto"], destaqueUltima: true } },
      { p: `Consumo: ${C.precos.consumo}. Cobranças adicionais exigem hipótese e valor previamente definidos; campos vazios não autorizam cobrança.` },
      { h: "Pagamentos" },
      { tabela: { cab: ["Parcela", "Vencimento", "Valor"], linhas: r.parcelas.map((p) => [`${p.rotulo} (${p.pct}%)`, br(p.vence), money(p.valor)]), larguras: ["*", "auto", "auto"] } },
      { p: `Forma de pagamento: ${C.precos.forma}. O sinal é antecipação do preço, sem natureza de arras, e será abatido do total. Cada pagamento terá recibo discriminado.` },
      { p: `Validade desta proposta: ${C.precos.validadeProposta}. Condição para confirmar a reserva: ${C.precos.condicaoConfirmacao}.` },
      { h: "Garantia" },
      { p: r.caucao
        ? `Caução em dinheiro, como única modalidade de garantia, no valor de ${money(r.caucao)}, paga junto com o saldo do preço e registrada em recibo próprio, separado do aluguel. Acerto e devolução em até ${C.prazoCaucao}, por ${C.meioDevolucaoCaucao}, conforme a cláusula 5.`
        : "Sem garantia." },
      { h: "Cancelamento" },
      { p: `Canal para pedir cancelamento: ${C.canalCancelamento}.` },
      { tabela: { cab: ["Quando", "Multa ou retenção"], linhas: C.cancelamento.map((c) => [c.quando, c.regra]), larguras: ["*", "*"] } },
      { p: `Multa integral para saída antecipada: ${C.multaSaidaAntecipada}, reduzida proporcionalmente aos dias não usados (cláusula 6). Restituição de saldo em cancelamento: ${C.prazoRestituicao}. Restituição se o imóvel ficar indisponível por causa do locador: ${C.prazoIndisponibilidade}. Remarcação: ${C.remarcacao}.` },
    ];
  }

  function anexoB() {
    const out = [{ titulo: "Anexo B — Regulamento da casa" }];
    C.regulamento.forEach((s) => { out.push({ h: s.titulo }); out.push({ lista: s.itens }); });
    return out;
  }

  function anexoC() {
    const out = [
      { titulo: "Anexo C — Inventário" },
      { p: "Bens entregues com a casa. O estado de cada item na entrada e na saída é registrado na vistoria presencial, com fotos identificadas pelo código da reserva. Desgaste normal e defeitos anteriores não são cobrados." },
    ];
    const linhas = [];
    C.inventario.forEach((a) => a.itens.forEach(([n, q], i) => linhas.push([i === 0 ? a.ambiente : "", n, String(q)])));
    out.push({ tabela: { cab: ["Ambiente", "Item", "Qtd"], linhas, larguras: ["auto", "*", "auto"] } });
    out.push({ p: `Chaves e controles: ${C.chaves}.` });
    return out;
  }

  function guia() {
    const g = C.guia;
    return [
      { titulo: "Guia do hóspede" },
      { h: "Como chegar" },
      { p: `${C.endereco}. ${g.chegada}` },
      { h: "Entrada e saída" },
      { p: `Entrada a partir das ${C.checkin}. Saída até as ${C.checkout}. ${g.chaves}` },
      { h: "Na casa" },
      { kv: [["Wi-Fi", g.wifi], ["Quadro elétrico", g.quadroEletrico], ["Registro de água", g.registroAgua]] },
      { h: "Emergências" },
      { kv: g.emergencias },
      { h: "Antes de sair" },
      { lista: g.saida },
    ];
  }

  function contrato(r, d) {
    const L = C.locador;
    const caucaoTxt = r.caucao
      ? `As partes pactuam caução em dinheiro de ${money(r.caucao)}, como única modalidade de garantia, que não se confunde com aluguel ou taxa. A caução respeita o limite de três meses de aluguel e será depositada em caderneta de poupança, com rendimentos em benefício do LOCATÁRIO.`
      : "Esta locação não tem garantia.";
    return [
      { titulo: "Contrato de locação por temporada" },
      { p: `${C.nome} · Tabatinga II · Conde - PB · Reserva nº ${d.codigo}` },

      { h: "1. Identificação das partes" },
      { p: `LOCADOR: ${L.nome}, ${L.qualificacao}, com sede na ${L.sede}. Contato: WhatsApp ${C.whatsappExibicao}.` },
      { p: `LOCATÁRIO: ${d.nome}, ${d.tipoDoc === "passaporte" ? "passaporte" : "CPF"} ${d.documento}, residente em ${d.endereco}. Telefone ${d.telefone}. E-mail ${d.email}.` },

      { h: "2. Imóvel e finalidade" },
      { p: `O LOCADOR cede ao LOCATÁRIO o uso temporário da ${C.nome}, na ${C.endereco} (${C.referencia}), para lazer e residência temporária, nas condições deste contrato. O LOCADOR declara ter legitimidade para disponibilizar o imóvel.` },
      { p: `Ambientes incluídos: ${C.ambientesIncluidos}. Áreas excluídas: ${C.areasExcluidas}. O imóvel será entregue com os bens relacionados no Anexo C — Inventário.` },

      { h: "3. Período e ocupação" },
      { p: `Entrada em ${br(r.entrada)} às ${C.checkin}. Saída em ${br(r.saida)} às ${C.checkout}. Duração de ${r.noites} ${r.noites > 1 ? "diárias" : "diária"}, limitada a 90 dias. Motivo: lazer. Capacidade máxima de ${C.capacidade} pessoas, incluindo crianças. Ocupação contratada: ${Number(d.adultos) + Number(d.criancas)} pessoas, relacionadas abaixo.` },
      { tabela: { cab: ["Hóspede", "Adulto ou idade", "Responsável, se menor"], linhas: d.hospedesLista.map((h) => [h.nome, h.idade, h.responsavel || "—"]), larguras: ["*", "auto", "*"] } },
      { p: "Mudanças de ocupação, cessão, empréstimo ou sublocação exigem autorização prévia e escrita do LOCADOR. A prorrogação exige ajuste escrito. A retomada seguirá os meios legais, inclusive o art. 50 da Lei nº 8.245/1991; não se admite retirada forçada, troca de fechaduras ou retenção de bens." },

      { h: "4. Preço e vencimentos" },
      { p: `Aluguel do período: ${money(r.aluguel)}. Limpeza final: ${money(r.limpeza)}. Desconto: ${money(r.desconto)}. Total da locação, sem caução: ${money(r.total)}. Parcelas, vencimentos, forma de pagamento e consumo constam do Anexo A. O pagamento inicial é antecipação do preço, sem natureza de arras. Cada recebimento terá recibo discriminado.` },

      { h: "5. Garantia" },
      { p: caucaoTxt },
      ...(r.caucao ? [{ p: `O acerto ocorrerá em até ${C.prazoCaucao}, com demonstrativo e comprovantes. Descontos exigem vínculo com obrigação contratual ou dano imputável ao LOCATÁRIO; desgaste normal e defeitos anteriores não serão cobrados. A parte incontroversa será devolvida no prazo. Divergências serão registradas, sem quitação presumida.` }] : []),

      { h: "6. Cancelamento e encerramento antecipado" },
      { p: "A política de cancelamento do Anexo A foi informada e aceita antes do pagamento. Na saída antecipada, a multa pactuada será proporcional ao período não cumprido: multa integral × dias restantes ÷ dias contratados. Valores pagos, encargos devidos e saldo a restituir serão discriminados, sem cobrança duplicada pelo mesmo fato." },
      { p: `Se o LOCADOR não puder disponibilizar o imóvel por causa a ele imputável, restituirá os valores recebidos, inclusive a caução, em ${C.prazoIndisponibilidade}, sem prejuízo dos direitos cabíveis. Outra acomodação só será aceita por acordo expresso. Impossibilidade de uso por caso fortuito ou força maior será avaliada conforme seus efeitos concretos, com comunicação imediata e acerto dos valores do período inviabilizado.` },

      { h: "7. Obrigações das partes" },
      { p: "O LOCADOR entregará a casa limpa e em condições de uso, informará defeitos e restrições conhecidos, fornecerá instruções de funcionamento e manterá contato para ocorrências. Responde pelas obrigações legais de conservação e por defeitos anteriores à locação." },
      { p: "O LOCATÁRIO pagará os valores ajustados, conservará o imóvel, seguirá o regulamento do Anexo B e comunicará danos ou falhas assim que os perceber. Responde pelos danos que lhe sejam imputáveis e pelos causados por seus acompanhantes e visitantes." },
      { p: "Reparos e vistorias durante a estadia terão horário combinado, salvo emergência. Não se autoriza acesso indiscriminado do LOCADOR." },

      { h: "8. Entrega e devolução" },
      { p: "Entrada e saída serão documentadas com o inventário, fotos identificadas e registro de chaves. Divergências devem ser comunicadas assim que identificadas; a falta de anotação inicial não afasta defeitos ocultos. A devolução considera o desgaste normal de uso." },

      { h: "9. Anexos, comunicações e dados pessoais" },
      { p: "Integram este contrato, no mesmo documento e com o mesmo código de reserva: Anexo A — Resumo da reserva e condições comerciais; Anexo B — Regulamento da casa; Anexo C — Inventário. O guia do hóspede contém instruções práticas e não cria cobranças nem altera o contrato." },
      { p: "Os contatos indicados na qualificação serão usados para avisos e envio de comprovantes. Alterações posteriores exigem acordo registrado entre as partes." },
      { p: `Os dados pessoais e as cópias de documento de identidade e comprovante de residência enviadas na ficha de reserva serão usados somente para identificar o LOCATÁRIO, gerir a reserva, cumprir deveres legais e exercer direitos, com acesso restrito, e eliminados em ${C.retencaoDocumentos}, salvo obrigação legal de guarda (Lei nº 13.709/2018).` },

      { h: "10. Solução de divergências" },
      { p: "As partes procurarão solução direta e documentada. Não havendo acordo, será observado o foro legalmente competente." },

      { h: "11. Aceite e assinatura" },
      { p: "As partes confirmam o preenchimento das condições, a leitura e o recebimento dos anexos, e que não restam condições comerciais essenciais em aberto. Este contrato é assinado eletronicamente pelas partes por meio do serviço de assinatura do gov.br, nos termos da Lei nº 14.063/2020." },
      { kv: [["Local e data", `Conde - PB, ${br(parseISO(d.dataContrato) || new Date())}`], ["LOCADOR", L.nome], ["LOCATÁRIO", d.nome]] },
      { p: "Assinaturas eletrônicas pelo gov.br nesta página." },

      { quebra: true }, ...anexoA(r, d),
      { quebra: true }, ...anexoB(),
      { quebra: true }, ...anexoC(),
    ];
  }

  /* ---------- Render HTML ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function toHTML(blocos) {
    return blocos.map((b) => {
      if (b.titulo) return `<h2 class="doc-titulo">${esc(b.titulo)}</h2>`;
      if (b.h) return `<h3 class="doc-h">${esc(b.h)}</h3>`;
      if (b.p) return `<p>${esc(b.p)}</p>`;
      if (b.lista) return `<ul>${b.lista.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      if (b.kv) return `<dl class="doc-kv">${b.kv.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
      if (b.tabela) {
        const t = b.tabela;
        return `<div class="doc-tabela"><table><thead><tr>${t.cab.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${t.linhas.map((l, i) => `<tr${t.destaqueUltima && i === t.linhas.length - 1 ? ' class="total"' : ""}>${l.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
      if (b.quebra) return `<hr class="doc-quebra">`;
      return "";
    }).join("\n");
  }

  /* ---------- Render PDF (pdfmake) ---------- */
  function toPDF(blocos, codigo, logo) {
    const content = [];
    if (logo) content.push({ image: logo, width: 150, alignment: "center", margin: [0, 0, 0, 14] });
    blocos.forEach((b) => {
      if (b.titulo) content.push({ text: b.titulo, style: "titulo" });
      else if (b.h) content.push({ text: b.h, style: "h" });
      else if (b.p) content.push({ text: b.p, style: "p" });
      else if (b.lista) content.push({ ul: b.lista, style: "p" });
      else if (b.kv) content.push({ table: { widths: ["auto", "*"], body: b.kv.map(([k, v]) => [{ text: k, bold: true }, v]) }, layout: "noBorders", style: "p" });
      else if (b.tabela) {
        const t = b.tabela;
        const tabela = {
          table: { headerRows: 1, widths: t.larguras || t.cab.map(() => "*"), body: [t.cab.map((c) => ({ text: c, bold: true, fillColor: "#E6DED1" })), ...t.linhas.map((l, i) => l.map((c) => ({ text: c, bold: t.destaqueUltima && i === t.linhas.length - 1 })))] },
          layout: { hLineColor: "#D3C2A6", vLineColor: "#D3C2A6", hLineWidth: () => 0.5, vLineWidth: () => 0.5, paddingTop: () => 4, paddingBottom: () => 4 },
          style: "p",
        };
        content.push(t.linhas.length <= 15 ? { stack: [tabela], unbreakable: true } : tabela);
      } else if (b.quebra) content.push({ text: "", pageBreak: "after" });
    });
    return {
      info: { title: `Contrato ${codigo} — ${C.nome}` },
      pageSize: "A4",
      pageMargins: [56, 64, 56, 56],
      header: (page) => ({ text: `${C.nome} · Reserva ${codigo}`, alignment: "right", margin: [56, 28, 56, 0], fontSize: 8, color: "#6D8D8A" }),
      footer: (page, pages) => ({ text: `Página ${page} de ${pages}`, alignment: "center", fontSize: 8, color: "#6D8D8A", margin: [0, 16, 0, 0] }),
      content,
      styles: {
        titulo: { fontSize: 16, bold: true, color: "#7A6548", margin: [0, 0, 0, 10] },
        h: { fontSize: 11, bold: true, color: "#3E5554", margin: [0, 10, 0, 4] },
        p: { fontSize: 9.5, lineHeight: 1.3, margin: [0, 0, 0, 6] },
      },
      defaultStyle: { font: "Roboto", color: "#3E5554" },
    };
  }

  /* Logo para o PDF (carregada uma vez; sem logo, o PDF sai mesmo assim) */
  let logoCache = null;
  async function logoPDF() {
    if (logoCache !== null) return logoCache;
    try {
      const b = await (await fetch("assets/marca/logo-pdf.png")).blob();
      logoCache = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(""); fr.readAsDataURL(b); });
    } catch { logoCache = ""; }
    return logoCache;
  }

  /* ---------- Modal de documento ---------- */
  function abrirDocumento(titulo, blocos) {
    let dlg = document.getElementById("doc-modal");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "doc-modal";
      dlg.className = "doc-modal";
      dlg.innerHTML = `<div class="doc-modal-barra"><strong id="doc-modal-titulo"></strong><button type="button" class="btn-fechar" id="doc-modal-fechar">Fechar</button></div><div class="doc doc-modal-corpo" id="doc-modal-corpo"></div>`;
      document.body.appendChild(dlg);
      dlg.querySelector("#doc-modal-fechar").addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    }
    dlg.querySelector("#doc-modal-titulo").textContent = titulo;
    dlg.querySelector("#doc-modal-corpo").innerHTML = toHTML(blocos.filter((b) => !b.titulo));
    dlg.showModal();
    dlg.querySelector("#doc-modal-corpo").scrollTop = 0;
  }

  /* ---------- Faixa de teste ---------- */
  function faixaTeste() {
    if (!C.emTeste) return;
    const f = document.createElement("div");
    f.className = "faixa-teste";
    f.textContent = "Versão de teste: preços, regras e contato são exemplos até a família confirmar.";
    document.body.prepend(f);
  }

  window.MDM = { C, money, parseISO, iso, br, brLong, addDays, orcamento, zap, codigoReserva, contrato, anexoA, anexoB, anexoC, guia, toHTML, toPDF, logoPDF, abrirDocumento, faixaTeste, esc };
})();
