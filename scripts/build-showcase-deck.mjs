import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_IMAGE_DIR =
  "C:\\Users\\point\\.codex\\generated_images\\019ebae2-6c07-7c71-a12e-b69fd6f3fc99";
const DEFAULT_OUT = path.resolve(
  "artifacts",
  "showcase-deck",
  "disaster-response-dashboard-showcase.pptx",
);

const SLIDE_W = 12192000;
const SLIDE_H = 6858000;

// The generation folder includes rejected draft images. These 1-based ordinals
// select the final deck images from chronological generation order.
const FINAL_IMAGE_ORDINALS = [1, 2, 4, 6, 9, 11, 13, 14];

const SLIDE_TITLES = [
  "Disaster Response Dashboard",
  "The Bottleneck: Critical Data Arrives Fragmented",
  "A Recommendation-First Workflow",
  "Quality Caveats Stay Visible",
  "AI Assists. Rules Still Verify.",
  "From Prepared Data to Actionable Dashboards",
  "Built for Safe Prototype Decisions",
  "What This Prototype Proves",
];

function parseArgs(argv) {
  const args = {
    images: DEFAULT_IMAGE_DIR,
    out: DEFAULT_OUT,
    indices: FINAL_IMAGE_ORDINALS,
    all: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--images") {
      args.images = argv[++i];
    } else if (arg === "--out") {
      args.out = argv[++i];
    } else if (arg === "--indices") {
      args.indices = argv[++i]
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isInteger(value) && value > 0);
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Build the disaster dashboard showcase PPTX from generated PNGs.

Usage:
  node scripts/build-showcase-deck.mjs
  node scripts/build-showcase-deck.mjs --images <dir> --out <deck.pptx>
  node scripts/build-showcase-deck.mjs --indices 1,2,4,6,9,11,13,14
  node scripts/build-showcase-deck.mjs --all

Defaults:
  --images ${DEFAULT_IMAGE_DIR}
  --out    ${DEFAULT_OUT}
`);
}

function getChronologicalPngs(imageDir) {
  if (!fs.existsSync(imageDir)) {
    throw new Error(`Image directory does not exist: ${imageDir}`);
  }

  return fs
    .readdirSync(imageDir)
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .map((name) => {
      const fullPath = path.join(imageDir, name);
      const stat = fs.statSync(fullPath);
      return { name, fullPath, mtimeMs: stat.mtimeMs, size: stat.size };
    })
    .sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name));
}

function selectImages(images, args) {
  if (args.all) {
    return images;
  }

  if (images.length === SLIDE_TITLES.length) {
    return images;
  }

  const missing = args.indices.filter((ordinal) => ordinal > images.length);
  if (missing.length > 0) {
    throw new Error(
      `Generated image folder has ${images.length} PNGs, but requested ordinal(s) ${missing.join(
        ", ",
      )}.`,
    );
  }

  return args.indices.map((ordinal) => images[ordinal - 1]);
}

function xml(strings, ...values) {
  let output = "";
  for (let i = 0; i < strings.length; i += 1) {
    output += strings[i];
    if (i < values.length) {
      output += values[i];
    }
  }
  return output.trim();
}

function relsXml(relationships) {
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relationships
  .map(
    (rel) =>
      `<Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>`,
  )
  .join("")}
</Relationships>`;
}

function contentTypesXml(slideCount) {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) => {
    const slide = index + 1;
    return `<Override PartName="/ppt/slides/slide${slide}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  }).join("");

  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${slideOverrides}
</Types>`;
}

function presentationXml(slideCount) {
  const slideIds = Array.from({ length: slideCount }, (_, index) => {
    const id = 256 + index;
    const rId = 2 + index;
    return `<p:sldId id="${id}" r:id="rId${rId}"/>`;
  }).join("");

  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${slideIds}</p:sldIdLst>
<p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}" type="wide"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function presentationRelsXml(slideCount) {
  const relationships = [
    {
      id: "rId1",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
      target: "slideMasters/slideMaster1.xml",
    },
    ...Array.from({ length: slideCount }, (_, index) => ({
      id: `rId${index + 2}`,
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
      target: `slides/slide${index + 1}.xml`,
    })),
  ];

  return relsXml(relationships);
}

