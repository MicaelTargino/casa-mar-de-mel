/**
 * Casa Mar de Mel — recebe as reservas do site e guarda no Google Drive da casa.
 *
 * O que faz:
 *  - recebe a ficha, o documento com foto, o comprovante de residência e o contrato gerado;
 *  - cria uma pasta privada por reserva em "Reservas Casa Mar de Mel" e registra numa planilha;
 *  - recebe depois o contrato assinado pelo cliente na mesma pasta;
 *  - avisa por e-mail a cada envio;
 *  - assina os links de reserva (para ninguém mudar data ou desconto editando o link);
 *  - apaga as pastas e os dados pessoais depois do prazo de guarda (LGPD).
 *
 * Instalação: ver apps-script/LEIAME.md
 */

const CONFIG = {
  // Troque antes de rodar instalar(). É a senha que a família digita em link.html.
  SENHA_FAMILIA: 'TROQUE-ESTA-SENHA',
  EMAIL_AVISO: '', // vazio = e-mail da conta que instalou o script
  PASTA_RAIZ: 'Reservas Casa Mar de Mel',
  PLANILHA: 'Reservas — Casa Mar de Mel',
  RETENCAO_DIAS_APOS_SAIDA: 180,
  MAX_ARQUIVO_MB: 8,
  MAX_ENVIOS_POR_HORA: 30,
  MAX_SENHA_ERRADA_POR_HORA: 10,
};

const TIPOS_ACEITOS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

const COLUNAS = ['Recebido em', 'Código', 'Status', 'Responsável', 'CPF ou passaporte', 'Telefone', 'E-mail',
  'Entrada', 'Saída', 'Pessoas', 'Total', 'Link conferido', 'Pasta', 'id'];

/* ================= Entrada HTTP ================= */

function doGet() {
  return json_({ ok: true, servico: 'Casa Mar de Mel' });
}

function doPost(e) {
  try {
    const corpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (corpo.site) throw erro_('Envio recusado.'); // campo isca contra robôs
    switch (corpo.acao) {
      case 'enviarReserva': return json_(enviarReserva_(corpo));
      case 'enviarAssinado': return json_(enviarAssinado_(corpo));
      case 'conferirLink': return json_({ ok: true, valido: linkValido_(corpo.link) });
      case 'assinarLink': return json_(assinarLink_(corpo));
      default: throw erro_('Ação desconhecida.');
    }
  } catch (err) {
    if (!err.mensagem) console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, erro: err.mensagem || 'Não foi possível concluir o envio. Tente de novo em alguns minutos.' });
  }
}

/* ================= Ações ================= */

