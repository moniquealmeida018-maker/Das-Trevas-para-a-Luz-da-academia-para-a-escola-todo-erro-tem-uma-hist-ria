import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../dist/server/wrangler.json", import.meta.url);
const databaseId = process.env.D1_DATABASE_ID;

if (!databaseId || databaseId === "COLE_AQUI_O_DATABASE_ID") {
  throw new Error(
    "Defina D1_DATABASE_ID com o identificador do banco das-trevas-para-a-luz-db antes de publicar.",
  );
}

const config = JSON.parse(await readFile(configPath, "utf8"));
config.name = process.env.CLOUDFLARE_WORKER_NAME || "das-trevas-para-a-luz";
config.topLevelName = config.name;
config.d1_databases = [
  {
    binding: "DB",
    database_name: "das-trevas-para-a-luz-db",
    database_id: databaseId,
  },
];

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Configuração preparada para ${config.name} e banco ${databaseId}.`);
