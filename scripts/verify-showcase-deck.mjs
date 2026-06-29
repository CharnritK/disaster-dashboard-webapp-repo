import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DEFAULT_DECK = path.resolve(
  "artifacts",
  "showcase-deck",
  "disaster-response-dashboard-showcase.pptx",
);
const EXPECTED_SLIDE_COUNT = 8;

function parseArgs(argv) {
  const args = { deck: DEFAULT_DECK };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--deck") {
      args.deck = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Verify the generated showcase PPTX.

Usage:
  node scripts/verify-showcase-deck.mjs
  node scripts/verify-showcase-deck.mjs --deck <deck.pptx>
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readUInt32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function readUInt16LE(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function listZipEntries(buffer) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;

  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32LE(buffer, offset) === eocdSignature) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Could not find ZIP end-of-central-directory record.");
  }

  const entryCount = readUInt16LE(buffer, eocdOffset + 10);
  const centralOffset = readUInt32LE(buffer, eocdOffset + 16);
  const entries = [];
  let offset = centralOffset;

  for (let i = 0; i < entryCount; i += 1) {
    const signature = readUInt32LE(buffer, offset);
    if (signature !== 0x02014b50) {
      throw new Error(`Invalid central-directory signature at offset ${offset}.`);
    }

    const compressedSize = readUInt32LE(buffer, offset + 20);
    const uncompressedSize = readUInt32LE(buffer, offset + 24);
    const fileNameLength = readUInt16LE(buffer, offset + 28);
    const extraLength = readUInt16LE(buffer, offset + 30);
    const commentLength = readUInt16LE(buffer, offset + 32);
    const localHeaderOffset = readUInt32LE(buffer, offset + 42);
    const nameStart = offset + 46;
    const name = buffer.toString("utf8", nameStart, nameStart + fileNameLength);

    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function extractEntry(buffer, entry) {
  const offset = entry.localHeaderOffset;
  if (readUInt32LE(buffer, offset) !== 0x04034b50) {
    throw new Error(`Invalid local file header for ${entry.name}.`);
  }

  const compressionMethod = readUInt16LE(buffer, offset + 8);
  const fileNameLength = readUInt16LE(buffer, offset + 26);
  const extraLength = readUInt16LE(buffer, offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (compressionMethod === 0) {
    return compressed;
  }
  if (compressionMethod === 8) {
    return zlib.inflateRawSync(compressed);
  }
  throw new Error(
    `${entry.name} uses unsupported ZIP compression method ${compressionMethod}.`,
  );
}

function requireEntry(entries, name) {
  const entry = entries.find((candidate) => candidate.name === name);
  if (!entry) {
    throw new Error(`Missing PPTX part: ${name}`);
  }
  return entry;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const deckPath = path.resolve(args.deck);

  if (!fs.existsSync(deckPath)) {
    throw new Error(`Deck does not exist: ${deckPath}`);
  }

  const buffer = fs.readFileSync(deckPath);
  const entries = listZipEntries(buffer);
  const names = new Set(entries.map((entry) => entry.name));

  requireEntry(entries, "[Content_Types].xml");
  const presentation = extractEntry(
    buffer,
    requireEntry(entries, "ppt/presentation.xml"),
  ).toString("utf8");

  const slideRefs = [...presentation.matchAll(/<p:sldId\b/g)];
  if (slideRefs.length !== EXPECTED_SLIDE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_SLIDE_COUNT} slides, found ${slideRefs.length}.`,
    );
  }

  for (let index = 1; index <= EXPECTED_SLIDE_COUNT; index += 1) {
    const required = [
      `ppt/slides/slide${index}.xml`,
      `ppt/slides/_rels/slide${index}.xml.rels`,
      `ppt/media/image${index}.png`,
    ];
    for (const name of required) {
      if (!names.has(name)) {
        throw new Error(`Missing slide asset: ${name}`);
      }
    }
  }

  console.log(`Verified ${deckPath}`);
  console.log(`Slides: ${EXPECTED_SLIDE_COUNT}`);
  console.log(`ZIP entries: ${entries.length}`);
}

main();
