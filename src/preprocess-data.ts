import * as stringSimilarity from "string-similarity";
import { getRelacaoIndicacoes2022 } from "./sources";
import { createClient } from "redis";
import { getRecursosPorFavorecidos } from "./sources";
import { appendFile, writeFile } from "fs/promises";
import { groupBy } from "lodash";
import * as path from "path";
const cliProgress = require("cli-progress");

async function preProcessData() {
  const relacaoIndicacoes2022 = getRelacaoIndicacoes2022();
  const recursosPorFavorecidos = await getRecursosPorFavorecidos();

  const nomesBeneficiarios = relacaoIndicacoes2022.map((row) => row["Nome beneficiário"].trim());
  const nomesBeneficiariosUnicos = [...new Set(nomesBeneficiarios)];

  const nomesFavorecidos = Object.values(recursosPorFavorecidos)
    .flat()
    .map((row) => row["Nome Favorecido"].trim());
  const nomesFavorecidosUnicos = [...new Set(nomesFavorecidos)];
  const porLetraInicial = groupBy(nomesFavorecidosUnicos, (str) => str.slice(0, 1));

  const mismatches = [];
  const errors = [];
  console.log("Preprocessando dicionário de nomes de beneficiários...");
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  let i = 0;
  bar1.start(nomesBeneficiariosUnicos.length, 0);
  for (const beneficiario of nomesBeneficiariosUnicos) {
    try {
      const letraInicial = beneficiario.slice(0, 1);
      const match = stringSimilarity.findBestMatch(beneficiario, porLetraInicial[letraInicial]);
      if (match.bestMatch.rating > 0.9) {
        await appendFile(path.join(__dirname, `../dicionario.csv`), `${beneficiario};${match.bestMatch.target}\n`);
      } else {
        mismatches.push(beneficiario);
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

preProcessData();
