"use client";

export default function PrintButton() {
  return (
    <div className="print-hide" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
      <style>{"@media print { .print-hide { display: none !important; } .print-root { position: static !important; overflow: visible !important; } @page { margin: 14mm; } }"}</style>
      <button onClick={() => window.print()} style={{ font: "inherit", padding: "9px 14px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" }}>
        Imprimer / Enregistrer en PDF
      </button>
    </div>
  );
}
