/* 构建 OGF 商号索引快照：从 OpenGeofiction 的 Overpass API 拉取 brand / branch / operator 要素，
   聚合成 web/data 下的 meta.json + brands.json + operators.json。用法：
     node scripts/build-index.mjs              # 使用 cache/ 中已有分块，缺失的才下载
     node scripts/build-index.mjs --refresh    # 忽略缓存重新下载全量分块
     node scripts/build-index.mjs --countries  # 额外按 admin_level=2 逐国生成 countries/<id>.json
     node scripts/build-index.mjs --countries --refresh-countries  # 重新抓取各国品牌要素
*/
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ENDPOINT = 'https://overpass.opengeofiction.net/api/interpreter';
const CACHE = join(import.meta.dirname, '..', 'cache');
const DATA = join(import.meta.dirname, '..', 'web', 'data');
const OUT = join(DATA, 'meta.json');
const OUT_BRANDS = join(DATA, 'brands.json');
const OUT_OPERATORS = join(DATA, 'operators.json');
const OUT_COUNTRIES = join(DATA, 'countries');
const AL2_CACHE = join(CACHE, 'al2');
const REFRESH = process.argv.includes('--refresh');
const WITH_COUNTRIES = process.argv.includes('--countries');
const REFRESH_COUNTRIES = process.argv.includes('--refresh-countries');
const COUNTRY_LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const FIELDS = ['::type', '::id', 'brand', 'branch', 'operator', 'shop', 'amenity', 'tourism', 'office',
  'craft', 'leisure', 'healthcare', 'public_transport', 'railway', 'highway', 'network', '"addr:city"', 'name'];
const CATEGORY_KEYS = ['shop', 'amenity', 'tourism', 'office', 'craft', 'leisure', 'healthcare', 'public_transport', 'railway', 'highway'];

function csvQuery(statements) {
  return `[out:csv(${FIELDS.join(',')};false;"|")][timeout:200];\n(\n${statements.join('\n')}\n);\nout;`;
}

const CHUNKS = [
  { name: 'brand-nodes', statements: ['node["brand"];'] },
  { name: 'brand-ways', statements: ['way["brand"];'] },
  { name: 'brand-relations', statements: ['relation["brand"];'] },
  { name: 'branch-nodes', statements: ['node["branch"];'] },
  { name: 'branch-ways', statements: ['way["branch"];'] },
  { name: 'operator-transport', statements: ['node["operator"]["public_transport"];'] },
  { name: 'operator-amenity-nodes', statements: ['node["operator"]["amenity"];'] },
  { name: 'operator-amenity-ways', statements: ['way["operator"]["amenity"];'] },
  { name: 'operator-shop', statements: ['node["operator"]["shop"];', 'way["operator"]["shop"];'] },
  { name: 'operator-other', statements: [
    'node["operator"]["tourism"];', 'way["operator"]["tourism"];',
    'node["operator"]["office"];', 'way["operator"]["office"];',
    'node["operator"]["craft"];', 'node["operator"]["leisure"];', 'way["operator"]["leisure"];',
    'node["operator"]["healthcare"];', 'way["operator"]["healthcare"];'
  ] }
];

