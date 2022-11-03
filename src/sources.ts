import * as XLSX from "xlsx";
import { createClient } from "redis";
import { range } from "lodash";
import * as path from "path";
const cliProgress = require("cli-progress");

const pathRelacaoIndicacoes2022 = "../dados/Relacao-de-indicacoes-Consolidado-2022.xlsx";

// https://www2.camara.leg.br/atividade-legislativa/comissoes/comissoes-mistas/cmo/Indicacoes-para-execucao-orcamentaria-em-RP9_LOA-2022
export const getDocumentoComissaoPlanos2022 = () =>
  XLSX.utils.sheet_to_json(
    XLSX.readFile(path.join(__dirname, pathRelacaoIndicacoes2022), {
      cellDates: true,
    }).Sheets.Plan1
  );

// https://www.portaltransparencia.gov.br/download-de-dados/despesas-favorecidos
export const getRecursosPorFavorecidos = async () => {
  const recursosPorFavorecidoCache = {};
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  const redis = createClient();
  redis.on("error", (err) => console.log("Redis Client Error", err));

  console.log("Buscando Recursos por Favorecidos (Portal da Transparência) no cache")
  bar1.start(12, 1);
  await redis.connect();
  await Promise.all(
    range(1, 12).map(async (mes) => {
      const anoMes = `${2022}${mes.toString().padStart(2, "0")}`;

      const raw = await redis.get(anoMes);
      recursosPorFavorecidoCache[anoMes] = JSON.parse(raw);
      bar1.update(mes);
    })
  );
  await redis.disconnect();
  bar1.stop();
  return recursosPorFavorecidoCache;
};
