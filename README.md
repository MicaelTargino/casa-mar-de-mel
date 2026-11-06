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
- Hospedagem (por exemplo GitHub Pages ou Cloudflare Pages, de graça para o site estático).
- **Envio dos documentos**: no protótipo, os arquivos ficam só no aparelho do cliente. Para recebê-los de verdade, é preciso um armazenamento privado (por exemplo um bucket com acesso restrito) com exclusão automática, por causa da LGPD.
- Calendário: se a casa continuar no Airbnb, sincronizar o calendário (iCal) para não alugar a mesma data duas vezes.
- Revisão jurídica do contrato preenchido antes do primeiro uso, como o próprio modelo original recomenda.

Fotos: baixadas do anúncio do Airbnb (`fotos/casa`, `fotos/regiao`), com miniaturas em `fotos/mini`.
