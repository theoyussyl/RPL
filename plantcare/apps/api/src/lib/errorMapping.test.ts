import { describe, it, expect } from "vitest";
import { MapKnownPrismaError, SafeInternalErrorResponse } from "./errorMapping";

const Messages = {
  ForeignKeyMessage: "Tidak bisa dihapus karena masih berelasi",
  NotFoundMessage: "Data tidak ditemukan",
};

describe("MapKnownPrismaError", () => {
  it("memetakan P2003 (foreign key constraint) ke 400 dengan pesan ramah", () => {
    const Result = MapKnownPrismaError({ code: "P2003" }, Messages);
    expect(Result).toEqual({ Status: 400, Message: Messages.ForeignKeyMessage });
  });

  it("memetakan P2025 (record not found) ke 404 dengan pesan ramah", () => {
    const Result = MapKnownPrismaError({ code: "P2025" }, Messages);
    expect(Result).toEqual({ Status: 404, Message: Messages.NotFoundMessage });
  });

  it("mengembalikan null untuk kode error Prisma lain yang tidak dikenal (P2002, dll)", () => {
    expect(MapKnownPrismaError({ code: "P2002" }, Messages)).toBeNull();
  });

  it("mengembalikan null untuk error biasa (bukan Prisma)", () => {
    expect(MapKnownPrismaError(new Error("sesuatu yang rusak"), Messages)).toBeNull();
  });

  it("[SECURITY] tidak pernah menyertakan pesan error asli (Error.message) di hasil mapping", () => {
    const InternalError = new Error("connect ECONNREFUSED 127.0.0.1:3306 password=rahasia123");
    const Result = MapKnownPrismaError(InternalError, Messages);
    // Karena ini bukan P2003/P2025, hasilnya null -> pemanggil (route) WAJIB
    // menampilkan pesan generik (lewat SafeInternalErrorResponse), bukan
    // Error.message asli yang mungkin berisi detail koneksi/kredensial.
    expect(Result).toBeNull();
  });
});

describe("SafeInternalErrorResponse", () => {
  it("[SECURITY] selalu mengembalikan pesan generik, tidak pernah menerima/meneruskan Error asli", () => {
    const Result = SafeInternalErrorResponse();
    expect(Result.Status).toBe(500);
    expect(Result.Message).toBe("Terjadi kesalahan tak terduga di server");
    // Pastikan pesan generik ini TIDAK mengandung kata kunci sensitif apapun
    expect(Result.Message.toLowerCase()).not.toMatch(/password|secret|token|stack|sql|prisma/);
  });
});