function enviarReserva_(c) {
  contarNaHora_('envios', CONFIG.MAX_ENVIOS_POR_HORA, 'Muitos envios nesta hora. Tente de novo mais tarde ou fale pelo WhatsApp.');

  const codigo = texto_(c.codigo, 30);
  if (!/^MDM-\d{6}-[A-Z]{1,4}$/.test(codigo)) throw erro_('Código de reserva inválido.');
  const d = c.dados || {};
  const dados = {
    nome: obrigatorio_(d.nome, 120, 'nome'),
    tipoDoc: d.tipoDoc === 'passaporte' ? 'passaporte' : 'CPF',
    documento: obrigatorio_(d.documento, 30, 'documento'),
    endereco: obrigatorio_(d.endereco, 250, 'endereço'),
    telefone: obrigatorio_(d.telefone, 30, 'telefone'),
    email: obrigatorio_(d.email, 120, 'e-mail'),
    entrada: data_(d.entrada, 'entrada'),
    saida: data_(d.saida, 'saída'),
    adultos: inteiro_(d.adultos, 1, 12),
    criancas: inteiro_(d.criancas, 0, 11),
    horaChegada: texto_(d.horaChegada, 10),
    veiculos: texto_(d.veiculos, 3),
    emergencia: texto_(d.emergencia, 120),
    pet: texto_(d.pet, 10),
    total: texto_(d.total, 30),
    hospedes: (Array.isArray(d.hospedes) ? d.hospedes : []).slice(0, 12).map(function (h) {
      return { nome: texto_(h && h.nome, 120), idade: texto_(h && h.idade, 20), responsavel: texto_(h && h.responsavel, 120) };
    }),
  };

  const link = c.link || {};
  const conferido = linkValido_(link) && link.entrada === dados.entrada && link.saida === dados.saida &&
    String(link.adultos) === String(dados.adultos) && String(link.criancas) === String(dados.criancas);

  const contrato = arquivo_(c.contrato, 'contrato', ['application/pdf']);
  const docFoto = arquivo_(c.documento, 'documento com foto');
  const comprovante = arquivo_(c.comprovante, 'comprovante de residência');

  const pasta = pastaRaiz_().createFolder(codigo + ' · ' + dados.nome);
  pasta.createFile(contrato.blob.setName('1 Contrato para assinar — ' + codigo + '.pdf'));
  pasta.createFile(docFoto.blob.setName('2 Documento com foto.' + docFoto.ext));
  pasta.createFile(comprovante.blob.setName('3 Comprovante de residência.' + comprovante.ext));
  pasta.createFile('Ficha — ' + codigo + '.txt', fichaTexto_(codigo, dados, conferido), 'text/plain');

  const id = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('tok:' + id, JSON.stringify({ pastaId: pasta.getId(), codigo: codigo, saida: dados.saida }));

  const pessoas = dados.adultos + dados.criancas;
  comTrava_(function () {
    planilha_().appendRow([new Date(), codigo, 'Ficha recebida', dados.nome, dados.tipoDoc + ' ' + dados.documento, dados.telefone,
      dados.email, dados.entrada, dados.saida, pessoas, dados.total, conferido ? 'Sim' : 'NÃO — confira datas e valores', pasta.getUrl(), id]);
  });

  avisar_('Nova reserva ' + codigo + ' — ' + dados.nome,
    'Chegou uma ficha de reserva pelo site.\n\n' + fichaTexto_(codigo, dados, conferido) +
    '\n\nPasta com os documentos: ' + pasta.getUrl() +
    '\n\nO cliente ainda vai assinar o contrato no gov.br e enviar a via assinada.');

  return { ok: true, token: id, codigo: codigo };
}

function enviarAssinado_(c) {
  contarNaHora_('envios', CONFIG.MAX_ENVIOS_POR_HORA, 'Muitos envios nesta hora. Tente de novo mais tarde ou fale pelo WhatsApp.');
  const id = texto_(c.token, 60);
  const reg = PropertiesService.getScriptProperties().getProperty('tok:' + id);
  if (!id || !reg) throw erro_('Não encontramos esta reserva. Envie o contrato assinado pelo WhatsApp.');
  const r = JSON.parse(reg);
  const assinado = arquivo_(c.arquivo, 'contrato assinado', ['application/pdf']);
  const pasta = DriveApp.getFolderById(r.pastaId);
  const carimbo = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH-mm');
  pasta.createFile(assinado.blob.setName('4 Contrato assinado pelo cliente — ' + r.codigo + ' (' + carimbo + ').pdf'));

  comTrava_(function () { atualizarStatus_(id, 'Assinado pelo cliente — falta a assinatura da casa'); });
  avisar_('Contrato assinado ' + r.codigo,
    'O cliente enviou o contrato assinado da reserva ' + r.codigo + '.\n\nPasta: ' + pasta.getUrl() +
    '\n\nConfira no assinador do gov.br (validar.iti.gov.br), assine pela casa e devolva a via final ao cliente.');
  return { ok: true };
}

function assinarLink_(c) {
  if (String(c.senha || '') !== CONFIG.SENHA_FAMILIA || CONFIG.SENHA_FAMILIA === 'TROQUE-ESTA-SENHA') {
    contarNaHora_('senha', CONFIG.MAX_SENHA_ERRADA_POR_HORA, 'Muitas tentativas de senha. Espere uma hora.');
    throw erro_('Senha da família incorreta.');
  }
  return { ok: true, c: assinatura_(c.link || {}) };
}

/* ================= Link conferido ================= */