async function download(chunk) {
  const file = join(CACHE, chunk.name + '.csv');
  if (!REFRESH && existsSync(file)) {
    const text = await readFile(file, 'utf8');
    console.log(`  cache ${chunk.name}: ${text ? text.split('\n').length - 1 : 0} rows`);
    return text;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240000);
  const started = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(csvQuery(chunk.statements)),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const text = await res.text();
    if (!text.includes('|')) throw new Error('空响应或非 CSV：' + text.slice(0, 200));
    await writeFile(file, text, 'utf8');
    console.log(`  fetch ${chunk.name}: ${text.split('\n').length - 1} rows, ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function rows(text) {
  const out = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('|');
    if (f.length !== FIELDS.length) { skipped++; continue; }
    out.push({
      type: f[0], id: f[1], brand: f[2], branch: f[3], operator: f[4],
      shop: f[5], amenity: f[6], tourism: f[7], office: f[8], craft: f[9], leisure: f[10],
      healthcare: f[11], public_transport: f[12], railway: f[13], highway: f[14], network: f[15],
      city: f[16], name: f[17]
    });
  }
  return { out, skipped };
}

function categoryOf(r) {
  for (const k of CATEGORY_KEYS) if (r[k]) return { key: k, value: r[k] };
  return null;
}

function bump(map, key) { if (key) map.set(key, (map.get(key) || 0) + 1); }
function add(set, value, cap) { if (value && set.size < cap && !set.has(value)) set.add(value); }

function newEntity(name) {
  return {
    name, count: 0, types: {}, categories: new Map(), catSeen: new Set(), operators: new Set(),
    brands: new Set(), branches: new Set(), cities: new Set(), networks: new Set(), names: new Set()
  };
}

function finishEntity(e, caps) {
  return {
    name: e.name,
    count: e.count,
    types: e.types,
    categories: [...e.categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    operators: [...e.operators].slice(0, caps.operators),
    brands: [...e.brands].slice(0, caps.brands),
    branchCount: e.branches.size,
    branches: [...e.branches].slice(0, caps.branches),
    cities: [...e.cities].slice(0, caps.cities),
    networks: [...e.networks].slice(0, caps.networks),
    names: [...e.names].slice(0, 4)
  };
}

const stats = { brandElements: 0, brandSkipped: 0, operatorElements: 0, branchElements: 0, rowsSkipped: 0 };

function aggregate(track) {
  const brands = new Map();
  const operators = new Map();
  const categories = new Map();
  const operatorCategories = new Map();
  const seenBrands = new Set();
  const seenOperators = new Set();

  function handle(r, entityMap, isBrand) {
    const key = isBrand ? r.brand : r.operator;
    if (!key) return false;
    const uid = r.type + '/' + r.id;
    const seen = isBrand ? seenBrands : seenOperators;
    if (seen.has(uid)) return false;
    seen.add(uid);
    let e = entityMap.get(key);
    if (!e) { e = newEntity(key); entityMap.set(key, e); }
    e.count++;
    e.types[r.type] = (e.types[r.type] || 0) + 1;
    const cat = categoryOf(r);
    if (cat) {
      const label = cat.key + '=' + cat.value;
      bump(e.categories, label);
      if (!e.catSeen.has(label)) {
        e.catSeen.add(label);
        bump(isBrand ? categories : operatorCategories, label);
      }
    }
    add(e.operators, r.operator, 12);
    add(e.brands, r.brand, 10);
    add(e.branches, r.branch, 60);
    add(e.cities, r.city, 10);
    add(e.networks, r.network, 8);
    add(e.names, r.name, 4);
    return true;
  }

  return {
    addBrandRow(r) { if (handle(r, brands, true) && track) stats.brandElements++; },
    addOperatorRow(r) { if (handle(r, operators, false) && track) stats.operatorElements++; },
    brands, operators, categories, operatorCategories
  };
}

async function dbTimestamp() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent('[out:json][timeout:60];node["brand"];out count;')
  });
  const json = await res.json();
  return json.osm3s?.timestamp_osm_base || null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function overpassCsv(query, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 180000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status}: ${body.slice(0, 160)}`);
      err.status = res.status;
      throw err;
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseAdmin(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('|');
    if (f.length < 3 || !f[0] || !f[1]) continue;
    out.push({ id: f[0], name: f[1], nameEn: f[2] || '', areaId: 3600000000 + Number(f[0]) });
  }
  return out;
}

async function adminList() {
  const file = join(AL2_CACHE, 'admin.csv');
  if (!REFRESH_COUNTRIES && existsSync(file)) {
    return parseAdmin(await readFile(file, 'utf8'));
  }
  await mkdir(AL2_CACHE, { recursive: true });
  const q = '[out:csv(::id,name,"name:en",boundary;false;"|")][timeout:150];' +
    'rel["admin_level"="2"]["boundary"="administrative"]["name"];out;';
  const text = await overpassCsv(q, 200000);
  await writeFile(file, text, 'utf8');
  return parseAdmin(text);
}

