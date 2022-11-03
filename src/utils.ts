import * as csv from "csvtojson";

export const readCsv = (path) => csv({ delimiter: ";" }).fromFile(path, { encoding: "latin1" });
