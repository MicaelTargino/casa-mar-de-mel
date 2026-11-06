# Recebimento de reservas no Google Drive

O arquivo `Code.gs` é um Google Apps Script que roda na conta **casamardemeltabatinga@gmail.com**.
Ele recebe o que o cliente envia pelo site e guarda tudo no Drive da casa:

```
Meu Drive/
  Reservas Casa Mar de Mel/
    Reservas — Casa Mar de Mel      ← planilha com uma linha por reserva
    MDM-261212-SOUZ · Ana Maria Souza/
      1 Contrato para assinar — MDM-261212-SOUZ.pdf
      2 Documento com foto.jpg
      3 Comprovante de residência.pdf
      4 Contrato assinado pelo cliente — MDM-261212-SOUZ (…).pdf
      Ficha — MDM-261212-SOUZ.txt
```

A cada envio, chega um e-mail na conta da casa. Todo dia, às 3h, o script apaga as pastas de
reservas cuja saída foi há mais de 180 dias e limpa CPF, telefone e e-mail da planilha (LGPD).

## Instalar (uma vez, uns 10 minutos)

1. Entre em <https://script.google.com> com a conta **casamardemeltabatinga@gmail.com** e clique em **Novo projeto**.
2. Dê o nome **Casa Mar de Mel — Reservas** (clicando em "Projeto sem título").
3. Apague o conteúdo do arquivo `Código.gs` e cole o conteúdo inteiro de `apps-script/Code.gs`.
4. No topo do arquivo, troque `SENHA_FAMILIA: 'TROQUE-ESTA-SENHA'` por uma senha com pelo menos 8 caracteres.
   É a senha que a família digita na página **Gerar link de reserva**. Salve (ícone de disquete).
5. Na barra de cima, escolha a função **instalar** e clique em **Executar**.
   - O Google pede autorização. Clique em **Revisar permissões**, escolha a conta da casa,
     depois **Avançado** → **Acessar Casa Mar de Mel — Reservas (não seguro)** → **Permitir**.
     O aviso de "não verificado" aparece porque o script é seu, não de uma empresa publicada.
   - O script pede acesso ao Drive, às Planilhas, ao Gmail (só para enviar o aviso) e aos gatilhos.
   - No registro de execução aparecem os links da pasta e da planilha criadas.
6. Clique em **Implantar** → **Nova implantação** → engrenagem → **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - Clique em **Implantar** e copie o **URL do app da Web** (termina em `/exec`).
7. Coloque essa URL em `site/assets/config.js`, no campo `envioUrl`, e publique o site.
   Para testar, abra a URL no navegador: deve aparecer `{"ok":true,"servico":"Casa Mar de Mel"}`.

## Atualizar o script depois

Cole a versão nova em `Código.gs`, salve e vá em **Implantar** → **Gerenciar implantações** →
lápis → Versão: **Nova versão** → **Implantar**. A URL continua a mesma.

## Segurança

- A URL do script é pública (precisa ser, para o site enviar), por isso o script só aceita imagem ou PDF
  com no máximo 8 MB, confere se o arquivo é mesmo o que diz ser, limita a 30 envios por hora e tem um
  campo-isca contra robôs.
- A pasta e a planilha não são compartilhadas com ninguém. Não compartilhe a pasta "Reservas" por link.
- O link de reserva leva um código de conferência gerado com a senha da família. Se alguém mudar
  datas, pessoas ou desconto no link, o site bloqueia o formulário, e a planilha marca a reserva
  como "NÃO conferido".
- Para trocar a senha, edite `SENHA_FAMILIA`, salve e publique uma nova versão.
