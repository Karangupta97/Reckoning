import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { PrismaClient } from "@prisma/client";

import parser from "stream-json/parser.js";
import pick from "stream-json/filters/pick.js";
import streamArray from "stream-json/streamers/stream-array.js";

const prisma = new PrismaClient();

// Parse CLI flags
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
let stateFilter = null;
const stateIdx = args.indexOf("--state");
if (stateIdx !== -1 && args[stateIdx + 1]) {
  stateFilter = args[stateIdx + 1];
}

/**
 * Normalise a name for consistent matching (lowercase, strip suffixes,hyphens, etc).
 */
function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(taluka|tehsil|mandal|block|circle|district|division)\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Download a file via streaming to prevent memory constraints.
 */
async function downloadFile(url, destPath) {
  console.log(`Downloading GADM data from ${url} to ${destPath}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const fileStream = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(res.body), fileStream);
  console.log(`✅ Download complete: ${destPath}`);
}

/**
 * Process a single GeoJSON file's features array.
 */
function processGeoJsonStream(filePath, onFeature) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const pipeline = stream
      .pipe(parser.asStream())
      .pipe(pick.asStream({ filter: "features" }))
      .pipe(streamArray.asStream());

    pipeline.on("data", async (data) => {
      pipeline.pause();
      try {
        await onFeature(data.value);
      } catch (err) {
        pipeline.destroy(err);
        return;
      }
      pipeline.resume();
    });

    pipeline.on("error", reject);
    pipeline.on("end", resolve);
  });
}

async function main() {
  console.log(`=== GADM Boundary Seeder ===`);
  console.log(`Dry run: ${dryRun ? "ENABLED" : "DISABLED"}`);
  console.log(`State filter: ${stateFilter ? stateFilter : "NONE"}`);

  // 1. Database Lookups setup
  console.log("Loading districts and sub-districts from database...");
  const dbDistricts = await prisma.district.findMany({
    where: { country: "INDIA" },
    select: { id: true, name: true }
  });
  const dbSubDistricts = await prisma.subDistrict.findMany({
    select: { id: true, name: true, districtId: true }
  });

  const districtMap = new Map(); // normalizedName -> id
  for (const d of dbDistricts) {
    districtMap.set(normalizeName(d.name), d.id);
  }

  const subDistrictMap = new Map(); // districtId_normalizedSubName -> id
  for (const sd of dbSubDistricts) {
    const key = `${sd.districtId}_${normalizeName(sd.name)}`;
    subDistrictMap.set(key, sd.id);
  }

  console.log(`Loaded ${districtMap.size} districts and ${subDistrictMap.size} sub-districts.`);

  // 2. Locate Data
  let filesToProcess = [];
  const statesDir = "data/gadm/states";
  const singleFile = "data/gadm/gadm41_IND_3.json";

  if (fs.existsSync(statesDir)) {
    const files = fs.readdirSync(statesDir).filter(f => f.endsWith(".json"));
    if (files.length > 0) {
      console.log(`Found per-state files in ${statesDir}.`);
      filesToProcess = files.map(f => path.join(statesDir, f));
    }
  }

  if (filesToProcess.length === 0) {
    if (!fs.existsSync(singleFile)) {
      console.log(`Local single file ${singleFile} not found.`);
      try {
        await downloadFile("https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IND_3.json", singleFile);
      } catch (err) {
        console.error("❌ Failed to download GADM data:", err.message);
        process.exit(1);
      }
    }
    filesToProcess = [singleFile];
  }

  console.log(`Target files to process: ${filesToProcess.join(", ")}`);

  // 3. Process Features
  let seededCount = 0;
  let skippedCount = 0;
  let totalProcessed = 0;
  const unmatched = [];

  const handleFeature = async (feature) => {
    totalProcessed++;
    const { properties, geometry } = feature;
    if (!properties || !geometry) return;

    const stateName = properties.NAME_1;
    const districtName = properties.NAME_2;
    const subDistrictName = properties.NAME_3;

    // Filter by state if requested
    if (stateFilter && normalizeName(stateName) !== normalizeName(stateFilter)) {
      skippedCount++;
      return;
    }

    let normDistrict = normalizeName(districtName);
    const normSub = normalizeName(subDistrictName);

    // Custom spelling mapping: "raigarh" in Maharashtra refers to "raigad"
    if (normDistrict === "raigarh" && normalizeName(stateName) === "maharashtra") {
      normDistrict = "raigad";
    }

    const districtId = districtMap.get(normDistrict);
    if (!districtId) {
      unmatched.push({
        state: stateName,
        district: districtName,
        subDistrict: subDistrictName,
        reason: `District '${districtName}' not found in DB`
      });
      return;
    }

    const subDistrictKey = `${districtId}_${normSub}`;
    const subDistrictId = subDistrictMap.get(subDistrictKey);
    if (!subDistrictId) {
      unmatched.push({
        state: stateName,
        district: districtName,
        subDistrict: subDistrictName,
        reason: `SubDistrict '${subDistrictName}' not found in DB under District ID ${districtId}`
      });
      return;
    }

    // Success! Update SubDistrict
    if (dryRun) {
      if (seededCount % 100 === 0) {
        console.log(`[DRY RUN] [${seededCount}/~] Would seed: ${subDistrictName} (${districtName}, ${stateName})`);
      }
    } else {
      try {
        await prisma.$executeRaw`
          UPDATE "sub_districts"
          SET boundary = ST_Multi(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}))
          WHERE id = ${subDistrictId}
        `;
        if (seededCount % 100 === 0) {
          console.log(`[Seeded ${seededCount}] boundary updated for: ${subDistrictName} (${districtName}, ${stateName})`);
        }
      } catch (dbErr) {
        console.error(`❌ DB Error updating sub-district ${subDistrictName} (${subDistrictId}):`, dbErr.message);
        unmatched.push({
          state: stateName,
          district: districtName,
          subDistrict: subDistrictName,
          reason: `DB Error: ${dbErr.message}`
        });
        return;
      }
    }

    seededCount++;
  };

  for (const file of filesToProcess) {
    console.log(`Processing file: ${file}...`);
    try {
      await processGeoJsonStream(file, handleFeature);
    } catch (err) {
      console.error(`❌ Error parsing ${file}:`, err.message);
    }
  }

  // 4. District Boundary Pass (Union of Sub-districts)
  console.log("Updating District boundaries (ST_Union of sub-district boundaries)...");
  if (!dryRun) {
    try {
      const affectedDistricts = await prisma.$executeRaw`
        UPDATE "districts" d
        SET boundary = (
          SELECT ST_Multi(ST_Union(sd.boundary))
          FROM "sub_districts" sd
          WHERE sd."districtId" = d.id
            AND sd.boundary IS NOT NULL
        )
      `;
      console.log(`✅ District boundaries updated for ${affectedDistricts} districts.`);
    } catch (err) {
      console.error("❌ Failed to update district boundaries:", err.message);
    }
  } else {
    console.log("[DRY RUN] Would update District boundaries from SubDistricts.");
  }

  // 5. Save Unmatched Features Report
  const unmatchedDir = "data/gadm";
  if (!fs.existsSync(unmatchedDir)) {
    fs.mkdirSync(unmatchedDir, { recursive: true });
  }
  const unmatchedFile = path.join(unmatchedDir, "unmatched.json");
  fs.writeFileSync(unmatchedFile, JSON.stringify(unmatched, null, 2));

  // 6. Summary Report
  console.log("\n=== Seeding Summary ===");
  console.log(`✅ Seeded: ${seededCount} sub-districts`);
  console.log(`⚠️ Unmatched: ${unmatched.length} features (see ${unmatchedFile})`);
  if (stateFilter) {
    console.log(`ℹ️ Skipped (other states): ${skippedCount} features`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
