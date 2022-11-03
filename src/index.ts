import * as moment from "moment";
import * as csv from "csvtojson";
import * as path from "path";
import { getRecursosPorFavorecidos, getDocumentoComissaoPlanos2022 } from "./sources";
const cliProgress = require("cli-progress");

async function main() {
  const municipios = {};

  const recursosPorFavorecidoPorAnoMes = await getRecursosPorFavorecidos();
  const documentoComissao2022 = await getDocumentoComissaoPlanos2022();
  const rawDictionaryFromCsv = await csv({ headers: ["beneficiario", "favorecido"], delimiter: ";" }).fromFile(
    path.join(__dirname, "../dicionario.csv")
  );
  const dictionaryDocumentoComissaoParaPortalTransparencia = Object.fromEntries(
    rawDictionaryFromCsv.map((line) => [line["beneficiario"], line["favorecido"]])
  );

  console.log("Buscando Recursos por Favorecidos (Portal da Transparência) no cache");
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(documentoComissao2022.length, 0);
  const errors = [];
  let i = 0;
  for (const linhaDocumentoComissao of documentoComissao2022) {
    try {
      const anoMes = moment(linhaDocumentoComissao["Data de cadastro"]).format("YYYYMM");

      const recursosPorFavorecido = recursosPorFavorecidoPorAnoMes[anoMes];

      const registroEquivalente = recursosPorFavorecido.find(
        (row) => row["Nome Favorecido"] === dictionaryDocumentoComissaoParaPortalTransparencia[row["Nome Favorecido"]]
      );

      const valor = Number(registroEquivalente["Valor Recebido"].replace(",", "."));

      if (!municipios[linhaDocumentoComissao["Nome Município"]]) {
        municipios[linhaDocumentoComissao["Nome Município"]] = valor;
      } else {
        municipios[linhaDocumentoComissao["Nome Município"]] += valor;
      }
      bar1.update(i++);
    } catch (error) {
      errors.push(error);
    }
  }
  bar1.stop();
  console.log(Object.fromEntries(Object.entries<number>(municipios).sort(([, a], [, b]) => a - b)));
}

main();
