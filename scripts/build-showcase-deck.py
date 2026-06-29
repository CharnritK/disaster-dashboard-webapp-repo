from __future__ import annotations

import argparse
import html
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


DEFAULT_IMAGE_DIR = Path(
    os.environ.get("SHOWCASE_IMAGE_DIR", "artifacts/showcase-deck/images")
)
DEFAULT_OUT = Path(
    os.environ.get(
        "SHOWCASE_DECK_OUT",
        "artifacts/showcase-deck/disaster-response-dashboard-showcase.pptx",
    )
)
FINAL_IMAGE_ORDINALS = [1, 2, 4, 6, 9, 11, 13, 14]
EXPECTED_SLIDE_COUNT = 8

SLIDE_W = 12192000
SLIDE_H = 6858000

SLIDE_TITLES = [
    "Disaster Response Dashboard",
    "The Bottleneck: Critical Data Arrives Fragmented",
    "A Recommendation-First Workflow",
    "Quality Caveats Stay Visible",
    "AI Assists. Rules Still Verify.",
    "From Prepared Data to Actionable Dashboards",
    "Built for Safe Prototype Decisions",
    "What This Prototype Proves",
]


def main() -> int:
    args = parse_args()
    image_dir = args.images.resolve()
    output = args.out.resolve()

    images = chronological_pngs(image_dir)
    selected = select_images(images, args.indices, args.all)
    build_pptx(selected, output)
    verify_pptx(output)

    print(f"Created {output}")
    print(f"Slides: {len(selected)}")
    for index, image in enumerate(selected, start=1):
        title = SLIDE_TITLES[index - 1] if index <= len(SLIDE_TITLES) else f"Slide {index}"
        print(f"{index}. {title} <- {image.name}")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build and verify the disaster dashboard showcase PPTX from generated PNGs."
    )
    parser.add_argument("--images", type=Path, default=DEFAULT_IMAGE_DIR)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--indices",
        default=",".join(str(value) for value in FINAL_IMAGE_ORDINALS),
        help="1-based chronological PNG ordinals to use, comma-separated.",
    )
    parser.add_argument("--all", action="store_true", help="Use every PNG in chronological order.")
    args = parser.parse_args()
    args.indices = [
        int(value.strip())
        for value in args.indices.split(",")
        if value.strip()
    ]
    return args


def chronological_pngs(image_dir: Path) -> list[Path]:
    if not image_dir.exists():
        raise FileNotFoundError(f"Image directory does not exist: {image_dir}")

    images = [
        path
        for path in image_dir.iterdir()
        if path.is_file() and path.suffix.lower() == ".png"
    ]
    images.sort(key=lambda path: (path.stat().st_mtime_ns, path.name.lower()))

    if not images:
        raise FileNotFoundError(f"No PNG files found in {image_dir}")
    return images


def select_images(images: list[Path], indices: list[int], use_all: bool) -> list[Path]:
    if use_all:
        return images

    if len(images) == EXPECTED_SLIDE_COUNT:
        return images

    missing = [ordinal for ordinal in indices if ordinal < 1 or ordinal > len(images)]
    if missing:
        raise ValueError(
            f"Generated image folder has {len(images)} PNGs, but requested ordinal(s) "
            f"{', '.join(str(value) for value in missing)}."
        )

    selected = [images[ordinal - 1] for ordinal in indices]
    if len(selected) != EXPECTED_SLIDE_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_SLIDE_COUNT} selected images, got {len(selected)}."
        )
    return selected


