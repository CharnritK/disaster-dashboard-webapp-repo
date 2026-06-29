import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/config";
import { parseFile } from "@/lib/fileParsers";

describe("upload validation", () => {
  it("rejects files larger than the 10 MB per-file upload limit", async () => {
    const file = new File(
      [new Uint8Array(MAX_UPLOAD_SIZE_BYTES + 1)],
      "too-large.csv",
      { type: "text/csv" },
    );

    const result = await parseFile(file);

    expect(result.error).toBe("too-large.csv is larger than the 10MB upload limit.");
  });
});
