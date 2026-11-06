/*
 * Casa Mar de Mel — fonte única de informações.
 *
 * Tudo que se repetia nos 7 PDFs (endereço, locador, capacidade, preços,
 * regras, inventário, cancelamento, caução) mora AQUI, uma vez só.
 * O site, o orçamento, o contrato e os anexos leem deste arquivo.
 *
 * Campos marcados com  // EXEMPLO  ainda não foram definidos pela família
 * e precisam ser confirmados antes de usar o site com clientes reais.
 */
window.CASA = {
  emTeste: true, // mostra a faixa "valores de exemplo" no topo das páginas

  nome: "Casa Mar de Mel",
  chamada: "Pé na areia em Tabatinga",
  endereco: "Rua Ouricuri, Tabatinga II, Conde - PB, CEP 58322-000",
  referencia: "última casa da rua, à beira-mar",
  mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Ouricuri+Tabatinga+II+Conde+PB",
  airbnb: "https://www.airbnb.com.br/rooms/1785753726228145125",

  // URL do Apps Script (apps-script/LEIAME.md). Vazio = sem envio automático; o site oferece o WhatsApp.
  envioUrl: "https://script.google.com/macros/s/AKfycbxKyg5dpZwXiKl3cKOop4MNLWhhzWnQRk-C1pPIVApFvU5BxwqvxxYlszSM2zC4E45yFw/exec",

  whatsapp: "5583988278172", // número com DDI e DDD, só dígitos
  whatsappExibicao: "(83) 98827-8172",

  locador: {
    nome: "LUIZ FABIO TARGINO DE PAIVA CAVALCANTI",
    qualificacao: "empresa individual, CNPJ 03.768.213/0001-56",
    sede: "Rua Josemar Castro Barreto, 396, Bairro dos Estados, João Pessoa - PB, CEP 58030-227",
  },

  capacidade: 12,
  quartos: 3,
  camas: 8,
  banheiros: "3,5",
  checkin: "15:00",
  checkout: "11:00", // EXEMPLO — o anúncio só informa o check-in

  descricao: [
    "Viva dias inesquecíveis na Casa Mar de Mel, seu refúgio pé na areia em Tabatinga. Acorde com o som das ondas, tome café de frente para o mar e relaxe nas redes da varanda.",
    "Pé direito duplo, cozinha ampla integrada com terraço e sala. Sala com três ambientes. Mezanino, barzinho e suíte master no primeiro andar. Um terraço muito ventilado contorna a casa, bom para uma rede depois da praia. Todo o terraço tem vista para o mar, assim como as janelas da suíte master.",
  ],

  dormir: [
    { nome: "Quarto 1", camas: "1 cama de casal e 2 camas de solteiro" },
    { nome: "Quarto 2", camas: "1 cama queen" },
    { nome: "Suíte master", camas: "no primeiro andar, com janelas para o mar" }, // EXEMPLO — confirmar camas
  ],

  comodidades: [
    "Acesso direto à praia",
    "Wi-Fi",
    "Ar-condicionado",
    "Cozinha completa com geladeira, fogão e cafeteira",
    "Vasilhas, panelas, óleo, sal e pimenta",
    "Toalhas, lençóis, sabonete e papel higiênico",
    "Água quente e secador de cabelo",
    "TV",
    "Berço",
    "Ferro de passar",
    "Redes e móveis na área externa",
    "Estacionamento gratuito no local",
    "Câmeras na área externa (perímetro)",
  ],
  naoTem: ["Máquina de lavar", "Secadora", "Aquecedor"],

  // Áreas do contrato (cláusula 2)
  ambientesIncluidos: "casa inteira: sala com três ambientes, cozinha, terraço, mezanino, barzinho, três quartos (incluindo a suíte master), banheiros, área externa e estacionamento", // EXEMPLO
  areasExcluidas: "nenhuma", // EXEMPLO

  /* ---------------- Preços ---------------- */
  precos: {
    // A primeira temporada que contém a noite é a que vale. Datas em MM-DD.
    temporadas: [
      { nome: "Réveillon", inicio: "12-27", fim: "01-02", diaria: 2200, minimo: 5 }, // EXEMPLO
      { nome: "Carnaval", datas: ["2027-02-05", "2027-02-10"], diaria: 1900, minimo: 4 }, // EXEMPLO
      { nome: "Alta temporada", inicio: "12-15", fim: "02-28", diaria: 1500, minimo: 3 }, // EXEMPLO
      { nome: "Férias de julho", inicio: "07-01", fim: "07-31", diaria: 1500, minimo: 3 }, // EXEMPLO
    ],
    padrao: { nome: "Baixa temporada", diaria: 1100, minimo: 2 }, // EXEMPLO
    limpeza: 300, // EXEMPLO
    caucao: 1000, // EXEMPLO — opcional; 0 = sem garantia
    consumo: "água, energia e gás incluídos no preço", // EXEMPLO
    pagamento: [
      { rotulo: "Sinal (antecipação do aluguel)", pct: 50, quando: "reserva" }, // EXEMPLO
      { rotulo: "Saldo do preço", pct: 50, quando: "7 dias antes da entrada" }, // EXEMPLO
    ],
    diasAntesSaldo: 7, // EXEMPLO
    forma: "Pix, chave CNPJ 03.768.213/0001-56, em nome de LUIZ FABIO TARGINO DE PAIVA CAVALCANTI", // EXEMPLO
    validadeProposta: "48 horas após o envio do link", // EXEMPLO
    condicaoConfirmacao: "pagamento do sinal e envio do contrato assinado", // EXEMPLO
  },

  cancelamento: [
    { quando: "Até 30 dias antes da entrada", regra: "sem multa; devolução integral" }, // EXEMPLO
    { quando: "De 29 a 8 dias antes da entrada", regra: "retenção de 30% do total da locação" }, // EXEMPLO
    { quando: "7 dias ou menos antes da entrada", regra: "retenção de 50% do total da locação" }, // EXEMPLO
    { quando: "Não comparecimento", regra: "retenção de 50% do total da locação" }, // EXEMPLO
  ],
  canalCancelamento: "WhatsApp da Casa Mar de Mel, com confirmação de recebimento", // EXEMPLO
  multaSaidaAntecipada: "10% do total da locação", // EXEMPLO
  prazoRestituicao: "7 dias corridos", // EXEMPLO
  prazoIndisponibilidade: "2 dias úteis", // EXEMPLO
  remarcacao: "uma remarcação sem custo, pedida até 30 dias antes da entrada, sujeita a disponibilidade e à tabela vigente", // EXEMPLO
  prazoCaucao: "5 dias corridos após a saída", // EXEMPLO
  meioDevolucaoCaucao: "Pix para a conta indicada pelo locatário", // EXEMPLO
  retencaoDocumentos: "6 meses após o acerto final da reserva", // EXEMPLO

  /* ---------------- Regulamento (Anexo B) ---------------- */
  regulamento: [
    {
      titulo: "Ocupação e visitantes",
      itens: [
        "Capacidade máxima de 12 pessoas para pernoite, incluindo crianças.",
        "Visitantes permitidos das 9h às 20h, até 4 pessoas por vez, sem pernoite.", // EXEMPLO
        "Mudanças na lista de hóspedes e pernoites extras precisam de acordo prévio por escrito.",
      ],
    },
    {
      titulo: "Convivência",
      itens: [
        "Festas e eventos não são permitidos.", // EXEMPLO
        "Silêncio das 22h às 8h. Som em volume moderado, sem caixas amplificadas na área externa.", // EXEMPLO
        "Preserve o sossego da vizinhança em qualquer horário.",
      ],
    },
    {
      titulo: "Animais e fumo",
      itens: [
        "Um animal de estimação permitido, avisado na reserva. Animais de assistência são sempre bem-vindos.",
        "Fumar somente na área externa, longe das redes e estofados.", // EXEMPLO
      ],
    },
    {
      titulo: "Cuidados com a casa",
      itens: [
        "Tire a areia no chuveiro externo antes de entrar.", // EXEMPLO — confirmar o local
        "Não sente nos estofados com roupa molhada.",
        "Feche portas e janelas em caso de chuva ou vento forte.",
        "Não jogue óleo, areia ou objetos no ralo ou no vaso.",
      ],
    },
    {
      titulo: "Limpeza e lixo",
      itens: [
        "Lixo ensacado no ponto de coleta em frente à casa.", // EXEMPLO
        "Louça lavada e guardada na saída.", // EXEMPLO
        "A limpeza final já está incluída no preço. Limpeza extra só com valor combinado antes e comprovado.",
      ],
    },
    {
      titulo: "Ocorrências e saída",
      itens: [
        "Avise logo sobre danos, falhas ou perda de chaves pelo WhatsApp da casa.",
        "Saída até as 11h, com entrega das chaves ao responsável combinado.", // EXEMPLO
        "Crianças sempre acompanhadas por um adulto, principalmente no acesso à praia.",
      ],
    },
  ],

  /* ---------------- Inventário (Anexo C) ---------------- */
  // EXEMPLO — montado a partir das fotos do anúncio; conferir item por item na casa.
  inventario: [
    { ambiente: "Sala", itens: [["Sofá", 2], ["Pufe", 2], ["Mesa de centro", 1], ["TV", 1]] },
    { ambiente: "Cozinha", itens: [["Geladeira", 1], ["Fogão", 1], ["Cafeteira", 1], ["Mesa com cadeiras", 1], ["Jogo de panelas", 1], ["Pratos", 24], ["Copos", 24], ["Talheres (jogos)", 24]] },
    { ambiente: "Terraço", itens: [["Mesa de jantar", 1], ["Cadeiras", 8], ["Redes", 4], ["Móveis externos", 1]] },
    { ambiente: "Quarto 1", itens: [["Cama de casal", 1], ["Cama de solteiro", 2], ["Ar-condicionado", 1], ["Ventilador", 1]] },
    { ambiente: "Quarto 2", itens: [["Cama queen", 1], ["Ar-condicionado", 1]] },
    { ambiente: "Suíte master", itens: [["Cama", 1], ["Ar-condicionado", 1]] },
    { ambiente: "Geral", itens: [["Berço", 1], ["Ferro de passar", 1], ["Secador de cabelo", 1], ["Jogos de cama", 8], ["Toalhas de banho", 12]] },
  ],
  chaves: "2 chaves da porta principal e 1 controle do portão", // EXEMPLO

  /* ---------------- Guia do hóspede ---------------- */
  guia: {
    chegada: "Ao chegar na Rua Ouricuri, siga até o fim: a casa é a última da rua, de frente para o mar.",
    chaves: "Entregues pessoalmente pelo responsável no horário de chegada combinado.", // EXEMPLO
    wifi: "Nome e senha enviados pelo WhatsApp no dia da entrada.",
    quadroEletrico: "a confirmar", // EXEMPLO
    registroAgua: "a confirmar", // EXEMPLO
    emergencias: [
      ["SAMU", "192"],
      ["Bombeiros", "193"],
      ["Polícia Militar", "190"],
    ],
    saida: [
      "Recolher objetos pessoais e conferir armários e tomadas.",
      "Deixar a louça lavada e guardada.",
      "Levar o lixo ao ponto de coleta.",
      "Deixar roupas de cama e toalhas usadas no banheiro.",
      "Desligar luzes e ar-condicionado.",
      "Fechar portas e janelas.",
      "Avisar sobre quebras ou perdas ainda não comunicadas.",
      "Devolver chaves e controle ao responsável.",
    ],
  },

  /* ---------------- Fotos ---------------- */
  fotosCasa: [
    ["casa/rede-vista-mar.jpg", "Rede na varanda com o mar ao fundo", 1200, 900],
    ["casa/fachada.jpg", "Fachada da casa, de tijolinho e telhado de madeira", 1200, 900],
    ["casa/fachada-noite.jpg", "A casa iluminada ao entardecer", 1200, 900],
    ["casa/terraco-mesa.jpg", "Mesa de jantar no terraço", 480, 640],
    ["casa/varanda-rede.jpg", "Varanda coberta com rede", 1200, 1600],
    ["casa/sala.jpg", "Sala com sofás", 1200, 2133],
    ["casa/cozinha.jpg", "Cozinha integrada com mesa", 480, 640],
    ["casa/cozinha-mesa.jpg", "Cozinha e mesa de refeições", 960, 1280],
    ["casa/mezanino.jpg", "Mezanino com pé direito duplo", 1200, 900],
    ["casa/quarto-1.jpg", "Quarto com cama de casal e camas de solteiro", 1086, 1448],
    ["casa/quarto-2.jpg", "Quarto com camas de solteiro e bicama", 1200, 900],
    ["casa/deck-vista-mar.jpg", "Saída da casa para a praia", 1200, 675],
    ["casa/casa-entre-coqueiros.jpg", "A casa vista entre os coqueiros", 1200, 900],
    ["casa/lua-cheia-terraco.jpg", "Lua cheia vista do terraço", 960, 1280],
    ["casa/casa-vista-da-praia-noite.jpg", "A casa vista da praia à noite", 1200, 900],
  ],
  fotosRegiao: [
    ["regiao/mar-de-mel-na-areia.jpg", "Mar de Mel escrito na areia, com falésias ao fundo", 1200, 900],
    ["regiao/rio-encontra-o-mar.jpg", "O rio encontrando o mar perto da casa", 1200, 900],
    ["regiao/nascer-do-sol.jpg", "Nascer do sol no mar", 1200, 900],
    ["regiao/falesia.jpg", "Falésia na beira da praia", 1200, 1600],
    ["regiao/pedras-orla.jpg", "Pedras na orla na maré baixa", 1200, 900],
    ["regiao/rio.jpg", "Banho de rio", 1200, 900],
    ["regiao/coqueiral-praia.jpg", "Coqueiral à beira-mar", 1200, 1600],
    ["regiao/acesso-praia.jpg", "Acesso à praia", 640, 360],
    ["regiao/nossa-localizacao.jpg", "Praia em frente à casa", 960, 1280],
    ["regiao/coqueiros-mar.jpg", "Coqueiros e mar", 1200, 1600],
    ["regiao/coqueiros-contraluz.jpg", "Coqueiros contra o sol", 1200, 1600],
    ["regiao/ceu-coqueiros.jpg", "Céu de nuvens sobre os coqueiros", 960, 1280],
    ["regiao/coqueiro-praia.jpg", "Coqueiro na praia", 1200, 1600],
    ["regiao/coqueiral.jpg", "Coqueiral", 900, 1600],
  ],

  regiao: [
    { nome: "Praia de Tabatinga", texto: "Bem em frente à casa. Areia larga, coqueiral e um rio que encontra o mar a poucos passos." },
    { nome: "Coqueirinho", texto: "A praia vizinha, com falésias coloridas e piscinas naturais que aparecem na maré baixa." },
    { nome: "Tambaba", texto: "Perto daqui, famosa pela paisagem de falésias. Tem um trecho naturista e um trecho liberado para todos." },
    { nome: "Jacumã e Carapibus", texto: "Para restaurantes, padarias e mercado durante a estadia." },
    { nome: "João Pessoa", texto: "A poucos minutos de carro, para quem quer passear na capital ou chega pelo aeroporto." },
  ],
};