def build_pptx(images: list[Path], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    slide_count = len(images)

    with ZipFile(output, "w", compression=ZIP_DEFLATED) as deck:
        write_text(deck, "[Content_Types].xml", content_types_xml(slide_count))
        write_text(deck, "_rels/.rels", package_rels_xml())
        write_text(deck, "docProps/app.xml", app_props_xml(slide_count))
        write_text(deck, "docProps/core.xml", core_props_xml())
        write_text(deck, "ppt/presentation.xml", presentation_xml(slide_count))
        write_text(deck, "ppt/_rels/presentation.xml.rels", presentation_rels_xml(slide_count))
        write_text(deck, "ppt/slideMasters/slideMaster1.xml", slide_master_xml())
        write_text(deck, "ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels_xml())
        write_text(deck, "ppt/slideLayouts/slideLayout1.xml", slide_layout_xml())
        write_text(deck, "ppt/slideLayouts/_rels/slideLayout1.xml.rels", slide_layout_rels_xml())
        write_text(deck, "ppt/theme/theme1.xml", theme_xml())

        for index, image in enumerate(images, start=1):
            title = SLIDE_TITLES[index - 1] if index <= len(SLIDE_TITLES) else f"Slide {index}"
            write_text(deck, f"ppt/slides/slide{index}.xml", slide_xml(index, title))
            write_text(deck, f"ppt/slides/_rels/slide{index}.xml.rels", slide_rels_xml(index))
            deck.write(image, f"ppt/media/image{index}.png")


def verify_pptx(output: Path) -> None:
    if not output.exists():
        raise FileNotFoundError(f"Deck does not exist after build: {output}")

    with ZipFile(output) as deck:
        names = set(deck.namelist())
        required = {
            "[Content_Types].xml",
            "_rels/.rels",
            "ppt/presentation.xml",
            "ppt/_rels/presentation.xml.rels",
        }
        required.update(f"ppt/slides/slide{index}.xml" for index in range(1, EXPECTED_SLIDE_COUNT + 1))
        required.update(
            f"ppt/slides/_rels/slide{index}.xml.rels"
            for index in range(1, EXPECTED_SLIDE_COUNT + 1)
        )
        required.update(f"ppt/media/image{index}.png" for index in range(1, EXPECTED_SLIDE_COUNT + 1))

        missing = sorted(required - names)
        if missing:
            raise ValueError("PPTX is missing required parts:\n" + "\n".join(missing))

        presentation = deck.read("ppt/presentation.xml").decode("utf-8")
        slide_refs = presentation.count("<p:sldId ")
        if slide_refs != EXPECTED_SLIDE_COUNT:
            raise ValueError(
                f"Expected {EXPECTED_SLIDE_COUNT} slide refs, found {slide_refs}."
            )


def write_text(deck: ZipFile, name: str, content: str) -> None:
    deck.writestr(name, content.strip().encode("utf-8"))


def rels_xml(relationships: list[tuple[str, str, str]]) -> str:
    rels = "".join(
        f'<Relationship Id="{rel_id}" Type="{rel_type}" Target="{target}"/>'
        for rel_id, rel_type, target in relationships
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
{rels}
</Relationships>'''


def package_rels_xml() -> str:
    return rels_xml(
        [
            (
                "rId1",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                "ppt/presentation.xml",
            ),
            (
                "rId2",
                "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
                "docProps/core.xml",
            ),
            (
                "rId3",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties",
                "docProps/app.xml",
            ),
        ]
    )


def content_types_xml(slide_count: int) -> str:
    slide_overrides = "".join(
        f'<Override PartName="/ppt/slides/slide{index}.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for index in range(1, slide_count + 1)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
{slide_overrides}
</Types>'''


def presentation_xml(slide_count: int) -> str:
    slide_ids = "".join(
        f'<p:sldId id="{255 + index}" r:id="rId{index + 1}"/>'
        for index in range(1, slide_count + 1)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>{slide_ids}</p:sldIdLst>
<p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}" type="wide"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>'''


def presentation_rels_xml(slide_count: int) -> str:
    relationships = [
        (
            "rId1",
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
            "slideMasters/slideMaster1.xml",
        )
    ]
    relationships.extend(
        (
            f"rId{index + 1}",
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
            f"slides/slide{index}.xml",
        )
        for index in range(1, slide_count + 1)
    )
    return rels_xml(relationships)


def slide_xml(index: int, title: str) -> str:
    safe_title = html.escape(title, quote=True)
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld name="{safe_title}">
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/></a:xfrm></p:grpSpPr>
<p:pic>
<p:nvPicPr><p:cNvPr id="2" name="Slide {index}" descr="{safe_title}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
<p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
</p:pic>
</p:spTree>
</p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>'''


def slide_rels_xml(index: int) -> str:
    return rels_xml(
        [
            (
                "rId1",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                f"../media/image{index}.png",
            ),
            (
                "rId2",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
                "../slideLayouts/slideLayout1.xml",
            ),
        ]
    )


def slide_master_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>'''


def slide_master_rels_xml() -> str:
    return rels_xml(
        [
            (
                "rId1",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
                "../slideLayouts/slideLayout1.xml",
            ),
            (
                "rId2",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme",
                "../theme/theme1.xml",
            ),
        ]
    )


def slide_layout_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>'''


def slide_layout_rels_xml() -> str:
    return rels_xml(
        [
            (
                "rId1",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
                "../slideMasters/slideMaster1.xml",
            )
        ]
    )


def theme_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
</a:theme>'''


def app_props_xml(slide_count: int) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>Codex</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat><Slides>{slide_count}</Slides><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion>
</Properties>'''


def core_props_xml() -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Disaster Response Dashboard Showcase</dc:title>
<dc:creator>Codex</dc:creator>
<cp:lastModifiedBy>Codex</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>'''


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
