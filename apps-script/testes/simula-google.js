// Simula os serviços do Google para testar Code.gs no Node.
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const src = fs.readFileSync(process.argv[2], 'utf8').replace("SENHA_FAMILIA: 'TROQUE-ESTA-SENHA'", "SENHA_FAMILIA: 'senha-teste-123'");
const props = {}, cache = {}, mails = [], arquivos = [], linhas = [];
let pid = 0;
const mkFolder = (name) => { const f = { id: 'f' + (++pid), name, trashed: false, files: [],
  getId: () => f.id, getUrl: () => 'https://drive/' + f.id, getName: () => f.name,
  createFolder: (n) => { const c = mkFolder(n); return c; },
  createFile: (a, b, t) => { const file = typeof a === 'string' ? { name: a, size: b.length } : { name: a.name, size: a.bytes.length, type: a.type }; f.files.push(file); arquivos.push(file); return file; },
  setTrashed: (v) => { f.trashed = v; } }; pastas[f.id] = f; return f; };
const pastas = {};
const sheet = { rows: [], appendRow(r) { this.rows.push(r); }, getLastRow() { return this.rows.length; },
  getRange(r, c, nr, nc) { const s = this; return { getValues: () => s.rows.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)), setValue: (v) => { s.rows[r - 1][c - 1] = v; }, setFontWeight() {} }; },
  setName() {}, setFrozenRows() {}, hideColumns() {}, getParent: () => ({ getUrl: () => 'https://sheets/ss1' }) };
const ctx = {
  console,
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    base64Decode: (s) => Array.from(Buffer.from(s, 'base64')).map((x) => (x > 127 ? x - 256 : x)),
    base64EncodeWebSafe: (b) => Buffer.from(b.map((x) => (x + 256) % 256)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    computeHmacSha256Signature: (m, k) => Array.from(crypto.createHmac('sha256', k).update(m).digest()).map((x) => (x > 127 ? x - 256 : x)),
    newBlob: (bytes, type) => { const b = { bytes, type, name: '', setName(n) { b.name = n; return b; } }; return b; },
    formatDate: (d) => d.toISOString().slice(0, 13),
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; }, getProperties: () => ({ ...props }), deleteProperty: (k) => delete props[k] }) },
  CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  DriveApp: { createFolder: (n) => mkFolder(n), getFolderById: (id) => { if (!pastas[id]) throw new Error('nf'); return pastas[id]; }, getFileById: () => ({ moveTo() {} }) },
  SpreadsheetApp: { create: () => ({ getId: () => 'ss1', getSheets: () => [sheet] }), openById: () => ({ getSheets: () => [sheet] }) },
  MailApp: { sendEmail: (to, s, b) => mails.push({ to, s, b }) },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'casa@example.com' }), getScriptTimeZone: () => 'America/Recife' },
  ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ create() {} }) }) }) }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) },
};
vm.createContext(ctx); vm.runInContext(src, ctx);
const post = (o) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).s);
const b64 = (buf) => Buffer.from(buf).toString('base64');
const pdf = { tipo: 'application/pdf', base64: b64(Buffer.from('%PDF-1.4 conteudo de teste')) };
const jpg = { tipo: 'image/jpeg', base64: b64(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8, 9])) };
const falsoPdf = { tipo: 'application/pdf', base64: b64(Buffer.from('<html>nao sou pdf</html>')) };

ctx.instalar();
const ok = (n, c) => console.log((c ? 'OK  ' : 'FALHA ') + n);
const link = { entrada: '2026-12-12', saida: '2026-12-17', adultos: 3, criancas: 1, desconto: 200 };
let r = post({ acao: 'assinarLink', senha: 'errada', link }); ok('senha errada recusada', !r.ok && /incorreta/.test(r.erro));
r = post({ acao: 'assinarLink', senha: 'senha-teste-123', link }); ok('link assinado', r.ok && r.c.length === 22);
const c = r.c;
ok('link válido', post({ acao: 'conferirLink', link: { ...link, c } }).valido === true);
ok('desconto alterado detectado', post({ acao: 'conferirLink', link: { ...link, desconto: 900, c } }).valido === false);
ok('sem código = inválido', post({ acao: 'conferirLink', link }).valido === false);
const dados = { nome: 'Ana Maria Souza', tipoDoc: 'cpf', documento: '529.982.247-25', endereco: 'Rua X, 1', telefone: '83 98888-7777', email: 'a@b.c', entrada: '2026-12-12', saida: '2026-12-17', adultos: '3', criancas: '1', total: 'R$ 6.400,00', hospedes: [{ nome: 'Ana', idade: 'Adulto' }, { nome: 'Pedro', idade: '7 anos', responsavel: 'Ana' }] };
r = post({ acao: 'enviarReserva', codigo: 'MDM-261212-SOUZ', link: { ...link, c }, dados, contrato: pdf, documento: jpg, comprovante: pdf });
ok('reserva recebida', r.ok && r.token);
const token = r.token;
ok('4 arquivos na pasta', arquivos.length === 4);
ok('linha na planilha com link conferido', sheet.rows.length === 2 && sheet.rows[1][11] === 'Sim');
ok('e-mail de aviso', mails.length === 1 && /MDM-261212-SOUZ/.test(mails[0].s));
r = post({ acao: 'enviarReserva', codigo: 'MDM-261212-SOUZ', link: { ...link, desconto: 900, c }, dados, contrato: pdf, documento: jpg, comprovante: pdf });
ok('link adulterado vira "NÃO conferido"', r.ok && /NÃO/.test(sheet.rows[2][11]));
r = post({ acao: 'enviarReserva', codigo: 'MDM-261212-SOUZ', link, dados, contrato: falsoPdf, documento: jpg, comprovante: pdf });
ok('arquivo que não é PDF recusado', !r.ok && /não parece/.test(r.erro));
r = post({ acao: 'enviarReserva', codigo: 'X', link, dados, contrato: pdf, documento: jpg, comprovante: pdf });
ok('código inválido recusado', !r.ok);
r = post({ acao: 'enviarReserva', site: 'robo', codigo: 'MDM-261212-SOUZ', link, dados, contrato: pdf, documento: jpg, comprovante: pdf });
ok('isca de robô recusada', !r.ok);
r = post({ acao: 'enviarAssinado', token, arquivo: pdf });
ok('contrato assinado recebido', r.ok && /Assinado/.test(sheet.rows[1][2]));
ok('token falso recusado', !post({ acao: 'enviarAssinado', token: 'xxx', arquivo: pdf }).ok);
// limpeza: força saída antiga
props['tok:' + token] = JSON.stringify({ ...JSON.parse(props['tok:' + token]), saida: '2020-01-01' });
ctx.limparAntigas();
const pasta = pastas[JSON.parse(JSON.stringify(Object.values(pastas).find((p) => p.name.startsWith('MDM')))).id];
ok('pasta antiga na lixeira', Object.values(pastas).some((p) => p.trashed));
ok('dados pessoais apagados da planilha', sheet.rows[1][4] === '' && /apagados/.test(sheet.rows[1][2]));
ok('token removido', !props['tok:' + token]);
for (let i = 0; i < 40; i++) post({ acao: 'enviarAssinado', token: 'x', arquivo: pdf });
ok('limite por hora', /Muitos envios/.test(post({ acao: 'enviarAssinado', token: 'x', arquivo: pdf }).erro));
