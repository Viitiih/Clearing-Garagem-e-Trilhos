// Cadastro de alvos do painel Autopass.
//
// IMPORTANTE PARA VALORES REAIS:
// - O navegador/GitHub Pages/Netlify estático NÃO consulta Oracle diretamente.
// - Para puxar valores reais de todas as datas, o app chama uma API interna.
// - Suba o backend/autopass_api.py em uma VM/servidor com acesso aos bancos Oracle.
// - Depois informe abaixo a URL da API. Exemplo:
//   window.API_BASE_URL = "http://10.0.0.10:8000";
// - Se a API estiver no mesmo domínio do front, deixe vazio.

window.API_BASE_URL = "";

// Use somente para homologação visual. Em produção, deixe false para não usar amostra fixa.
window.USE_STATIC_SAMPLE = false;


window.ALVO_CONFIG = {
  garagens: [
    { nome: "BB / RALIP", schema: "GA_BENFIC", tpIds: ["6", "7"] },
    { nome: "VIAÇÃO MIRACATIBA LTDA", schema: "GA_MIRCBA", tpIds: ["8"] },
    { nome: "AUTO ÔNIBUS MORATENSE LTDA", schema: "GA_MRATEN", tpIds: ["12"] },
    { nome: "TIPBUS TRANSPORTE INTERMUNICIP", schema: "GA_TIPBSV", tpIds: ["13"] },
    { nome: "VIAÇÃO OSASCO MATRIZ LTDA", schema: "GA_OSASCO", tpIds: ["15"] },
    { nome: "VIACAO OSASCO LTDA - FILIAL", schema: "GA_OSASCOFL", tpIds: ["16"] },
    { nome: "DEL REY TRANSPORTES LTDA", schema: "GA_DELREY", tpIds: ["21"] },
    { nome: "NEXT MOBILIDADE SIST.EXISTENTE", schema: "GA_METRA", tpIds: ["26"] },
    { nome: "NEXT MOBILIDADE SIST REMANESCE", schema: "GA_NEXT", tpIds: ["27"] },
    { nome: "PÁSSARO MARRON SANTA ISABEL / UNILESTE", schema: "GA_PMARROM", tpIds: ["29", "30"] },
    { nome: "AUTO VIAÇÃO URUBUPUNGÁ LTDA", schema: "GA_URUBPG", tpIds: ["32"] },
    { nome: "EMPRESA DE TRANSPORTES MAIRIPORÃ", schema: "GA_MAIRIP", tpIds: ["33"] },
    { nome: "ETT CARAPICUIBA", schema: "GA_ETTCRBA", tpIds: ["35"] },
    { nome: "ARUJA TRANSPORTES COLETIVOS / MUNI", schema: "GA_VLGAL03", tpIds: ["41", "42"] },
    { nome: "VIAÇÃO CIDADE DE CAIEIRAS LTDA", schema: "GA_CAIERS", tpIds: ["45"] },
    { nome: "ALTO TIETE TRANSPORTES LTDA", schema: "GA_ATIETE", tpIds: ["48"] },
    { nome: "RADIAL SUZANO INTERMUNICIPAL", schema: "GA_RADSUZ", tpIds: ["50"] },
    { nome: "VIAÇÃO JACAREÍ LTDA", schema: "GA_JACREI", tpIds: ["51"] },
    { nome: "VIACAO RAPOSO TAVARES MUNI / LTDA", schema: "GA_RAPOSO", tpIds: ["53", "54"] },
    { nome: "VIAÇÃO PIRAJUÇARA / MUNICIPAL", schema: "GA_PIRJRA", tpIds: ["60", "61"] },
    { nome: "VIAÇÃO TALISMÃ - MUNI", schema: "GA_TALISMA", tpIds: ["64"] },
    { nome: "ALTO TIETE TRANSPORTE LTDA", schema: "GA_RADIAL", tpIds: ["186"] }
  ],
  trilhos: [
    { nome: "METRO", base: "METRO", trilhosDb: "metro", tpIds: ["1"] },
    { nome: "CPTM", base: "CPTM", trilhosDb: "cptm", tpIds: ["2"] },
    { nome: "VIA 4", base: "METRO", trilhosDb: "metro", tpIds: ["3"] },
    { nome: "VIA MOBILIDADE", base: "METRO", trilhosDb: "metro", tpIds: ["4"] },
    { nome: "VIA MOBILIDADE 8 e 9", base: "CPTM", trilhosDb: "cptm", tpIds: ["122"] }
  ]
};

const trilhosPendente = [
  { alvo: "METRO", schemaBase: "METRO", tpId: "1", origem: null, autopass: null, originOnly: null, autopassOnly: null, status: "Aguardando API" },
  { alvo: "CPTM", schemaBase: "CPTM", tpId: "2", origem: null, autopass: null, originOnly: null, autopassOnly: null, status: "Aguardando API" },
  { alvo: "VIA 4", schemaBase: "METRO", tpId: "3", origem: null, autopass: null, originOnly: null, autopassOnly: null, status: "Aguardando API" },
  { alvo: "VIA MOBILIDADE", schemaBase: "METRO", tpId: "4", origem: null, autopass: null, originOnly: null, autopassOnly: null, status: "Aguardando API" },
  { alvo: "VIA MOBILIDADE 8 e 9", schemaBase: "CPTM", tpId: "122", origem: null, autopass: null, originOnly: null, autopassOnly: null, status: "Aguardando API" }
];

