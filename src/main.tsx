import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  BookOpenText,
  ChevronDown,
  Download,
  LayoutDashboard,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  Table2,
  FileDown,
  UsersRound,
  LandPlot,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./styles.css";

type Values = Record<string, number | null>;

type RecordRow = {
  year: number;
  code: string;
  municipality: string;
  uf: string;
  region: string;
  values: Values;
  ranks: Record<string, { br?: RankInfo | null; pe?: RankInfo | null }>;
};

type RankInfo = {
  position: number;
  total: number;
};

type DashboardData = {
  records: RecordRow[];
  regions: string[];
  indicators: string[];
  indicatorPolarity?: Record<string, "higher" | "lower">;
  dimensions: string[];
  components: string[];
  map: {
    viewBox: string;
    paths: Record<string, string>;
  };
  sourceNote: string;
};

type View = "overview" | "ranking" | "map" | "scorecard" | "charts" | "dictionary";
type ChartTab = "radar" | "regression" | "temporal";

const YEARS = [2026, 2025, 2024];
const IPS = "Índice de Progresso Social";
const GDP = "PIB per capita";
const COLORS = ["#006591", "#f97316", "#dc2626", "#16a34a", "#7c3aed", "#0f172a"];
const MAP_PALETTE = ["#005a8d", "#1597e5", "#8cc7f2", "#fff28a", "#ffe23a", "#f7bd08", "#ff922e", "#fb5f63", "#c94f55"];
const CORE = [
  IPS,
  "Necessidades Humanas Básicas",
  "Fundamentos do Bem-estar",
  "Oportunidades",
];
const LOWER_IS_BETTER = new Set([
  "Hospitalizações por Condições Sensíveis à Atenção Primária",
  "Mortalidade Ajustada por Condições Sensíveis à Atenção Primária",
  "Mortalidade Infantil até 5 anos",
  "Subnutrição",
  "Índice de Perdas de Água na Distribuição",
  "Assassinatos de Jovens",
  "Assassinatos de Mulheres",
  "Homicídios",
  "Mortes por Acidentes de Transporte",
  "Abandono no Ensino Fundamental",
  "Abandono no Ensino Médio",
  "Distorção Idade-Série no Ensino Médio",
  "Evasão no Ensino Médio",
  "Reprovação Escolar no Ensino Médio",
  "Consumo de ultraprocessados",
  "Mortalidade entre 15 e 50 anos",
  "Mortalidades por Doenças Crônicas Não Transmissíveis",
  "Obesidade",
  "Suicídios",
  "Emissões de CO₂e por Habitante",
  "Focos de Calor",
  "Índice de Vulnerabilidade Climática dos Municípios (IVCM)",
  "Supressão da Vegetação Primária e Secundária",
  "Taxa de Congestionamento Líquida de Processos",
  "Gravidez na Adolescência (<19)",
  "Índice de Vulnerabilidade das Famílias do CadÚnico (IVCAD)",
  "Famílias em Situação de Rua",
  "Violência Contra Indígenas",
  "Violência Contra Mulheres",
  "Violência Contra Negros",
]);



type IndicatorDetail = {
  source: string;
  unit: string;
  year: string;
  description: string;
};

