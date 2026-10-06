import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#f4f7f8",
      color: "#173f5f",
      fontFamily: "var(--font-plus-jakarta), sans-serif"
    }}>
      <div style={{
        display: "grid",
        gap: "12px",
        maxWidth: "420px",
        padding: "32px 28px",
        borderRadius: "16px",
        background: "#fff",
        border: "1px solid #e3e9ee",
        textAlign: "center",
        boxShadow: "0 12px 30px rgba(16, 57, 81, 0.06)"
      }}>
        <p style={{ margin: 0, color: "#9b772d", fontSize: "10px", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>
          Halaman tidak tersedia
        </p>
        <h1 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>404</h1>
        <p style={{ margin: 0, color: "#60798b", fontSize: "13px", lineHeight: 1.6 }}>
          Halaman yang Anda cari tidak ditemukan atau belum tersedia untuk akun demo ini.
        </p>
        <Link href="/login" style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "42px",
          borderRadius: "10px",
          background: "#123d5d",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "12px"
        }}>
          Kembali ke Login
        </Link>
      </div>
    </main>
  );
}