function mensagemLink_(l) {
  return [l.entrada, l.saida, l.adultos, l.criancas, l.desconto || 0].map(function (x) { return String(x == null ? '' : x); }).join('|');
}

function assinatura_(l) {
  const segredo = PropertiesService.getScriptProperties().getProperty('SEGREDO_LINK');
  if (!segredo) throw erro_('O script ainda não foi instalado.');
  const bytes = Utilities.computeHmacSha256Signature(mensagemLink_(l), segredo);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '').slice(0, 22);
}

function linkValido_(l) {
  if (!l || !l.c || !l.entrada || !l.saida) return false;
  return String(l.c) === assinatura_(l);
}

/* ================= Limpeza (LGPD) ================= */

function limparAntigas() {
  const props = PropertiesService.getScriptProperties();
  const hoje = new Date();
  const todas = props.getProperties();
  Object.keys(todas).forEach(function (k) {
    if (k.indexOf('tok:') !== 0) return;
    const r = JSON.parse(todas[k]);
    const limite = new Date(r.saida + 'T12:00:00');
    limite.setDate(limite.getDate() + CONFIG.RETENCAO_DIAS_APOS_SAIDA);
    if (hoje < limite) return;
    try { DriveApp.getFolderById(r.pastaId).setTrashed(true); } catch (err) { console.warn('Pasta já removida: ' + r.codigo); }
    comTrava_(function () { apagarDadosPessoais_(k.slice(4)); });
    props.deleteProperty(k);
  });
}

/* ================= Instalação ================= */

function instalar() {
  if (CONFIG.SENHA_FAMILIA === 'TROQUE-ESTA-SENHA' || CONFIG.SENHA_FAMILIA.length < 8) {
    throw new Error('Antes de instalar, troque SENHA_FAMILIA no topo do arquivo por uma senha com pelo menos 8 caracteres.');
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SEGREDO_LINK')) props.setProperty('SEGREDO_LINK', Utilities.getUuid() + Utilities.getUuid());
  pastaRaiz_();
  planilha_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'limparAntigas') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('limparAntigas').timeBased().everyDays(1).atHour(3).create();
  console.log('Instalado. Pasta: ' + pastaRaiz_().getUrl() + ' · Planilha: ' + planilha_().getParent().getUrl());
}

/* ================= Apoio ================= */

function pastaRaiz_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PASTA_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recria abaixo */ } }
  const pasta = DriveApp.createFolder(CONFIG.PASTA_RAIZ);
  props.setProperty('PASTA_ID', pasta.getId());
  return pasta;
}

function planilha_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PLANILHA_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) { /* recria abaixo */ } }
  const ss = SpreadsheetApp.create(CONFIG.PLANILHA);
  DriveApp.getFileById(ss.getId()).moveTo(pastaRaiz_());
  const aba = ss.getSheets()[0];
  aba.setName('Reservas');
  aba.appendRow(COLUNAS);
  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
  aba.hideColumns(COLUNAS.length);
  props.setProperty('PLANILHA_ID', ss.getId());
  return aba;
}

