import { describe, expect, it } from "vitest";

import {
  RESUME_MAX_BYTES,
  validateResumeFile,
} from "../../src/utils/resumeValidation";

function makeFile(options: { name?: string; type?: string; size?: number } = {}): File {
  const { name = "resume.pdf", type = "application/pdf", size = 1_024 } = options;
  const bytes = new Uint8Array(Math.max(size, 0));
  return new File([bytes], name, { type });
}

describe("validateResumeFile", () => {
  it("accepts a normal PDF", () => {
    expect(validateResumeFile(makeFile())).toBeNull();
  });

  it("accepts a PDF with no reported MIME type but a .pdf name", () => {
    expect(validateResumeFile(makeFile({ type: "", name: "resume.pdf" }))).toBeNull();
  });

  it("rejects empty files", () => {
    expect(validateResumeFile(makeFile({ size: 0 }))).toBe("The selected file is empty.");
  });

  it("rejects files above the size limit", () => {
    const file = makeFile({ size: RESUME_MAX_BYTES + 1 });
    expect(validateResumeFile(file)).toBe("Resume files must be 10 MB or smaller.");
  });

  it("rejects non-PDF files", () => {
    expect(validateResumeFile(makeFile({ name: "photo.png", type: "image/png" }))).toBe(
      "Only PDF files can be uploaded.",
    );
    expect(validateResumeFile(makeFile({ name: "notes.txt", type: "" }))).toBe(
      "Only PDF files can be uploaded.",
    );
  });
});