const INDICATOR_DETAILS_BY_SLUG: Record<string, IndicatorDetail> = {
  "coberturavacinalpoliomielite": { source: "IEPS, PNI, TabNet/DataSUS e Ministerio da Saude", unit: "Porcentagem da populacao-alvo", year: "2023", description: "Cobertura vacinal estimada de poliomielite, considerando-se a populacao-alvo: criancas menores de 1 ano (vacina injetavel) ate 4 anos (oral)." },
  "hospitalizacoesporcondicoessensiveisaatencaoprimaria": { source: "IEPS, SIH, TabNet/DataSUS e Ministerio da Saude", unit: "Internacoes por 100.000 habitantes", year: "2023", description: "Taxa de hospitalizacoes por Condicoes Sensiveis a Atencao Primaria (CSAP) por 100.000 habitantes, realizadas no ambito do SUS, considerando o local de residencia." },
  "mortalidadeajustadaporcondicoessensiveisaatencaoprimaria": { source: "IEPS, SIM, TabNet/DataSUS e Ministerio da Saude", unit: "Obitos por 100.000 habitantes", year: "2023", description: "Taxa de obitos por 100.000 habitantes, considerando o local de residencia e CSAP, ajustada por idade de acordo com a populacao de referencia." },
  "mortalidadeinfantilate5anos": { source: "DataSUS/Ministerio da Saude", unit: "Obitos por mil nascidos vivos", year: "2024", description: "Taxa de mortalidade infantil (obitos de criancas menores de 5 anos) por mil nascidos vivos. Estima o risco de um nascido vivo morrer durante os primeiros cinco anos de vida." },
  "subnutricao": { source: "Sisvan/Ministerio da Saude", unit: "Porcentagem da populacao pesquisada", year: "2025", description: "Populacao de todas as faixas etarias que estao abaixo do peso ideal: criancas de 0 a 10 anos, adolescentes, adultos, idosos e gestantes." },
  "abastecimentodeaguaviaredededistribuicao": { source: "CadUnico/Ministerio do Desenvolvimento Social e Combate a Fome (MDS)", unit: "Porcentagem de domicilios", year: "2025", description: "Porcentagem das familias inscritas no CadUnico morando em domicilios com servico de abastecimento de agua adequado, incluindo rede geral de distribuicao." },
  "esgotamentosanitarioadequado": { source: "CadUnico/MDS", unit: "Porcentagem de domicilios", year: "2025", description: "Porcentagem das familias inscritas no CadUnico morando em domicilios com servico de coleta de esgoto adequado, incluindo sistema de esgoto canalizado e fossas septicas." },
  "indicedeabastecimentodeagua": { source: "Sinisa/Ministerio das Cidades", unit: "Porcentagem da populacao", year: "2023", description: "Indice de atendimento total de agua em relacao a populacao atendida, informado pelos prestadores de servicos de saneamento e pela populacao total residente estimada pelo IBGE." },
  "indicedeperdasdeaguanadistribuicao": { source: "Sinisa/Ministerio das Cidades", unit: "Porcentagem do volume de agua fornecido perdido na distribuicao", year: "2023", description: "Indice de perdas de agua na rede de distribuicao, informadas pelos prestadores de servicos de saneamento." },
  "domicilioscomcoletaderesiduosadequada": { source: "CadUnico/MDS", unit: "Porcentagem de domicilios", year: "2025", description: "Porcentagem de familias inscritas no CadUnico morando em domicilios com servico de coleta direta de residuos pela concessionaria de saneamento do municipio." },
  "domicilioscomiluminacaoeletricaadequada": { source: "CadUnico/MDS", unit: "Porcentagem de domicilios", year: "2025", description: "Porcentagem de familias inscritas no CadUnico morando em domicilios com iluminacao eletrica adequada, ligada a rede de energia eletrica da concessionaria com medidor proprio." },
  "domicilioscomparedesadequadas": { source: "CadUnico/MDS", unit: "Porcentagem de domicilios", year: "2025", description: "Porcentagem de familias inscritas no CadUnico morando em domicilios cujas paredes sao adequadas, como alvenaria ou madeira aparelhada." },
  "domicilioscompisosadequados": { source: "CadUnico/MDS", unit: "Porcentagem de domicilios", year: "2025", description: "Porcentagem das familias inscritas no CadUnico morando em domicilios cujos pisos sao adequados, como ceramica, carpete, cimento ou madeira aparelhada." },
  "assassinatosdejovens": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente Estimada 2024", unit: "Obitos por 100.000 habitantes de 15 a 29 anos", year: "2024", description: "Taxa de homicidios de pessoas na faixa etaria de 15 a 29 anos. Homicidio de jovens e definido como morte deliberadamente infligida a uma pessoa por outra pessoa nesta faixa etaria." },
  "assassinatosdemulheres": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente de Mulheres Estimada 2024", unit: "Obitos por 100.000 mulheres", year: "2024", description: "Taxa de assassinatos de mulheres. Assassinato de mulheres e definido como a morte deliberadamente infligida a uma pessoa do sexo feminino por outra pessoa." },
  "homicidios": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente Estimada 2024", unit: "Obitos por 100.000 habitantes", year: "2024", description: "Taxa bruta de homicidios em relacao a populacao total. Homicidio e definido como a morte deliberadamente infligida a uma pessoa por outra pessoa." },
  "mortesporacidentesdetransporte": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente Estimada 2024", unit: "Obitos por 100.000 habitantes", year: "2024", description: "Taxa de mortalidade por acidentes de transporte, incluindo obitos em modais terrestres, aquaviarios e aereo/espaciais." },
  "abandononoensinofundamental": { source: "Inep", unit: "Porcentagem de alunos", year: "2024", description: "Taxa de abandono escolar para alunos do Ensino Fundamental, ou seja, o ato do aluno abandonar os estudos ou reprovar no ano letivo." },
  "abandononoensinomedio": { source: "Inep", unit: "Porcentagem de alunos", year: "2024", description: "Taxa de abandono escolar para alunos do Ensino Medio, ou seja, o ato do aluno abandonar os estudos ou reprovar no ano letivo." },
  "evasaonoensinomedio": { source: "Inep", unit: "Porcentagem de alunos", year: "2021-2022", description: "Taxa de evasao para alunos do Ensino Medio. A evasao e o percentual de alunos que deixa de frequentar a escola de um ano para outro, isto e, quando nao se matricula no ano seguinte." },
  "distorcaoidadeserienoensinomedio": { source: "Inep", unit: "Porcentagem de alunos", year: "2024", description: "Taxa de distorcao idade-serie para alunos do Ensino Medio. Indica o percentual de alunos com idade acima da esperada para o ano em que estao matriculados." },
  "idebensinofundamental": { source: "Inep", unit: "Indice (0-10)", year: "2023", description: "O Ideb mede a qualidade do ensino nas escolas a partir da taxa de rendimento escolar e do desempenho medio nas provas do Inep." },
  "reprovacaoescolarnoensinomedio": { source: "Inep", unit: "Porcentagem de alunos", year: "2024", description: "Reprovacao escolar para alunos do Ensino Medio, ou seja, a porcentagem de alunos que reprovam na serie no referido ano letivo." },
  "coberturadeinternetmovel4g5g": { source: "Agencia Nacional de Telecomunicacoes (Anatel)", unit: "Porcentagem de moradores cobertos", year: "2024", description: "Estimativa da cobertura movel considerando tecnologias, frequencias, localizacao das estacoes, altura e direcao das antenas, potencias dos transmissores, edificacoes e relevo, normalizados pela Anatel." },
  "densidadedeinternetbandalargafixa": { source: "Anatel", unit: "Acessos a banda larga fixa por 100 domicilios", year: "2024", description: "Densidade dos acessos em servico associados a prestacao do Servico de Comunicacao Multimidia, representada pelo numero de acessos em servico por grupo de 100 domicilios." },
  "densidadetelefoniamovel": { source: "Anatel", unit: "Acessos de telefonia movel por 100 habitantes", year: "2024", description: "Densidade dos acessos em operacao associados a prestacao do Servico Movel Pessoal, representada pelo numero de acessos em operacao por grupo de 100 habitantes." },
  "qualidadedeinternetmovel": { source: "Anatel", unit: "Porcentagem de conexoes sem quedas ou congestionamentos", year: "2025", description: "Mede a qualidade do servico de internet movel, expressa pela capacidade da rede em relacao ao cumprimento das referencias ou valores contratados de volume de dados transmitidos por segundo." },
  "consumodeultraprocessados": { source: "Sisvan/Ministerio da Saude", unit: "Porcentagem da populacao adolescente e adulta pesquisada", year: "2025", description: "Porcentagem da populacao adolescente e adulta que respondeu positivamente a pergunta sobre o habito de consumir alimentos ultraprocessados em relacao ao total de participantes." },
  "expectativadevida": { source: "Instituto de Pesquisa Economica Aplicada (Ipea)", unit: "Anos", year: "2010", description: "Numero medio de anos de vida esperados para um recem-nascido, mantidos os padroes de mortalidade observados na populacao residente em determinado espaco geografico, no ano de referencia." },
  "mortalidadeentre15e50anos": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente Estimada 2024", unit: "Obitos por 100.000 habitantes da faixa etaria", year: "2024", description: "Numero de obitos por qualquer causa para cada 100.000 habitantes na faixa etaria de 15 a 50 anos." },
  "mortalidadespordoencascronicasnaotransmissiveis": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente Estimada 2024", unit: "Obitos por 100.000 habitantes da faixa etaria", year: "2024", description: "Taxa de obitos por Doencas Cronicas Nao Transmissiveis por 100.000 habitantes, ajustada por faixas etarias. Inclui doencas cerebrovasculares, cardiovasculares, neoplasias, obesidade, diabetes e hipertensao." },
  "obesidade": { source: "Sisvan/Ministerio da Saude", unit: "Porcentagem da populacao pesquisada", year: "2025", description: "Populacao de todas as idades em situacao de obesidade de acordo com o Indice de Massa Corporal (IMC) em relacao ao total de pessoas cujo peso foi medido." },
  "suicidios": { source: "DataSUS/Ministerio da Saude; IBGE - Populacao Residente Estimada 2024", unit: "Obitos por 100.000 habitantes", year: "2024", description: "Taxa de mortalidade por suicidio. Corresponde ao numero de mortes devido a lesao autoprovocada intencionalmente." },
  "areasverdesurbanas": { source: "MapBiomas", unit: "Porcentagem da area de vegetacao sobre a mancha urbana", year: "2022", description: "Porcentagem de area de vegetacao detectada pela colecao Sentinel-Beta nas sedes urbanas dos municipios em relacao a area da mancha urbana total definida pelo MapBiomas." },
  "emissoesdecoeporhabitante": { source: "SEEG e IBGE - Populacao Residente Estimada 2024", unit: "CO2e por habitante", year: "2024", description: "Taxa de emissoes totais brutas em CO2 equivalente com potencial de aquecimento global AR5 em relacao ao numero de habitantes do municipio." },
  "focosdecalor": { source: "Inpe e IBGE - Populacao Residente Estimada 2025", unit: "Focos de calor por 10.000 habitantes", year: "2025", description: "Taxa de focos de calor na area do municipio em relacao ao numero de habitantes. Focos de calor provenientes dos satelites AQUA-MT, manha e tarde." },
  "indicedevulnerabilidadeclimaticadosmunicipiosivcm": { source: "Instituto Votorantim", unit: "Indice (0-100)", year: "2024", description: "Indice que contempla riscos climaticos mais urgentes para os municipios brasileiros, como inundacoes, enchentes, alagamentos, enxurradas, deslizamentos, seca, queimadas e impactos na agropecuaria e na saude ligados ao clima." },
  "supressaodavegetacaoprimariaesecundaria": { source: "MapBiomas; IBGE - Area dos municipios", unit: "Porcentagem da area suprimida", year: "2024", description: "Taxa de supressao da vegetacao primaria e secundaria oriunda da colecao 10 do MapBiomas em relacao a area total do municipio." },
  "acessoaprogramasdedireitoshumanos": { source: "Pesquisa Munic-IBGE", unit: "Categoria: 0 a 13", year: "2023", description: "Mede a existencia e quantidade de programas de politicas publicas municipais voltadas aos direitos humanos da populacao, como protecao de vitimas de violencia domestica, promocao da igualdade racial e outros." },
  "existenciadeacoesparadireitosdeminorias": { source: "Pesquisa Munic-IBGE", unit: "Categoria: 0 a 12", year: "2023", description: "Verifica se ha politicas publicas municipais com acoes para grupos especificos, como criancas e adolescentes, mulheres, pessoas idosas e populacao de rua." },
  "indicedeatendimentoademandadejustica": { source: "Conselho Nacional de Justica (CNJ)", unit: "Porcentagem de processos baixados em relacao ao numero de casos novos", year: "2025", description: "Indica a capacidade do Poder Judiciario em dar vazao ao volume de processos. Calculado pela relacao entre processos baixados e casos novos nos tribunais estaduais." },
  "respostaaprocessosfamiliares": { source: "CNJ", unit: "Tempo medio em dias", year: "2025", description: "Valor medio do numero de dias decorridos entre o inicio da acao judicial e a data do primeiro julgamento de processos de familia, considerando-se os processos julgados nos 12 meses anteriores." },
  "respostaaprocessosprevidenciarios": { source: "CNJ", unit: "Tempo medio em dias", year: "2025", description: "Valor medio do numero de dias decorridos entre o inicio da acao judicial e a data do primeiro julgamento de processos previdenciarios, considerando-se os processos julgados nos 12 meses anteriores." },
  "taxadecongestionamentoliquidadeprocessos": { source: "CNJ", unit: "Porcentagem de processos baixados", year: "2025", description: "Taxa de congestionamento de um tribunal de justica estadual, ou seja, a relacao entre processos solucionados e os que nao foram solucionados. Quanto maior a taxa, mais dificil para o tribunal lidar com seu estoque." },
  "acessoaculturalazereesporte": { source: "IBGE", unit: "Categoria: 0 a 11", year: "2021", description: "Existencia no municipio de promocao de eventos e equipamentos, como biblioteca, teatro, centro cultural, estadios e ginasios, de forma a fomentar cultura e esporte para as pessoas no municipio." },
  "gravideznaadolescencia19": { source: "DataSUS/Ministerio da Saude - nascidos vivos", unit: "Nascidos vivos de maes ate 19 anos em relacao ao total", year: "2024", description: "Taxa de criancas e adolescentes que tiveram filhos em relacao a populacao feminina total de ate 19 anos. Considera maes menores de 10 anos, de 10 a 14 anos e de 15 a 19 anos." },
  "indicedevulnerabilidadedasfamiliasdocadunicoivcad": { source: "CadUnico/MDS", unit: "Indice (0-1)", year: "2025", description: "Indice composto por 40 indicadores que medem a condicao de vulnerabilidade das familias inscritas no CadUnico, sintetizada em 6 dimensoes. Quanto mais proximo de 1, maior a vulnerabilidade." },
  "pracaseparquesemareasurbanas": { source: "MapBiomas; IBGE - Populacao Residente 2022", unit: "Area de pracas por 10.000 habitantes", year: "2022", description: "Taxa de area de pracas e parques urbanos em hectares em relacao a populacao residente do municipio, multiplicada por 10.000." },
  "familiasemsituacaoderua": { source: "CadUnico/MDS", unit: "Casos por 10.000 familias inscritas no CadUnico", year: "2025", description: "Taxa de familias cadastradas com ao menos um membro em situacao de rua, entre familias inscritas no CadUnico, multiplicada por 10.000." },
  "paridadedegeneronacamaramunicipal": { source: "Tribunal Superior Eleitoral (TSE)", unit: "0-1", year: "2024", description: "Taxa de paridade de mulheres eleitas nas camaras municipais em relacao a porcentagem da populacao de mulheres de cada municipio." },
  "paridadedenegrosnacamaramunicipal": { source: "TSE", unit: "0-1", year: "2024", description: "Taxa de paridade de negros e pardos eleitos nas camaras municipais em relacao a porcentagem da populacao de negros e pardos de cada municipio." },
  "violenciacontraindigenas": { source: "Sinan-DataSUS/Ministerio da Saude; IBGE - Populacao Indigena 2022", unit: "Casos por 10.000 indigenas", year: "2024", description: "Taxa de numero de casos de qualquer tipo de violencia contra os povos indigenas." },
  "violenciacontramulheres": { source: "Sinan-DataSUS/Ministerio da Saude; IBGE - Populacao Residente de Mulheres Estimada 2024", unit: "Casos por 100.000 mulheres", year: "2024", description: "Taxa de numero de casos de violencia domestica, sexual e outros tipos de violencia contra mulheres em relacao a populacao feminina do municipio." },
  "violenciacontranegros": { source: "Sinan-DataSUS/Ministerio da Saude; IBGE - Populacao por cor ou raca 2022", unit: "Casos por 100.000 pessoas negras", year: "2024", description: "Taxa de numero de casos de qualquer tipo de violencia contra pessoas negras na classificacao cor/raca preta e parda." },
  "empregadoscomensinosuperior": { source: "Rais/Ministerio do Trabalho e Emprego; IBGE - Populacao Residente Estimada 2024", unit: "Empregados com 25 anos ou mais por mil habitantes", year: "2024", description: "Taxa do numero de pessoas acima de 25 anos com vinculo ativo com formacao de nivel superior por mil habitantes acima de 25 anos." },
  "mulheresempregadascomensinosuperior": { source: "Rais/Ministerio do Trabalho e Emprego; IBGE - Populacao Residente de Mulheres Estimada 2024", unit: "Mulheres empregadas por mil mulheres", year: "2024", description: "Numero de mulheres com vinculo ativo e formacao de nivel superior por mil mulheres acima de 25 anos." },
  "notamediananoenem": { source: "Inep", unit: "200-800 pontos", year: "2024", description: "Mediana da nota do Exame Nacional do Ensino Medio e dados dos alunos do municipio que realizaram a prova no ano de conclusao, considerando apenas os que concluiram todas as provas." },
};