window.RESULT_FIXTURES = {
  garagens: {
    sourceLabel: "Excel enviado: comparacao_autopass_garagens_20260514_100927.xlsx",
    periodLabel: "13/05/2026 03:00:00 até 14/05/2026 02:59:59",
    generatedAt: "14/05/2026 10:09:27",
    modeLabel: "Amostra real carregada",
    summary: [
      { alvo: "BB / RALIP", schemaBase: "GA_BENFIC", tpId: "6, 7", origem: 245, autopass: 245, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIAÇÃO MIRACATIBA LTDA", schemaBase: "GA_MIRCBA", tpId: "8", origem: 596, autopass: 596, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "AUTO ÔNIBUS MORATENSE LTDA", schemaBase: "GA_MRATEN", tpId: "12", origem: 41, autopass: 41, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "TIPBUS TRANSPORTE INTERMUNICIP", schemaBase: "GA_TIPBSV", tpId: "13", origem: 126, autopass: 127, originOnly: 0, autopassOnly: 1, status: "Divergente" },
      { alvo: "VIAÇÃO OSASCO MATRIZ LTDA", schemaBase: "GA_OSASCO", tpId: "15", origem: 188, autopass: 188, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIACAO OSASCO LTDA - FILIAL", schemaBase: "GA_OSASCOFL", tpId: "16", origem: 465, autopass: 465, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "DEL REY TRANSPORTES LTDA", schemaBase: "GA_DELREY", tpId: "21", origem: 81, autopass: 81, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "NEXT MOBILIDADE SIST.EXISTENTE", schemaBase: "GA_METRA", tpId: "26", origem: 409, autopass: 409, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", origem: 888, autopass: 894, originOnly: 1, autopassOnly: 7, status: "Divergente" },
      { alvo: "PÁSSARO MARRON SANTA ISABEL / UNILESTE", schemaBase: "GA_PMARROM", tpId: "29, 30", origem: 56, autopass: 56, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "AUTO VIAÇÃO URUBUPUNGÁ LTDA", schemaBase: "GA_URUBPG", tpId: "32", origem: 592, autopass: 592, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "EMPRESA DE TRANSPORTES MAIRIPORÃ", schemaBase: "GA_MAIRIP", tpId: "33", origem: 52, autopass: 52, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "ETT CARAPICUIBA", schemaBase: "GA_ETTCRBA", tpId: "35", origem: 198, autopass: 198, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "ARUJA TRANSPORTES COLETIVOS / MUNI", schemaBase: "GA_VLGAL03", tpId: "41, 42", origem: 90, autopass: 90, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIAÇÃO CIDADE DE CAIEIRAS LTDA", schemaBase: "GA_CAIERS", tpId: "45", origem: 104, autopass: 104, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "ALTO TIETE TRANSPORTES LTDA", schemaBase: "GA_ATIETE", tpId: "48", origem: 165, autopass: 165, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "RADIAL SUZANO INTERMUNICIPAL", schemaBase: "GA_RADSUZ", tpId: "50", origem: 146, autopass: 146, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIAÇÃO JACAREÍ LTDA", schemaBase: "GA_JACREI", tpId: "51", origem: 29, autopass: 29, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIACAO RAPOSO TAVARES MUNI / LTDA", schemaBase: "GA_RAPOSO", tpId: "53, 54", origem: 431, autopass: 431, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIAÇÃO PIRAJUÇARA / MUNICIPAL", schemaBase: "GA_PIRJRA", tpId: "60, 61", origem: 629, autopass: 629, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "VIAÇÃO TALISMÃ - MUNI", schemaBase: "GA_TALISMA", tpId: "64", origem: 21, autopass: 21, originOnly: 0, autopassOnly: 0, status: "OK" },
      { alvo: "ALTO TIETE TRANSPORTE LTDA", schemaBase: "GA_RADIAL", tpId: "186", origem: 118, autopass: 118, originOnly: 0, autopassOnly: 0, status: "OK" }
    ],
    details: [
      { alvo: "TIPBUS TRANSPORTE INTERMUNICIP", schemaBase: "GA_TIPBSV", tpId: "13", arquivo: "TOP_13_36222_57312_720_13_20260512_193028_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_81027_58133_1604_27_20260513_125405_2.4.14.BIN", situacao: "Só na Garagem", situacaoTipo: "origem" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2363_27_20260512_220349_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2364_27_20260513_070459_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2365_27_20260513_095144_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2366_27_20260513_115146_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2367_27_20260513_134329_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2368_27_20260513_154127_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" },
      { alvo: "NEXT MOBILIDADE SIST REMANESCE", schemaBase: "GA_NEXT", tpId: "27", arquivo: "TOP_27_80457_54961_2369_27_20260513_180723_2.4.14.BIN", situacao: "Só no Autopass", situacaoTipo: "autopass" }
    ]
  },
  trilhos: {
    sourceLabel: "Valores reais via API Oracle",
    periodLabel: null,
    generatedAt: null,
    modeLabel: "API Oracle",
    summary: trilhosPendente,
    details: []
  }
};
