import * as moment from "moment";
import { getRecursosPorFavorecidos, getRelacaoIndicacoes2022 } from "./sources";

async function main() {
  const municipios = {};

  const recursosPorFavorecidoCache = await getRecursosPorFavorecidos();
  const relacaoIndicacoes2022 = await getRelacaoIndicacoes2022();

  console.log("total", relacaoIndicacoes2022.length);
  for (const row of relacaoIndicacoes2022) {
    const anoMes = moment(row["Data de cadastro"]).format("YYYYMM");

    const resultadoDb = recursosPorFavorecidoCache[anoMes];

    const registroEquivalente = resultadoDb.find((row) => row["Nome Favorecido"] === row["Nome beneficiário"]);

    const valor = Number(registroEquivalente["Valor Recebido"].replace(",", "."));

    if (!municipios[row["Nome Município"]]) {
      municipios[row["Nome Município"]] = valor;
    } else {
      municipios[row["Nome Município"]] += valor;
    }

    console.count("item");
  }
  console.log(Object.fromEntries(Object.entries<number>(municipios).sort(([, a], [, b]) => a - b)));
}

main();
