// Downloads League of Legends skin art (via CommunityDragon) into public/.
// Run: npm run art   (behind a corporate proxy: set HTTPS_PROXY and NODE_USE_ENV_PROXY=1)
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CDRAGON = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default";

const majors = [
  ["the-fool", "Zoe"], ["the-magician", "Ryze"], ["the-high-priestess", "Karma"], ["the-empress", "Ashe"],
  ["the-emperor", "Azir"], ["the-hierophant", "Taric"], ["the-lovers", "Xayah"], ["the-chariot", "Hecarim"],
  ["strength", "Braum"], ["the-hermit", "Zilean"], ["wheel-of-fortune", "TwistedFate"], ["justice", "Kayle"],
  ["the-hanged-man", "Shen"], ["death", "Kindred"], ["temperance", "Janna"], ["the-devil", "Evelynn"],
  ["the-tower", "Xerath"], ["the-star", "Soraka"], ["the-moon", "Diana"], ["the-sun", "Leona"],
  ["judgement", "Morgana"], ["the-world", "AurelionSol"],
];
const ranks = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"];
const suits = {
  cups: ["Fizz", "Rakan", "Lulu", "Yuumi", "Vex", "Milio", "Ahri", "Pyke", "Seraphine", "Sona", "Neeko", "Nautilus", "Nami", "TahmKench"],
  pentacles: ["Ezreal", "Corki", "Heimerdinger", "Nasus", "Poppy", "Renata", "Ornn", "Jayce", "Caitlyn", "Sivir", "Vi", "Graves", "MissFortune", "Gangplank"],
  swords: ["Yasuo", "Yone", "Irelia", "MasterYi", "Talon", "Kayn", "Katarina", "Gwen", "Aatrox", "Tryndamere", "Riven", "Camille", "Fiora", "Garen"],
  wands: ["Lux", "Taliyah", "Orianna", "Lillia", "Brand", "Syndra", "Veigar", "Anivia", "Leblanc", "Velkoz", "Annie", "Jinx", "Zyra", "Swain"],
};
const assignments = [
  ...majors,
  ...Object.entries(suits).flatMap(([suit, champs]) => champs.map((champ, index) => [`${ranks[index]}-of-${suit}`, champ])),
];

// Skin lines that fit a mystical tarot mood, in priority order. "Arcana" skins are literally tarot-themed.
const preferredLines = ["Arcana", "Star Guardian", "Spirit Blossom", "Lunar", "Elderwood", "Faerie Court", "Immortal Journey", "Dawnbringer", "Nightbringer", "Coven", "Mythmaker", "Winterblessed", "Porcelain", "Crystalis", "Divine"];
const overrides = { Diana: "Lunar Goddess", Leona: "Solar Eclipse", Soraka: "Star Guardian", Kindred: "Spirit Blossom", Velkoz: "Arclight" };

// Wide splash images used for topic tiles and the hero background.
const splashes = { love: "the-lovers", career: "the-emperor", finance: "queen-of-pentacles", general: "the-star", hero: "the-magician" };

const toUrl = (path) => `${CDRAGON}/${path.replace("/lol-game-data/assets/", "").toLowerCase()}`;

async function fetchWithRetry(url, attempts = 4) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (attempt >= attempts || response.status < 500) throw new Error(`${response.status} ${url}`);
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
}

async function getJson(url) {
  return (await fetchWithRetry(url)).json();
}

async function download(url, file) {
  try {
    await access(file);
    return;
  } catch { /* not downloaded yet */ }
  const response = await fetchWithRetry(url);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

function pickSkin(champion) {
  const skins = champion.skins.filter((skin) => !skin.isBase && !skin.name.includes("Prestige"));
  const override = overrides[champion.alias];
  for (const line of override ? [override, ...preferredLines] : preferredLines) {
    const match = skins.find((skin) => skin.name.includes(line));
    if (match) return match;
  }
  return skins.at(-1) ?? champion.skins[0];
}

async function main() {
  const summary = await getJson(`${CDRAGON}/v1/champion-summary.json`);
  const idByAlias = new Map(summary.map((item) => [item.alias.toLowerCase(), item.id]));
  await mkdir(join(ROOT, "public", "cards"), { recursive: true });
  await mkdir(join(ROOT, "public", "splash"), { recursive: true });

  const result = {};
  const queue = [...assignments];
  async function worker() {
    while (queue.length) {
      const [cardId, alias] = queue.shift();
      const championId = idByAlias.get(alias.toLowerCase());
      if (!championId) throw new Error(`Unknown champion ${alias}`);
      const champion = await getJson(`${CDRAGON}/v1/champions/${championId}.json`);
      const skin = pickSkin(champion);
      await download(toUrl(skin.loadScreenPath), join(ROOT, "public", "cards", `${cardId}.jpg`));
      result[cardId] = { champion: champion.name, skin: skin.isBase ? champion.name : skin.name, splash: toUrl(skin.splashPath) };
      console.log(`${cardId.padEnd(22)} ${result[cardId].skin}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  for (const [name, cardId] of Object.entries(splashes)) {
    try {
      await download(result[cardId].splash, join(ROOT, "public", "splash", `${name}.jpg`));
    } catch (error) {
      console.warn(`Skipped splash "${name}": ${error.message}`);
    }
  }

  console.log(`Done: ${assignments.length} cards.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
