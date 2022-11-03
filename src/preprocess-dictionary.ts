import * as stringSimilarity from "string-similarity";
import { getDocumentoComissaoPlanos2022 } from "./sources";
import { getRecursosPorFavorecidos } from "./sources";
import { appendFile, writeFile } from "fs/promises";
import { groupBy } from "lodash";
import * as path from "path";
const cliProgress = require("cli-progress");

async function preProcessDictionary() {
  const documentoComissaoPlanos2022 = getDocumentoComissaoPlanos2022();
  const recursosPorFavorecidos = await getRecursosPorFavorecidos();

  const nomesDocumentoComissaoPlanos = documentoComissaoPlanos2022.map((row) => row["Nome beneficiário"].trim());
  const nomesUnicosDocumentoComissaoPlanos = [...new Set(nomesDocumentoComissaoPlanos)];

  const nomesFavorecidos = Object.values(recursosPorFavorecidos)
    .flat()
    .map((row) => row["Nome Favorecido"].trim());
  const nomesFavorecidosUnicos = [...new Set(nomesFavorecidos)];
  const nomesFavorecidosPorLetraInicial = groupBy(nomesFavorecidosUnicos, (str) => str.slice(0, 1));

  const mismatches = [];
  const errors = [];
  console.log("Preprocessando dicionário documento da comissão de planos -> portal da transparência...");
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  let i = 0;
  bar1.start(nomesUnicosDocumentoComissaoPlanos.length, 0);
  for (const beneficiarioDocComissaoPlanos of nomesUnicosDocumentoComissaoPlanos) {
    try {
      const letraInicialBeneficiarioDocumentoComissaoPlanos = beneficiarioDocComissaoPlanos.slice(0, 1);
      const match = stringSimilarity.findBestMatch(beneficiarioDocComissaoPlanos, nomesFavorecidosPorLetraInicial[letraInicialBeneficiarioDocumentoComissaoPlanos]);
      if (match.bestMatch.rating > 0.9) {
        await appendFile(path.join(__dirname, `../dicionario.csv`), `${beneficiarioDocComissaoPlanos};${match.bestMatch.target}\n`);
      } else {
        mismatches.push(beneficiarioDocComissaoPlanos);
      }
    } catch (error) {
      errors.push(error);
    }

    bar1.update(i++);
  }
  bar1.stop();
  await writeFile(path.join(__dirname, "../error-report.json"), JSON.stringify(errors, null, `\t`));
  await writeFile(path.join(__dirname, "../mismatches.json"), JSON.stringify(mismatches, null, `\t`));
  console.log("done!");
}

preProcessDictionary();
