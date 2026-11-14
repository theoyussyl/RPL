export interface MappedErrorResponse {
  Status: number;
  Message: string;
}

export interface KnownErrorMessages {
  ForeignKeyMessage: string;
  NotFoundMessage: string;
}

// Satu-satunya tempat yang memutuskan pesan apa yang BOLEH dikirim ke client.
// Prinsip keamanan: error asli (Error.message, stack trace, kode SQL) TIDAK
// PERNAH diteruskan ke client -- hanya pesan generik/ramah yang sudah
// ditentukan di sini. Error asli tetap dicatat di server lewat console.error
// pada pemanggilnya, bukan dikirim lewat response HTTP.
export function MapKnownPrismaError(
  Error: unknown,
  Messages: KnownErrorMessages
): MappedErrorResponse | null {
  const ErrorCode = (Error as { code?: string } | null)?.code;

  if (ErrorCode === "P2003") {
    return { Status: 400, Message: Messages.ForeignKeyMessage };
  }
  if (ErrorCode === "P2025") {
    return { Status: 404, Message: Messages.NotFoundMessage };
  }
  return null;
}

export function SafeInternalErrorResponse(): MappedErrorResponse {
  return { Status: 500, Message: "Terjadi kesalahan tak terduga di server" };
}
