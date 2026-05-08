import fs from 'node:fs/promises';
import JSON5 from 'json5';

process.chdir(import.meta.dirname);

interface FoodLevelRange {
  version: string;
  min: number;
  max: number;
}

const FOOD_LEVEL_RANGES: readonly FoodLevelRange[] = [
  { version: '6.0',  min: 520, max: 560 },
  { version: '6.05', min: 580, max: 580 },
  { version: '6.2',  min: 610, max: 610 },
  { version: '6.4',  min: 640, max: 640 },
  { version: '7.0',  min: 650, max: 690 },
  { version: '7.05', min: 710, max: 710 },
  { version: '7.2',  min: 740, max: 740 },
  { version: '7.4',  min: 770, max: 770 },
] as const;

const stringifyModule = (obj: unknown): string => `export default ${JSON5.stringify(obj, null, 2)};`;

const writeModule = async (filePath: string, obj: unknown) => {
  console.log(`writeModule(${filePath})`);
  await fs.writeFile(filePath, stringifyModule(obj), 'utf8');
};

async function parseSources(filePath: string) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const sourceMap = new Map<number, string>();
  const versionMap = new Map<number, string>();

  let source: string | undefined;
  let version: string | undefined;
  for (let line of lines) {
    if (line === '') {
      source = version = undefined;
      continue;
    }

    const versionMatch = line.match(/@(?<version>[^\s#]+)/);
    if (versionMatch?.groups) {
      version = versionMatch.groups.version;
    }

    line = line.replace(/\s*[#@].*/, '');
    if (source === undefined) {
      source = line;
      continue;
    }

    const [start, end] = line.split('-').map(Number);
    const stop = end ?? start;

    for (let id = start; id <= stop; id++) {
      if (sourceMap.has(id)) throw new Error(`装备 ${id} 来源存在冲突。`);
      sourceMap.set(id, source);
      if (version) versionMap.set(id, version);
    }
  }

  return versionMap;
}

const { default: levelGroupBasis } = await import('./out/gearGroupBasis.js');
const lastGroupId = levelGroupBasis.at(-1)!;
const versionMap = await parseSources('./in/sources.txt');

const gearTasks = levelGroupBasis.map(async (groupId: string | number) => {
  const isLast = groupId === lastGroupId;
  const filePath = `./out/gears-${isLast ? 'recent' : groupId}.js`;

  const { default: gears } = await import(filePath);

  let changed = false;
  for (const gear of gears) {
    const version = versionMap.get(gear.id);
    if (version !== undefined && version !== gear.version) {
      gear.version = version;
      changed = true;
    }
  }

  if (changed) await writeModule(filePath, gears);
});

const foodTask = (async () => {
  const foodPath = './out/foods.js';
  const { default: foods } = await import(foodPath);

  let changed = false;
  for (const food of foods) {
    const matched = FOOD_LEVEL_RANGES.find(r => food.level >= r.min && food.level <= r.max);
    if (matched && food.version !== matched.version) {
      food.version = matched.version;
      changed = true;
    }
  }

  if (changed) await writeModule(foodPath, foods);
})();

await Promise.all([...gearTasks, foodTask]);