function linhaPorId_(id) {
  const aba = planilha_();
  const n = aba.getLastRow();
  if (n < 2) return 0;
  const ids = aba.getRange(2, COLUNAS.length, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function atualizarStatus_(id, status) {
  const linha = linhaPorId_(id);
  if (linha) planilha_().getRange(linha, COLUNAS.indexOf('Status') + 1).setValue(status);
}

function apagarDadosPessoais_(id) {
  const linha = linhaPorId_(id);
  if (!linha) return;
  const aba = planilha_();
  ['CPF ou passaporte', 'Telefone', 'E-mail', 'Pasta'].forEach(function (col) {
    aba.getRange(linha, COLUNAS.indexOf(col) + 1).setValue('');
  });
  aba.getRange(linha, COLUNAS.indexOf('Status') + 1).setValue('Dados pessoais apagados (prazo de guarda)');
}

function arquivo_(a, rotulo, tipos) {
  if (!a || !a.base64 || !a.tipo) throw erro_('Faltou enviar o ' + rotulo + '.');
  const tipo = String(a.tipo).toLowerCase();
  const permitidos = tipos || Object.keys(TIPOS_ACEITOS);
  if (permitidos.indexOf(tipo) === -1) throw erro_('O ' + rotulo + ' precisa ser imagem (JPG, PNG) ou PDF.');
  const bytes = Utilities.base64Decode(a.base64);
  if (bytes.length > CONFIG.MAX_ARQUIVO_MB * 1024 * 1024) throw erro_('O ' + rotulo + ' passou de ' + CONFIG.MAX_ARQUIVO_MB + ' MB.');
  if (!conteudoConfere_(bytes, tipo)) throw erro_('O arquivo do ' + rotulo + ' não parece ser ' + (tipo === 'application/pdf' ? 'um PDF' : 'uma imagem') + '.');
  return { blob: Utilities.newBlob(bytes, tipo), ext: TIPOS_ACEITOS[tipo] };
}

function conteudoConfere_(b, tipo) {
  const u = function (i) { return (b[i] + 256) % 256; };
  if (b.length < 12) return false;
  if (tipo === 'application/pdf') return u(0) === 0x25 && u(1) === 0x50 && u(2) === 0x44 && u(3) === 0x46; // %PDF
  if (tipo === 'image/jpeg') return u(0) === 0xFF && u(1) === 0xD8;
  if (tipo === 'image/png') return u(0) === 0x89 && u(1) === 0x50;
  if (tipo === 'image/webp') return u(0) === 0x52 && u(8) === 0x57; // RIFF....WEBP
  return u(4) === 0x66 && u(5) === 0x74; // HEIC/HEIF: ....ftyp
}

function fichaTexto_(codigo, d, conferido) {
  const linhas = [
    'Reserva: ' + codigo,
    'Link conferido: ' + (conferido ? 'sim' : 'NÃO — confira datas e valores no contrato antes de assinar'),
    '',
    'Responsável: ' + d.nome,
    d.tipoDoc + ': ' + d.documento,
    'Endereço: ' + d.endereco,
    'Telefone: ' + d.telefone,
    'E-mail: ' + d.email,
    '',
    'Entrada: ' + d.entrada + ' · Saída: ' + d.saida,
    'Adultos: ' + d.adultos + ' · Crianças: ' + d.criancas,
    'Total informado no contrato: ' + d.total,
    'Chegada prevista: ' + (d.horaChegada || 'a combinar') + ' · Carros: ' + (d.veiculos || '0') + ' · Animal: ' + (d.pet || 'não'),
    'Contato de emergência: ' + (d.emergencia || 'não informado'),
    '',
    'Hóspedes:',
  ];
  d.hospedes.forEach(function (h, i) {
    linhas.push('  ' + (i + 1) + '. ' + h.nome + ' — ' + h.idade + (h.responsavel ? ' (responsável: ' + h.responsavel + ')' : ''));
  });
  return linhas.join('\n');
}

function avisar_(assunto, corpo) {
  const para = CONFIG.EMAIL_AVISO || Session.getEffectiveUser().getEmail();
  try { MailApp.sendEmail(para, assunto, corpo); } catch (e) { console.warn('E-mail não enviado: ' + e); }
}

function contarNaHora_(nome, max, mensagem) {
  const cache = CacheService.getScriptCache();
  const chave = nome + ':' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  const n = Number(cache.get(chave) || 0) + 1;
  cache.put(chave, String(n), 3600);
  if (n > max) throw erro_(mensagem);
}

function comTrava_(fn) {
  const trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try { return fn(); } finally { trava.releaseLock(); }
}

function texto_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function obrigatorio_(v, max, rotulo) { const t = texto_(v, max); if (!t) throw erro_('Faltou preencher: ' + rotulo + '.'); return t; }
function inteiro_(v, min, max) { const n = Math.floor(Number(v)); if (!(n >= min && n <= max)) throw erro_('Número de pessoas inválido.'); return n; }
function data_(v, rotulo) { const t = texto_(v, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) throw erro_('Data de ' + rotulo + ' inválida.'); return t; }
function erro_(mensagem) { const e = new Error(mensagem); e.mensagem = mensagem; return e; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
