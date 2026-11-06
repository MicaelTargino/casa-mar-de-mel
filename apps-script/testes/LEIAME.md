# Testes do script de reservas

## `simula-google.js` — testa o `Code.gs` sem a conta Google

Imita DriveApp, SpreadsheetApp, PropertiesService, MailApp etc. e roda 19 verificações
(senha, link conferido, envio, arquivos falsos, isca de robô, contrato assinado, limpeza LGPD, limite por hora).

```bash
node apps-script/testes/simula-google.js apps-script/Code.gs
```

## `servidor-falso.py` — imita o Apps Script para testar o site no computador

```bash
python3 -I apps-script/testes/servidor-falso.py /tmp/recebidos   # ouve em 127.0.0.1:8790
cd site && python3 -m http.server 8765
```

Troque temporariamente `envioUrl` em `site/assets/config.js` por `http://127.0.0.1:8790/exec`
(não commitar). Senha aceita pelo servidor falso: `senha-teste-123`. Os arquivos recebidos
vão para a pasta passada como argumento.