const SCORECARD_GROUPS = [
  {
    dimension: "Necessidades Humanas Básicas",
    components: [
      {
        name: "Nutrição e Cuidados Médicos Básicos",
        indicators: [
          "Cobertura Vacinal (poliomielite)",
          "Hospitalizações por Condições Sensíveis à Atenção Primária",
          "Mortalidade Ajustada por Condições Sensíveis à Atenção Primária",
          "Mortalidade Infantil até 5 anos",
          "Subnutrição",
        ],
      },
      {
        name: "Água e Saneamento",
        indicators: [
          "Abastecimento de Água Via Rede de Distribuição",
          "Esgotamento Sanitário Adequado",
          "Índice de Abastecimento de Água",
          "Índice de Perdas de Água na Distribuição",
        ],
      },
      {
        name: "Moradia",
        indicators: [
          "Domicílios com Coleta de Resíduos Adequada",
          "Domicílios com Iluminação Elétrica Adequada",
          "Domicílios com Paredes Adequadas",
          "Domicílios com Pisos Adequados",
        ],
      },
      {
        name: "Segurança Pessoal",
        indicators: ["Assassinatos de Jovens", "Assassinatos de Mulheres", "Homicídios", "Mortes por Acidentes de Transporte"],
      },
    ],
  },
  {
    dimension: "Fundamentos do Bem-estar",
    components: [
      {
        name: "Acesso ao Conhecimento Básico",
        indicators: [
          "Abandono no Ensino Fundamental",
          "Abandono no Ensino Médio",
          "Distorção Idade-Série no Ensino Médio",
          "Evasão no Ensino Médio",
          "Ideb Ensino Fundamental",
          "Reprovação Escolar no Ensino Médio",
        ],
      },
      {
        name: "Acesso à Informação e Comunicação",
        indicators: ["Cobertura de Internet Móvel (4G/5G)", "Densidade de Internet Banda Larga Fixa", "Densidade Telefonia Móvel", "Qualidade de Internet Móvel"],
      },
      {
        name: "Saúde e Bem-estar",
        indicators: ["Consumo de ultraprocessados", "Expectativa de Vida", "Mortalidade entre 15 e 50 anos", "Mortalidades por Doenças Crônicas Não Transmissíveis", "Obesidade", "Suicídios"],
      },
      {
        name: "Qualidade do Meio Ambiente",
        indicators: ["Áreas Verdes Urbanas", "Emissões de CO₂e por Habitante", "Focos de Calor", "Índice de Vulnerabilidade Climática dos Municípios (IVCM)", "Supressão da Vegetação Primária e Secundária"],
      },
    ],
  },
  {
    dimension: "Oportunidades",
    components: [
      {
        name: "Direitos Individuais",
        indicators: ["Acesso a Programas de Direitos Humanos", "Existência de Ações para Direitos de Minorias", "Índice de Atendimento à Demanda de Justiça", "Resposta a Processos Previdenciários", "Resposta a Processos Familiares", "Taxa de Congestionamento Líquida de Processos"],
      },
      {
        name: "Liberdades Individuais e de Escolha",
        indicators: ["Acesso à Cultura, Lazer e Esporte", "Gravidez na Adolescência (<19)", "Índice de Vulnerabilidade das Famílias do CadÚnico (IVCAD)", "Praças e Parques em Áreas Urbanas", "Famílias em Situação de Rua"],
      },
      {
        name: "Inclusão Social",
        indicators: ["Paridade de Gênero na Câmara Municipal", "Paridade de Negros na Câmara Municipal", "Violência Contra Indígenas", "Violência Contra Mulheres", "Violência Contra Negros"],
      },
      {
        name: "Acesso à Educação Superior",
        indicators: ["Empregados com Ensino Superior", "Mulheres Empregadas com Ensino Superior", "Nota Mediana no Enem"],
      },
    ],
  },
];

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCompact(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function formatRank(rank?: RankInfo | null) {
  if (!rank) return "indisponível";
  return `${rank.position.toLocaleString("pt-BR")}/${rank.total.toLocaleString("pt-BR")}`;
}

function Flag({ type }: { type: "br" | "pe" }) {
  return (
    <img
      className="flag"
      src={type === "br" ? "/assets/brasil.png" : "/assets/pernambuco.png"}
      alt={type === "br" ? "Brasil" : "Pernambuco"}
    />
  );
}

function RankPair({ ranks, compact = false }: { ranks?: { br?: RankInfo | null; pe?: RankInfo | null }; compact?: boolean }) {
  return (
    <div className={`rank-pair ${compact ? "compact" : ""}`}>
      <span>
        <Flag type="br" />
        {formatRank(ranks?.br)}
      </span>
      <span>
        <Flag type="pe" />
        {formatRank(ranks?.pe)}
      </span>
    </div>
  );
}

function getValue(row: RecordRow, indicator: string) {
  return row.values[indicator] ?? null;
}

function slugText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function average(rows: RecordRow[], indicator: string) {
  const values = rows
    .map((row) => getValue(row, indicator))
    .filter((value): value is number => typeof value === "number");
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isLowerBetter(indicator: string) {
  return LOWER_IS_BETTER.has(indicator);
}

function rankRows(rows: RecordRow[], indicator: string) {
  const emptyValue = isLowerBetter(indicator) ? Infinity : -Infinity;
  return [...rows].sort((a, b) => {
    const av = getValue(a, indicator) ?? emptyValue;
    const bv = getValue(b, indicator) ?? emptyValue;
    return isLowerBetter(indicator) ? av - bv : bv - av;
  });
}

function classify(score: number | null) {
  if (score == null) return "Sem dado";
  if (score >= 70) return "Excelente";
  if (score >= 55) return "Bom";
  if (score >= 40) return "Médio";
  return "Baixo";
}

function scoreColor(score: number | null) {
  if (score == null) return "#d8dadc";
  if (score >= 70) return "#006591";
  if (score >= 55) return "#39b8fd";
  if (score >= 40) return "#89ceff";
  return "#c9e6ff";
}

function mapBreaks(rows: RecordRow[], indicator: string) {
  const values = rows
    .map((row) => getValue(row, indicator))
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => (isLowerBetter(indicator) ? a - b : b - a));
  if (!values.length) return [];
  return MAP_PALETTE.map((_, index) => {
    const start = Math.floor((index * values.length) / MAP_PALETTE.length);
    const end = Math.max(start, Math.floor(((index + 1) * values.length) / MAP_PALETTE.length) - 1);
    const chunk = values.slice(start, Math.min(end + 1, values.length));
    return {
      color: MAP_PALETTE[index],
      max: Math.max(...chunk),
      min: Math.min(...chunk),
    };
  });
}

function mapColor(value: number | null, breaks: { color: string; min: number; max: number }[]) {
  if (value == null || !breaks.length) return "#d8dadc";
  return breaks.find((item) => value <= item.max && value >= item.min)?.color ?? breaks[breaks.length - 1].color;
}

function statusTone(value: number | null) {
  if (value == null) return "empty";
  if (value >= 70) return "blue";
  if (value >= 55) return "yellow";
  if (value >= 40) return "green";
  return "red";
}

function rankTone(ranks?: { pe?: RankInfo | null }) {
  const rank = ranks?.pe;
  if (!rank) return "empty";
  const third = rank.total / 3;
  if (rank.position <= third) return "green";
  if (rank.position <= third * 2) return "yellow";
  return "red";
}

function rankLegend(total = 185) {
  const greenEnd = Math.floor(total / 3);
  const yellowEnd = Math.floor((total * 2) / 3);
  return {
    green: `1º a ${greenEnd}º`,
    yellow: `${greenEnd + 1}º a ${yellowEnd}º`,
    red: `${yellowEnd + 1}º a ${total}º`,
  };
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [view, setView] = useState<View>("overview");
  const [year, setYear] = useState(2026);
  const [region, setRegion] = useState("Todas");
  const [indicator, setIndicator] = useState(IPS);
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState("2605459");
  const [chartTab, setChartTab] = useState<ChartTab>("radar");

  useEffect(() => {
    fetch("/data/dashboard.json")
      .then((response) => response.json())
      .then(setData);
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.records.filter((row) => row.year === year && (region === "Todas" || row.region === region));
  }, [data, year, region]);

  const allYearRows = useMemo(() => data?.records.filter((row) => row.year === year) ?? [], [data, year]);
  const ranked = useMemo(() => rankRows(rows, indicator), [rows, indicator]);
  const selected = useMemo(
    () => data?.records.find((row) => row.year === year && row.code === selectedCode) ?? ranked[0],
    [data, year, selectedCode, ranked],
  );

  if (!data) {
    return <div className="loading">Carregando dados do IPS Pernambuco...</div>;
  }

  const indicators = [IPS, ...data.dimensions, ...data.components, ...data.indicators.filter((item) => !CORE.includes(item) && !data.components.includes(item))];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/assets/igpe.png" alt="Instituto de Gestão de Pernambuco" />
          <div>
            <strong>IPS Pernambuco</strong>
            <span>Painel executivo</span>
          </div>
        </div>
        <nav className="nav-list">
          <NavButton active={view === "overview"} icon={<LayoutDashboard size={20} />} label="Visão Geral" onClick={() => setView("overview")} />
          <NavButton active={view === "ranking"} icon={<Table2 size={20} />} label="Ranking" onClick={() => setView("ranking")} />
          <NavButton active={view === "map"} icon={<MapIcon size={20} />} label="Mapa" onClick={() => setView("map")} />
          <NavButton active={view === "scorecard"} icon={<SlidersHorizontal size={20} />} label="Scorecard" onClick={() => setView("scorecard")} />
          <NavButton active={view === "charts"} icon={<BarChart3 size={20} />} label="Gráficos" onClick={() => setView("charts")} />
          <NavButton active={view === "dictionary"} icon={<BookOpenText size={20} />} label="Dicionário" onClick={() => setView("dictionary")} />
        </nav>
        <div className="sidebar-note">
          <span>Fonte</span>
          <p>{data.sourceNote}</p>
        </div>
        <div className="sidebar-logo-footer">
          <img className="government-logo" src="/assets/governo-pe-brasao.png" alt="Governo de Pernambuco" />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Estado / Pernambuco</p>
            <h1>{titleFor(view)}</h1>
          </div>
          {view !== "map" && (
            <div className="top-actions">
              {(view === "overview" || view === "ranking") && <SearchBox value={query} onChange={setQuery} />}
              <Select label="Ano" value={String(year)} onChange={(value) => setYear(Number(value))} options={YEARS.map(String)} />
            </div>
          )}
        </header>

        {(view === "overview" || view === "ranking") && (
          <section className="filters">
            <Select label="Região de Desenvolvimento" value={region} onChange={setRegion} options={["Todas", ...data.regions]} />
            <Select label="Indicador" value={indicator} onChange={setIndicator} options={indicators} wide />
            <button className="button ghost">
              <Download size={17} />
              Exportar CSV
            </button>
          </section>
        )}

        {view === "overview" && <Overview rows={rows} allRecords={data.records} year={year} indicator={indicator} setView={setView} setSelectedCode={setSelectedCode} />}
        {view === "ranking" && <Ranking rows={ranked} query={query} indicator={indicator} setSelectedCode={setSelectedCode} setView={setView} />}
        {view === "map" && <MapView data={data} rows={allYearRows} year={year} setYear={setYear} indicator={indicator} selectedCode={selectedCode} setSelectedCode={setSelectedCode} />}
        {view === "scorecard" && <Scorecard data={data} selected={selected} year={year} selectedCode={selectedCode} setSelectedCode={setSelectedCode} />}
        {view === "charts" && <ChartsPage data={data} year={year} tab={chartTab} setTab={setChartTab} />}
        {view === "dictionary" && <DataDictionary data={data} />}
      </main>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Buscar município..." />
    </label>
  );
}

