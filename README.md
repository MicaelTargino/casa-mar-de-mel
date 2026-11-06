# Casa Mar de Mel — site de aluguel direto

Protótipo do site da casa de praia em Tabatinga II, Conde - PB. Ele substitui os 7 PDFs do Drive
(contrato, ficha, resumo, regulamento, inventário, recibos e guia), que repetiam as mesmas informações.

## Páginas

| Página | Para quem | O que faz |
|---|---|---|
| `site/index.html` | quem está pesquisando | fotos da casa e da região, informações, orçamento por período, WhatsApp |
| `site/link.html` | a família | escolhe datas, pessoas e desconto e gera o link de reserva para mandar ao cliente |
| `site/reserva.html` | o cliente que já fechou | ficha, envio de documentos, revisão do contrato, PDF para assinar no gov.br |

O contrato em PDF já leva os anexos A (resumo e condições), B (regulamento) e C (inventário) no
mesmo arquivo, então uma assinatura cobre tudo.

## Marca

Logo, selo e paleta oficial em `site/assets/marca/` (recortados do manual de marca). Cores:
`#E6DED1` `#D3C2A6` `#B89E74` `#A8C1B7` `#6D8D8A` `#3E5554`, definidas uma vez no topo de
`site/assets/style.css`. Títulos em Cormorant Garamond, como a logo.

## Recebimento das reservas

O site envia a ficha, os documentos e o contrato para um Google Apps Script na conta da casa,
que guarda tudo numa pasta privada do Drive e numa planilha (ver `apps-script/LEIAME.md`).
Enquanto `envioUrl` estiver vazio em `config.js`, o site oferece o envio pelo WhatsApp no lugar.

## Onde editar

Tudo fica em **`site/assets/config.js`**: preços, temporadas, caução, cancelamento, regras,
inventário, guia, fotos e WhatsApp. Cada informação aparece uma vez só. Os campos marcados
`// EXEMPLO` ainda não foram definidos pela família.

## Rodar localmente

```bash
cd site && python3 -m http.server 8000
# abrir http://localhost:8000
```

## O que ainda falta para usar com clientes

- Definir os valores marcados `// EXEMPLO` (principalmente o WhatsApp, preços, cancelamento e inventário real) e depois mudar `emTeste` para `false`.
- Hospedagem: no ar em https://micaeltargino.github.io/casa-mar-de-mel/ (GitHub Pages, publica a cada push na `main`).
- Instalar o Apps Script na conta da casa e preencher `envioUrl` (passo a passo em `apps-script/LEIAME.md`).
- Calendário: se a casa continuar no Airbnb, sincronizar o calendário (iCal) para não alugar a mesma data duas vezes.
- Revisão jurídica do contrato preenchido antes do primeiro uso, como o próprio modelo original recomenda.

Fotos: baixadas do anúncio do Airbnb (`fotos/casa`, `fotos/regiao`), com miniaturas em `fotos/mini`.