async function countryRows(c) {
  const file = join(AL2_CACHE, 'c', c.id + '.csv');
  if (!REFRESH_COUNTRIES && existsSync(file)) return rows(await readFile(file, 'utf8')).out;
  const q = `[out:csv(${FIELDS.join(',')};false;"|")][timeout:150];\n(\n` +
    ` node["brand"](area:${c.areaId});\n way["brand"](area:${c.areaId});\n relation["brand"](area:${c.areaId});\n);\nout;`;
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text = await overpassCsv(q, 200000);
      await writeFile(file, text, 'utf8');
      return text.trim() ? rows(text).out : [];
    } catch (err) {
      lastErr = err;
      if (err.status === 400) throw err;
      await sleep(1200 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function buildCountries() {
  console.log('\ncountries (admin_level=2)');
  const list = await adminList();
  console.log(`  ${list.length} administrative relations`);
  const work = COUNTRY_LIMIT ? list.slice(0, COUNTRY_LIMIT) : list;
  await mkdir(join(AL2_CACHE, 'c'), { recursive: true });
  await mkdir(OUT_COUNTRIES, { recursive: true });

  const found = [];
  let cursor = 0, done = 0, failed = 0;
  async function worker() {
    while (cursor < work.length) {
      const c = work[cursor++];
      try {
        const listRows = await countryRows(c);
        const cAgg = aggregate(false);
        for (const r of listRows) cAgg.addBrandRow(r);
        const items = [...cAgg.brands.values()]
          .map((e) => finishEntity(e, { operators: 12, brands: 10, branches: 40, cities: 10, networks: 8 }))
          .filter((e) => e.name.trim())
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        if (items.length) {
          const categories = [...cAgg.categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16)
            .map(([key, count]) => ({ key, count }));
          await writeFile(join(OUT_COUNTRIES, c.id + '.json'), JSON.stringify({
            id: c.id, name: c.name, nameEn: c.nameEn, areaId: c.areaId, categories, brands: items
          }), 'utf8');
          found.push({
            id: c.id, name: c.name, nameEn: c.nameEn, areaId: c.areaId,
            brands: items.length, elements: items.reduce((s, x) => s + x.count, 0)
          });
        }
      } catch (err) {
        failed++;
        console.log(`  skip ${c.id} ${c.name}: ${err.message.slice(0, 120)}`);
      }
      done++;
      if (done % 25 === 0) console.log(`  ${done}/${work.length}, found ${found.length}, failed ${failed}`);
      await sleep(220);
    }
  }
  await Promise.all([worker(), worker(), worker()]);

  found.sort((a, b) => b.elements - a.elements || a.name.localeCompare(b.name));
  const meta = JSON.parse(await readFile(OUT, 'utf8'));
  meta.countries = found;
  meta.countriesUpdatedAt = new Date().toISOString();
  await writeFile(OUT, JSON.stringify(meta), 'utf8');
  console.log(`  wrote ${found.length} country files, ${found.reduce((s, x) => s + x.elements, 0)} brand elements`);
}

const agg = aggregate(true);
await mkdir(CACHE, { recursive: true });
await mkdir(DATA, { recursive: true });

for (const chunk of CHUNKS) {
  console.log(chunk.name);
  const text = await download(chunk);
  const { out, skipped } = rows(text);
  stats.rowsSkipped += skipped;
  for (const r of out) {
    if (chunk.name.startsWith('brand')) agg.addBrandRow(r);
    else if (chunk.name.startsWith('branch')) {
      if (r.branch) stats.branchElements++;
    } else if (chunk.name.startsWith('operator')) agg.addOperatorRow(r);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

const brandItems = [...agg.brands.values()].map((e) => finishEntity(e, {
  operators: 12, brands: 10, branches: 40, cities: 10, networks: 8
})).filter((e) => e.name.trim()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const operatorItems = [...agg.operators.values()].map((e) => finishEntity(e, {
  operators: 6, brands: 10, branches: 12, cities: 8, networks: 8
})).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const stamp = await dbTimestamp();

let prevMeta = {};
try { prevMeta = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* first build */ }

const payload = {
  generatedAt: new Date().toISOString(),
  dbTimestamp: stamp,
  source: 'https://overpass.opengeofiction.net/api/interpreter',
  stats: {
    ...stats,
    brands: brandItems.length,
    operators: operatorItems.length,
    brandBranches: brandItems.reduce((s, b) => s + b.branchCount, 0)
  },
  categories: [...agg.categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
    .map(([key, count]) => ({ key, count })),
  operatorCategories: [...agg.operatorCategories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([key, count]) => ({ key, count })),
  countries: prevMeta.countries || [],
  countriesUpdatedAt: prevMeta.countriesUpdatedAt || null
};

await writeFile(OUT, JSON.stringify(payload), 'utf8');
await writeFile(OUT_BRANDS, JSON.stringify(brandItems), 'utf8');
await writeFile(OUT_OPERATORS, JSON.stringify(operatorItems), 'utf8');
const size = (await readFile(OUT)).length + (await readFile(OUT_BRANDS)).length
  + (await readFile(OUT_OPERATORS)).length;
console.log(`\nwrote ${OUT}, brands.json, operators.json`);
console.log(`brands ${brandItems.length}, operators ${operatorItems.length}, db ${stamp}, ${(size / 1024).toFixed(0)} KB, skipped rows ${stats.rowsSkipped}`);

if (WITH_COUNTRIES) await buildCountries();
