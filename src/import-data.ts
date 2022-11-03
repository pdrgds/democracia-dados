import { readdir } from "fs/promises";
import * as path from "path";
import { readCsv } from "./utils";
import { createClient } from "redis";

const redis = createClient();

redis.on("error", (err) => console.log("Redis Client Error", err));

const recursosPorFavorecidoRoot = "../dados/RecebimentoRecursosPorFavorecido";

export async function importData() {
  console.time();
  const recursosPorFavorecidoFolder = (await readdir(path.join(__dirname, recursosPorFavorecidoRoot))).filter(
    (filename) => filename.includes("csv")
  );

  await redis.connect();

  const cache = {};
  for (const filename of recursosPorFavorecidoFolder) {
    console.log(filename, "start!");
    const parsedCsv = await readCsv(path.join(__dirname, recursosPorFavorecidoRoot, filename));
    await redis.set(filename.slice(0, 6), JSON.stringify(parsedCsv));
  }

  await redis.disconnect();
  console.timeEnd();
}

importData();