function slideXml(index, title) {
  const safeTitle = escapeXml(title);
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld name="${safeTitle}">
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm></p:grpSpPr>
<p:pic>
<p:nvPicPr><p:cNvPr id="2" name="Slide ${index + 1}" descr="${safeTitle}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
<p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
</p:pic>
</p:spTree>
</p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function slideRelsXml(imageIndex) {
  return relsXml([
    {
      id: "rId1",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
      target: `../media/image${imageIndex}.png`,
    },
    {
      id: "rId2",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
      target: "../slideLayouts/slideLayout1.xml",
    },
  ]);
}

function slideMasterXml() {
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`;
}

function slideMasterRelsXml() {
  return relsXml([
    {
      id: "rId1",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
      target: "../slideLayouts/slideLayout1.xml",
    },
    {
      id: "rId2",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme",
      target: "../theme/theme1.xml",
    },
  ]);
}

function slideLayoutXml() {
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
}

function slideLayoutRelsXml() {
  return relsXml([
    {
      id: "rId1",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
      target: "../slideMasters/slideMaster1.xml",
    },
  ]);
}

function themeXml() {
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Disaster Dashboard">
<a:themeElements>
<a:clrScheme name="Dashboard">
<a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
<a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="16A34A"/></a:accent2>
<a:accent3><a:srgbClr val="D97706"/></a:accent3><a:accent4><a:srgbClr val="DC2626"/></a:accent4>
<a:accent5><a:srgbClr val="0891B2"/></a:accent5><a:accent6><a:srgbClr val="475569"/></a:accent6>
<a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
</a:clrScheme>
<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
</a:themeElements>
<a:objectDefaults/><a:extraClrSchemeLst/>
</a:theme>`;
}

function appPropsXml(slideCount) {
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>Codex</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat><Slides>${slideCount}</Slides><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion>
</Properties>`;
}

function corePropsXml() {
  const now = new Date().toISOString();
  return xml`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Disaster Response Dashboard Showcase</dc:title>
<dc:creator>Codex</dc:creator>
<cp:lastModifiedBy>Codex</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function dosDateTime(date) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function createZip(entries) {
  const fileParts = [];
  const centralParts = [];
  let offset = 0;
  const now = dosDateTime(new Date());

  for (const entry of entries) {
    const name = Buffer.from(entry.name.replaceAll("\\", "/"), "utf8");
    const data = Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data, "utf8");
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(now.dosTime, 10);
    localHeader.writeUInt16LE(now.dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    fileParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(now.dosTime, 12);
    centralHeader.writeUInt16LE(now.dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...fileParts, centralDir, end]);
}

function buildPptx(selectedImages, outputPath) {
  const slideCount = selectedImages.length;
  const entries = [
    { name: "[Content_Types].xml", data: contentTypesXml(slideCount) },
    {
      name: "_rels/.rels",
      data: relsXml([
        {
          id: "rId1",
          type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
          target: "ppt/presentation.xml",
        },
        {
          id: "rId2",
          type: "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
          target: "docProps/core.xml",
        },
        {
          id: "rId3",
          type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties",
          target: "docProps/app.xml",
        },
      ]),
    },
    { name: "docProps/app.xml", data: appPropsXml(slideCount) },
    { name: "docProps/core.xml", data: corePropsXml() },
    { name: "ppt/presentation.xml", data: presentationXml(slideCount) },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: presentationRelsXml(slideCount),
    },
    { name: "ppt/slideMasters/slideMaster1.xml", data: slideMasterXml() },
    {
      name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      data: slideMasterRelsXml(),
    },
    { name: "ppt/slideLayouts/slideLayout1.xml", data: slideLayoutXml() },
    {
      name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      data: slideLayoutRelsXml(),
    },
    { name: "ppt/theme/theme1.xml", data: themeXml() },
  ];

  selectedImages.forEach((image, index) => {
    const imageIndex = index + 1;
    entries.push({
      name: `ppt/slides/slide${imageIndex}.xml`,
      data: slideXml(index, SLIDE_TITLES[index] ?? `Slide ${imageIndex}`),
    });
    entries.push({
      name: `ppt/slides/_rels/slide${imageIndex}.xml.rels`,
      data: slideRelsXml(imageIndex),
    });
    entries.push({
      name: `ppt/media/image${imageIndex}.png`,
      data: fs.readFileSync(image.fullPath),
    });
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, createZip(entries));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const allImages = getChronologicalPngs(args.images);
  if (allImages.length === 0) {
    throw new Error(`No PNG files found in ${args.images}`);
  }

  const selectedImages = selectImages(allImages, args);
  buildPptx(selectedImages, path.resolve(args.out));

  console.log(`Created ${path.resolve(args.out)}`);
  console.log(`Slides: ${selectedImages.length}`);
  selectedImages.forEach((image, index) => {
    console.log(`${index + 1}. ${SLIDE_TITLES[index] ?? "Slide"} <- ${image.name}`);
  });
}

main();