function Select({ label, value, onChange, options, wide = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; wide?: boolean }) {
  return (
    <label className={`select-wrap ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
    </label>
  );
}

function MunicipalitySelect({ value, onChange, rows }: { value: string; onChange: (value: string) => void; rows: RecordRow[] }) {
  return (
    <label className="select-wrap">
      <span>Município</span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {rows.map((row) => (
            <option key={row.code} value={row.code}>
              {row.municipality}
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
    </label>
  );
}

function titleFor(view: View) {
  return {
    overview: "Visão Geral do IPS",
    ranking: "Ranking de Municípios",
    map: "Mapa Social do IPS",
    scorecard: "Scorecard Municipal",
    charts: "Gráficos",
    dictionary: "Dicionário de Dados",
  }[view];
}

function Overview({ rows, allRecords, year, indicator, setView, setSelectedCode }: { rows: RecordRow[]; allRecords: RecordRow[]; year: number; indicator: string; setView: (view: View) => void; setSelectedCode: (code: string) => void }) {
  const ranked = rankRows(rows, indicator);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const mean = average(rows, indicator);
  const previous = year > 2024 ? average(allRecords.filter((row) => row.year === year - 1), indicator) : null;
  const delta = mean != null && previous != null ? mean - previous : null;
  const lowerBetter = isLowerBetter(indicator);
  const deltaIsGood = delta == null ? null : lowerBetter ? delta <= 0 : delta >= 0;
  const regionData = Object.values(
    rows.reduce<Record<string, { region: string; value: number; count: number }>>((acc, row) => {
      const value = getValue(row, indicator);
      if (value == null) return acc;
      acc[row.region] ??= { region: row.region, value: 0, count: 0 };
      acc[row.region].value += value;
      acc[row.region].count += 1;
      return acc;
    }, {}),
  )
    .map((item) => ({ region: item.region, média: Number((item.value / item.count).toFixed(2)) }))
    .sort((a, b) => (lowerBetter ? a.média - b.média : b.média - a.média));

  return (
    <div className="page-stack">
      <div className="metric-grid">
        <MetricCard label="Média estadual" value={formatNumber(mean)} foot={delta == null ? "Sem comparação anterior" : `${delta >= 0 ? "+" : ""}${formatNumber(delta)} ponto vs ano anterior`} tone={deltaIsGood == null ? "muted" : deltaIsGood ? "good" : "bad"} />
        <MetricCard label="Município com melhor resultado" value={top?.municipality ?? "-"} foot={`${formatNumber(getValue(top, indicator))} pontos`} />
        <MetricCard label="Município com pior resultado" value={bottom?.municipality ?? "-"} foot={`${formatNumber(getValue(bottom, indicator))} pontos`} tone="bad" />
      </div>

      <div className="content-grid">
        <section className="panel wide-panel">
          <PanelTitle title={`${indicator} por Região de Desenvolvimento`} subtitle="Média dos municípios por agrupamento regional." />
          <div className="chart tall">
            <ResponsiveContainer>
              <BarChart data={regionData} margin={{ top: 12, right: 12, bottom: 40, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="region" angle={-18} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Bar dataKey="média" fill="#0ea5e9" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="média" position="top" formatter={(value) => formatNumber(Number(value), 1)} className="bar-label" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <PanelTitle title="Destaques" subtitle={`Top 15 em ${year}`} />
          <div className="highlight-list">
            {ranked.slice(0, 15).map((row, index) => (
              <button
                key={row.code}
                onClick={() => {
                  setSelectedCode(row.code);
                  setView("scorecard");
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{row.municipality}</strong>
                <em>{formatNumber(getValue(row, indicator))}</em>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, foot, tone = "neutral" }: { label: string; value: string; foot: string; tone?: "neutral" | "good" | "bad" | "muted" }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className={tone}>{foot}</p>
    </article>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function Ranking({ rows, query, indicator, setSelectedCode, setView }: { rows: RecordRow[]; query: string; indicator: string; setSelectedCode: (code: string) => void; setView: (view: View) => void }) {
  const filtered = rows.filter((row) => row.municipality.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="panel">
      <div className="table-header">
        <PanelTitle title="Municípios de Pernambuco" subtitle={`Mostrando ${filtered.length} de ${rows.length} municípios.`} />
        <span className="legend-dot">{indicator}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Município</th>
              <th>Região de Desenvolvimento</th>
              <th>Pontuação</th>
              <th>Faixa</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => {
              const score = getValue(row, indicator);
              return (
                <tr key={row.code}>
                  <td>
                    <span className={`rank-pill ${index < 3 ? "top" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                  </td>
                  <td>
                    <strong>{row.municipality}</strong>
                  </td>
                  <td>{row.region}</td>
                  <td className="score-cell">{formatNumber(score)}</td>
                  <td>{classify(score)}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => {
                        setSelectedCode(row.code);
                        setView("scorecard");
                      }}
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MapView({ data, rows, year, setYear, indicator, selectedCode, setSelectedCode }: { data: DashboardData; rows: RecordRow[]; year: number; setYear: (year: number) => void; indicator: string; selectedCode: string; setSelectedCode: (code: string) => void }) {
  const [mapMetric, setMapMetric] = useState(indicator || IPS);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const byCode = new globalThis.Map(rows.map((row) => [row.code, row]));
  const hovered = hoverCode ? byCode.get(hoverCode) : null;
  const breaks = mapBreaks(rows, mapMetric);

  return (
    <div className="map-workspace">
      <section className="map-toolbar">
        <Select label="Ano" value={String(year)} onChange={(value) => setYear(Number(value))} options={YEARS.map(String)} />
        <Select label="Indicador do mapa" value={mapMetric} onChange={setMapMetric} options={[IPS, ...data.dimensions, ...data.components]} wide />
      </section>

      <section className="panel map-panel">
        <div className="map-panel-header">
          <PanelTitle title="Mapa de Pernambuco" subtitle={`Cores por ${mapMetric}. Faixas calculadas sobre os municípios do ano selecionado.`} />
        </div>
        {hovered && (
          <div className="map-tooltip-card">
            <strong>{hovered.municipality}</strong>
            <span>{hovered.region}</span>
            <p>{mapMetric}</p>
            <em>{formatNumber(getValue(hovered, mapMetric))}</em>
          </div>
        )}
        <svg viewBox={data.map.viewBox} className="pe-map" role="img" aria-label="Mapa dos municípios de Pernambuco">
          {Object.entries(data.map.paths).map(([code, path]) => {
            const row = byCode.get(code);
            const score = row ? getValue(row, mapMetric) : null;
            return (
              <path
                key={code}
                d={path}
                fill={mapColor(score, breaks)}
                className={code === selectedCode ? "selected" : ""}
                onClick={() => row && setSelectedCode(code)}
                onMouseEnter={() => row && setHoverCode(code)}
                onMouseLeave={() => setHoverCode(null)}
              />
            );
          })}
        </svg>
        <div className="map-legend">
          <h3>Legenda</h3>
          {breaks.map((item) => (
            <div key={`${item.color}-${item.min}-${item.max}`}>
              <span style={{ background: item.color }} />
              <p>{formatNumber(item.min)} - {formatNumber(item.max)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DataDictionary({ data }: { data: DashboardData }) {
  const [query, setQuery] = useState("");
  const lowerQuery = query.trim().toLocaleLowerCase("pt-BR");
  const latestRows = data.records.filter((row) => row.year === 2026);
  const described = new Set([IPS, GDP, "População", "Área (km²)", ...data.dimensions, ...data.components, ...SCORECARD_GROUPS.flatMap((group) => group.components.flatMap((component) => component.indicators))]);
  const extraIndicators = data.indicators.filter((indicator) => !described.has(indicator));
  const indicatorDetail = (indicator: string) => INDICATOR_DETAILS_BY_SLUG[slugText(indicator)];
  const indicatorDescription = (indicator: string) => indicatorDetail(indicator)?.description ?? "Campo numérico presente na base de dados do IPS Pernambuco.";
  const visible = (name: string) => {
    const detail = indicatorDetail(name);
    const haystack = `${name} ${detail?.description ?? ""} ${detail?.source ?? ""} ${detail?.unit ?? ""} ${detail?.year ?? ""}`.toLocaleLowerCase("pt-BR");
    return !lowerQuery || haystack.includes(lowerQuery);
  };
  const coverage = (indicator: string) => latestRows.filter((row) => getValue(row, indicator) != null).length;
  const polarityLabel = (indicator: string) => (isLowerBetter(indicator) ? "Menor é melhor" : "Maior é melhor");
  const dictionaryRow = (indicator: string, type: string) => {
    if (!visible(indicator)) return null;
    const detail = indicatorDetail(indicator);
    return (
      <article key={`${type}-${indicator}`} className="dictionary-item">
        <div>
          <strong>{indicator}</strong>
          <span>{type}</span>
          <small>{indicatorDescription(indicator)}</small>
        </div>
        <dl>
          <div>
            <dt>Fonte</dt>
            <dd>{detail?.source ?? "Base IPS Pernambuco"}</dd>
          </div>
          <div>
            <dt>Unidade</dt>
            <dd>{detail?.unit ?? "Valor numérico"}</dd>
          </div>
          <div>
            <dt>Ano</dt>
            <dd>{detail?.year ?? "Variável"}</dd>
          </div>
        </dl>
        <p>{polarityLabel(indicator)}</p>
        <em>{coverage(indicator)}/{latestRows.length} municípios com dado em 2026</em>
      </article>
    );
  };

  return (
    <div className="dictionary-page">
      <section className="panel dictionary-hero">
        <div>
          <PanelTitle title="Dicionário de dados" subtitle="Campos, eixos, componentes, indicadores e regras de leitura usados no painel." />
          <div className="dictionary-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no dicionário..." />
          </div>
        </div>
        <div className="dictionary-note">
          <strong>Versão adaptada</strong>
          <span>Conteúdo reorganizado para o padrão visual do painel IPS Pernambuco.</span>
        </div>
      </section>

      <section className="dictionary-summary-grid">
        <article>
          <span>Municípios</span>
          <strong>185</strong>
          <p>Recorte Pernambuco</p>
        </article>
        <article>
          <span>Anos</span>
          <strong>2024-2026</strong>
          <p>Série disponível</p>
        </article>
        <article>
          <span>Indicadores</span>
          <strong>{data.indicators.length}</strong>
          <p>Campos numéricos monitorados</p>
        </article>
        <article>
          <span>Ranking</span>
          <strong>PE e BR</strong>
          <p>Cores por tercis em Pernambuco</p>
        </article>
      </section>

      <section className="dictionary-section">
        <div className="dictionary-section-title">
          <h2>Campos gerais</h2>
          <p>Variáveis de identificação, escala territorial e contexto econômico-demográfico.</p>
        </div>
        <div className="dictionary-list">
          {dictionaryRow(IPS, "Índice geral")}
          {dictionaryRow(GDP, "Contexto econômico")}
          {dictionaryRow("População", "Contexto demográfico")}
          {dictionaryRow("Área (km²)", "Contexto territorial")}
        </div>
      </section>

      {SCORECARD_GROUPS.map((group) => {
        const dimensionVisible = visible(group.dimension);
        const components = group.components
          .map((component) => ({
            ...component,
            show: visible(component.name) || component.indicators.some(visible),
          }))
          .filter((component) => component.show);
        if (!dimensionVisible && !components.length) return null;

        return (
          <section key={group.dimension} className="dictionary-section">
            <div className="dictionary-section-title">
              <h2>{group.dimension}</h2>
              <p>Eixo do IPS com componentes e indicadores associados.</p>
            </div>
            <div className="dictionary-component-grid">
              {components.map((component) => (
                <article key={component.name} className="dictionary-component-card">
                  <header>
                    <span>Componente</span>
                    <strong>{component.name}</strong>
                  </header>
                  <div className="dictionary-list compact">
                    {component.indicators.map((indicator) => dictionaryRow(indicator, "Indicador"))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {!!extraIndicators.filter(visible).length && (
        <section className="dictionary-section">
          <div className="dictionary-section-title">
            <h2>Outros campos da base</h2>
            <p>Campos presentes no arquivo de dados que não estão nos blocos do scorecard.</p>
          </div>
          <div className="dictionary-list">
            {extraIndicators.map((indicator) => dictionaryRow(indicator, "Campo complementar"))}
          </div>
        </section>
      )}
    </div>
  );
}

function Scorecard({ data, selected, year, selectedCode, setSelectedCode }: { data: DashboardData; selected?: RecordRow; year: number; selectedCode: string; setSelectedCode: (code: string) => void }) {
  const municipalityRows = data.records.filter((row) => row.code === selectedCode).sort((a, b) => a.year - b.year);
  const municipalities = data.records
    .filter((row) => row.year === year)
    .sort((a, b) => a.municipality.localeCompare(b.municipality, "pt-BR"));

  if (!selected) return null;

  const lineData = municipalityRows.map((row) => ({ year: row.year, IPS: getValue(row, IPS) }));
  const ipsRanks = selected.ranks?.[IPS] ?? {};
  const gdpRanks = selected.ranks?.["PIB per capita"] ?? {};
  const legend = rankLegend(ipsRanks.pe?.total ?? 185);

  return (
    <div className="scorecard-page">
      <section className="scorecard-header">
        <div className="scorecard-identity">
          <MunicipalitySelect value={selectedCode} onChange={setSelectedCode} rows={municipalities} />
          <p>{selected.municipality}</p>
          <span>Pernambuco · {selected.region}</span>
          <button className="button ghost print-button" onClick={() => window.print()}>
            <FileDown size={17} />
            Exportar PDF
          </button>
        </div>

        <div className="scorecard-kpis">
          <ScoreKpi title="IPS" subtitle={`Brasil · ${year}`} value={`${formatNumber(getValue(selected, IPS))} / 100`} tone={rankTone(ipsRanks)} brRank={formatRank(ipsRanks.br)} peRank={formatRank(ipsRanks.pe)} />
          <ScoreKpi title="PIB" subtitle="per capita" value={`R$ ${formatNumber(getValue(selected, "PIB per capita"))}`} tone={rankTone(gdpRanks)} brRank={formatRank(gdpRanks.br)} peRank={formatRank(gdpRanks.pe)} />
          <div className="mini-kpis">
            <MiniKpi icon={<UsersRound size={28} />} title="População" value={formatCompact(getValue(selected, "População"))} detail={year === 2026 ? "2025" : "2022"} />
            <MiniKpi icon={<LandPlot size={28} />} title="Área" value={formatNumber(getValue(selected, "Área (km²)"))} detail="km²" />
          </div>
        </div>
      </section>

      <section className="rank-legend-card">
        <div>
          <strong>Legenda de cores</strong>
          <span>Ranking em Pernambuco. A cor sempre considera a polaridade do indicador.</span>
        </div>
        <p><i className="status-dot green" /> Verde: {legend.green}</p>
        <p><i className="status-dot yellow" /> Amarelo: {legend.yellow}</p>
        <p><i className="status-dot red" /> Vermelho: {legend.red}</p>
      </section>

      <div className="scorecard-summary">
        <section className="panel">
          <PanelTitle title="Evolução do IPS" subtitle="Comparação anual disponível na base." />
          <TrendChart data={lineData} />
        </section>
        <section className="panel">
          <PanelTitle title="Leitura rápida" subtitle="Dimensões principais do município." />
          <div className="dimension-list">
            {data.dimensions.map((item) => (
              <Progress key={item} label={item} value={getValue(selected, item)} />
            ))}
          </div>
        </section>
      </div>

      <section className="dimension-card-grid">
        {SCORECARD_GROUPS.map((group) => (
          <DimensionCard key={group.dimension} group={group} selected={selected} />
        ))}
      </section>
    </div>
  );
}

function TrendChart({ data }: { data: { year: number; IPS: number | null }[] }) {
  const valid = data.filter((item): item is { year: number; IPS: number } => typeof item.IPS === "number");
  if (!valid.length) return <div className="trend-chart empty">Sem dados para o período.</div>;

  const width = 720;
  const height = 220;
  const padding = { top: 22, right: 28, bottom: 34, left: 48 };
  const minValue = Math.min(...valid.map((item) => item.IPS));
  const maxValue = Math.max(...valid.map((item) => item.IPS));
  const spread = Math.max(1, maxValue - minValue);
  const yMin = minValue - spread * 0.25;
  const yMax = maxValue + spread * 0.25;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const xFor = (index: number) => padding.left + (innerWidth * index) / Math.max(1, valid.length - 1);
  const yFor = (value: number) => padding.top + ((yMax - value) / (yMax - yMin)) * innerHeight;
  const path = valid.map((item, index) => `${index === 0 ? "M" : "L"} ${xFor(index).toFixed(2)} ${yFor(item.IPS).toFixed(2)}`).join(" ");
  const ticks = [yMax, yMin + (yMax - yMin) / 2, yMin];

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução anual do IPS">
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5edf3" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end">
                {formatNumber(tick, 1)}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#006591" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {valid.map((item, index) => (
          <g key={item.year}>
            <circle cx={xFor(index)} cy={yFor(item.IPS)} r="5" fill="#ffffff" stroke="#006591" strokeWidth="3" />
            <text x={xFor(index)} y={height - 10} textAnchor="middle">
              {item.year}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ScoreKpi({ title, subtitle, value, tone, brRank, peRank }: { title: string; subtitle: string; value: string; tone: string; brRank: string; peRank: string }) {
  return (
    <article className="score-kpi">
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className={`status-square ${tone}`} />
      <p>{value}</p>
      <footer>
        <span>
          <Flag type="br" />
          {brRank}
        </span>
        <span>
          <Flag type="pe" />
          {peRank}
        </span>
      </footer>
    </article>
  );
}

function MiniKpi({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <article className="mini-kpi">
      {icon}
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <p>{value}</p>
    </article>
  );
}

function DimensionCard({ group, selected }: { group: (typeof SCORECARD_GROUPS)[number]; selected: RecordRow }) {
  const dimensionScore = getValue(selected, group.dimension);
  const ranks = selected.ranks?.[group.dimension];
  return (
    <article className="dimension-card">
      <header>
        <h2>{group.dimension}</h2>
        <div>
          <span>Pontuação</span>
          <strong>{formatNumber(dimensionScore)}</strong>
          <RankPair ranks={ranks} compact />
        </div>
        <div className={`status-square ${rankTone(ranks)}`} />
      </header>
      <div className="component-blocks">
        {group.components.map((component) => {
          const score = getValue(selected, component.name);
          return (
            <section key={component.name} className="component-block">
              <div className="component-title">
                <strong>{component.name}</strong>
                <span>{formatNumber(score)}</span>
                <i className={`status-dot ${rankTone(selected.ranks?.[component.name])}`} />
              </div>
              <div className="indicator-list">
                {component.indicators.map((indicator) => {
                  const value = getValue(selected, indicator);
                  return (
                    <div key={indicator}>
                      <span>{indicator}</span>
                      <strong>{formatNumber(value)}</strong>
                      <i className={`status-dot ${rankTone(selected.ranks?.[indicator])}`} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function ChartsPage({ data, year, tab, setTab }: { data: DashboardData; year: number; tab: ChartTab; setTab: (tab: ChartTab) => void }) {
  const [radarYear, setRadarYear] = useState(2026);
  const [temporalYear, setTemporalYear] = useState(2026);
  const activeYear = tab === "radar" ? radarYear : year;
  const yearRows = data.records.filter((row) => row.year === activeYear).sort((a, b) => a.municipality.localeCompare(b.municipality, "pt-BR"));
  const temporalRows = data.records.filter((row) => row.year === temporalYear).sort((a, b) => a.municipality.localeCompare(b.municipality, "pt-BR"));
  const [radarCodes, setRadarCodes] = useState(["2605459", "2604106", "2611101"]);
  const [temporalCodes, setTemporalCodes] = useState(["2600054", "2600104", "2611606"]);
  const [radarPick, setRadarPick] = useState(yearRows[0]?.code ?? "");
  const [temporalPick, setTemporalPick] = useState(yearRows[0]?.code ?? "");
  const [temporalIndicator, setTemporalIndicator] = useState(IPS);

  const addRadar = () => {
    if (radarPick && !radarCodes.includes(radarPick) && radarCodes.length < 6) setRadarCodes([...radarCodes, radarPick]);
  };
  const addTemporal = () => {
    if (temporalPick && !temporalCodes.includes(temporalPick) && temporalCodes.length < 6) setTemporalCodes([...temporalCodes, temporalPick]);
  };

  return (
    <div className="charts-page">
      <div className="chart-tabs">
        <button className={tab === "radar" ? "active" : ""} onClick={() => setTab("radar")}>Comparação de municípios</button>
        <button className={tab === "regression" ? "active" : ""} onClick={() => setTab("regression")}>Gráfico de regressão</button>
        <button className={tab === "temporal" ? "active" : ""} onClick={() => setTab("temporal")}>Gráfico de evolução temporal</button>
      </div>

      {tab === "radar" && (
        <section className="panel chart-panel">
          <PanelTitle title="Comparação de municípios" subtitle={`Selecione até 6 municípios para comparar componentes do IPS ${radarYear}.`} />
          <div className="chart-filter-row">
            <Select label="Ano" value={String(radarYear)} onChange={(value) => setRadarYear(Number(value))} options={YEARS.map(String)} />
          </div>
          <MunicipalityPicker rows={yearRows} value={radarPick} onChange={setRadarPick} onAdd={addRadar} disabled={radarCodes.length >= 6} />
          <ChipList codes={radarCodes} data={data} onRemove={(code) => setRadarCodes(radarCodes.filter((item) => item !== code))} />
          <RadarComparison rows={yearRows} selectedCodes={radarCodes} />
        </section>
      )}

      {tab === "regression" && (
        <section className="panel chart-panel">
          <PanelTitle title="Gráfico de regressão" subtitle={`Relação entre PIB per capita e IPS em Pernambuco, ${year}.`} />
          <RegressionChart rows={yearRows} />
        </section>
      )}

      {tab === "temporal" && (
        <section className="panel chart-panel">
          <PanelTitle title="Gráfico de evolução temporal" subtitle="Selecione até 6 municípios para comparar a evolução anual." />
          <div className="chart-filter-row">
            <Select label="Ano de referência" value={String(temporalYear)} onChange={(value) => setTemporalYear(Number(value))} options={YEARS.map(String)} />
          </div>
          <div className="chart-controls two">
            <MunicipalityPicker rows={temporalRows} value={temporalPick} onChange={setTemporalPick} onAdd={addTemporal} disabled={temporalCodes.length >= 6} />
            <Select label="Indicador" value={temporalIndicator} onChange={setTemporalIndicator} options={[IPS, ...data.dimensions, ...data.components]} wide />
          </div>
          <ChipList codes={temporalCodes} data={data} onRemove={(code) => setTemporalCodes(temporalCodes.filter((item) => item !== code))} />
          <TemporalComparison data={data} selectedCodes={temporalCodes} indicator={temporalIndicator} />
        </section>
      )}
    </div>
  );
}

function MunicipalityPicker({ rows, value, onChange, onAdd, disabled }: { rows: RecordRow[]; value: string; onChange: (value: string) => void; onAdd: () => void; disabled?: boolean }) {
  return (
    <div className="chart-controls">
      <MunicipalitySelect value={value} onChange={onChange} rows={rows} />
      <button className="button" onClick={onAdd} disabled={disabled}>Adicionar</button>
    </div>
  );
}

function ChipList({ codes, data, onRemove }: { codes: string[]; data: DashboardData; onRemove: (code: string) => void }) {
  const byCode = new Map(data.records.map((row) => [row.code, row.municipality]));
  return (
    <div className="chip-list">
      {codes.map((code) => (
        <button key={code} onClick={() => onRemove(code)}>
          {byCode.get(code) ?? code}
          <span>×</span>
        </button>
      ))}
    </div>
  );
}

function RadarComparison({ rows, selectedCodes }: { rows: RecordRow[]; selectedCodes: string[] }) {
  const selectedRows = selectedCodes.map((code) => rows.find((row) => row.code === code)).filter((row): row is RecordRow => Boolean(row));
  const radarData = SCORECARD_GROUPS.flatMap((group) => group.components).map((component) => {
    const item: Record<string, string | number | null> = { component: shortComponent(component.name) };
    selectedRows.forEach((row) => {
      item[row.municipality] = getValue(row, component.name);
    });
    return item;
  });

  return (
    <div className="large-chart">
      <ResponsiveContainer>
        <RadarChart data={radarData} outerRadius="76%">
          <PolarGrid />
          <PolarAngleAxis dataKey="component" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
          <Legend />
          {selectedRows.map((row, index) => (
            <Radar key={row.code} name={row.municipality} dataKey={row.municipality} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.08} strokeWidth={2} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RegressionChart({ rows }: { rows: RecordRow[] }) {
  const basePoints = rows
    .map((row) => ({ x: getValue(row, GDP), y: getValue(row, IPS), name: row.municipality }))
    .filter((item): item is { x: number; y: number; name: string } => typeof item.x === "number" && typeof item.y === "number");
  const labeled = new Set([
    ...[...basePoints].sort((a, b) => b.x - a.x).slice(0, 6).map((item) => item.name),
    ...[...basePoints].sort((a, b) => b.y - a.y).slice(0, 6).map((item) => item.name),
    ...[...basePoints].sort((a, b) => a.y - b.y).slice(0, 4).map((item) => item.name),
  ]);
  const points = basePoints.map((item) => ({ ...item, label: labeled.has(item.name) ? item.name : "" }));
  const regression = linearRegression(points);
  const xMin = Math.min(...points.map((item) => item.x));
  const xMax = Math.max(...points.map((item) => item.x));
  const line = [
    { x: xMin, y: regression.slope * xMin + regression.intercept },
    { x: xMax, y: regression.slope * xMax + regression.intercept },
  ];

  return (
    <div className="large-chart">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 32, bottom: 34, left: 12 }}>
          <CartesianGrid stroke="#e2e8f0" />
          <XAxis type="number" dataKey="x" name="PIB per capita" tickFormatter={(value) => `R$ ${formatCompact(Number(value))}`} tick={{ fontSize: 12 }} />
          <YAxis type="number" dataKey="y" name="IPS" domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => (name === "PIB per capita" ? `R$ ${formatNumber(Number(value))}` : formatNumber(Number(value)))} labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""} />
          <Scatter name="Municípios" data={points} fill="#006591" fillOpacity={0.68}>
            <LabelList dataKey="label" position="right" className="scatter-label" />
          </Scatter>
          <Line type="linear" data={line} dataKey="y" stroke="#0f172a" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function TemporalComparison({ data, selectedCodes, indicator }: { data: DashboardData; selectedCodes: string[]; indicator: string }) {
  const years = YEARS.slice().reverse();
  const rows = years.map((year) => {
    const item: Record<string, string | number | null> = { year };
    selectedCodes.forEach((code) => {
      const row = data.records.find((record) => record.year === year && record.code === code);
      if (row) item[row.municipality] = getValue(row, indicator);
    });
    return item;
  });
  const names = selectedCodes
    .map((code) => data.records.find((row) => row.code === code)?.municipality)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="large-chart">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 20, right: 32, bottom: 28, left: 10 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
          <Legend />
          {names.map((name, index) => (
            <Line key={name} type="monotone" dataKey={name} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortComponent(value: string) {
  return value
    .replace("Acesso ao ", "Acesso ")
    .replace("Nutrição e Cuidados Médicos Básicos", "Nutrição")
    .replace("Acesso à Informação e Comunicação", "Informação")
    .replace("Liberdades Individuais e de Escolha", "Liberdades")
    .replace("Qualidade do Meio Ambiente", "Meio Ambiente")
    .replace("Acesso à Educação Superior", "Ed. Superior");
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length || 1;
  const sumX = points.reduce((sum, item) => sum + item.x, 0);
  const sumY = points.reduce((sum, item) => sum + item.y, 0);
  const sumXY = points.reduce((sum, item) => sum + item.x * item.y, 0);
  const sumXX = points.reduce((sum, item) => sum + item.x * item.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = sumY / n - slope * (sumX / n);
  return { slope, intercept };
}

function Progress({ label, value }: { label: string; value: number | null }) {
  const width = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
      </div>
      <div className="track">
        <span style={{ width: `${width}%`, background: scoreColor(value) }} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
