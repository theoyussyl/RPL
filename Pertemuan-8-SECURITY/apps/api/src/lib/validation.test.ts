import { describe, it, expect } from "vitest";
import { ValidateRequiredText } from "./validation";

describe("ValidateRequiredText", () => {
  it("mengembalikan pesan error jika nilai kosong", () => {
    expect(ValidateRequiredText("", "Nama kebun")).toBe("Nama kebun wajib diisi");
  });
  it("mengembalikan pesan error jika nilai hanya spasi", () => {
    expect(ValidateRequiredText("   ", "Nama tanaman")).toBe("Nama tanaman wajib diisi");
  });
  it("mengembalikan pesan error jika nilai undefined", () => {
    expect(ValidateRequiredText(undefined, "Nama kebun")).toBe("Nama kebun wajib diisi");
  });
  it("mengembalikan null jika nilai valid", () => {
    expect(ValidateRequiredText("Kebun Belakang Rumah", "Nama kebun")).toBeNull();
  });
  it("menolak nilai yang melebihi batas maksimal panjang (200 karakter)", () => {
    const TooLong = "A".repeat(201);
    expect(ValidateRequiredText(TooLong, "Nama kebun")).toBe("Nama kebun maksimal 200 karakter");
  });
});
