import jsPDF from "jspdf";

interface ReceiptData {
  reference: string;
  customerName: string;
  customerEmail: string;
  vehicle?: { name: string; days: number; total: number };
  property?: { name: string; nights: number; total: number };
  totalAmount: number;
  depositAmount: number;
  paymentMode: string;
  amountCharged: number;
  paidAt: string;
}

export function generateReceiptPdf(data: ReceiptData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  let y = 20;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ROUTH LOCATION", pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Guadeloupe — Location de vehicules & hebergements", pageW / 2, y, { align: "center" });
  y += 12;

  doc.setDrawColor(180, 160, 130);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageW - 20, y);
  y += 8;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIRMATION DE RESERVATION", pageW / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const leftX = 25;
  const rightX = 105;
  const rowH = 7;

  function row(label: string, value: string) {
    doc.setFont("helvetica", "bold");
    doc.text(label, leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, rightX, y);
    y += rowH;
  }

  row("Reference :", data.reference);
  row("Client :", data.customerName);
  row("Email :", data.customerEmail);
  row("Paiement :", data.paymentMode === "full" ? "Integral" : "Acompte 30%");
  row("Statut :", "Paye");
  row("Date :", data.paidAt);
  y += 6;

  doc.line(20, y, pageW - 20, y);
  y += 8;

  if (data.vehicle) {
    doc.setFont("helvetica", "bold");
    doc.text("Vehicule", leftX, y);
    y += rowH;
    doc.setFont("helvetica", "normal");
    row("  Modele :", data.vehicle.name);
    row("  Duree :", `${data.vehicle.days} jour${data.vehicle.days > 1 ? "s" : ""}`);
    row("  Total :", `${data.vehicle.total.toFixed(2)} €`);
    y += 4;
  }

  if (data.property) {
    doc.setFont("helvetica", "bold");
    doc.text("Hebergement", leftX, y);
    y += rowH;
    doc.setFont("helvetica", "normal");
    row("  Logement :", data.property.name);
    row("  Duree :", `${data.property.nights} nuit${data.property.nights > 1 ? "s" : ""}`);
    row("  Total :", `${data.property.total.toFixed(2)} €`);
    y += 4;
  }

  doc.line(20, y, pageW - 20, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Total sejour :", leftX, y);
  doc.text(`${data.totalAmount.toFixed(2)} €`, rightX, y);
  y += rowH;

  doc.setFont("helvetica", "normal");
  doc.text("Acompte verse (30%) :", leftX, y);
  doc.text(`${data.depositAmount.toFixed(2)} €`, rightX, y);
  y += rowH;
  doc.text("Solde a payer sur place :", leftX, y);
  doc.text(`${(data.totalAmount - data.depositAmount).toFixed(2)} €`, rightX, y);
  y += 12;

  doc.line(20, y, pageW - 20, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Conditions de location :", leftX, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const conditions = [
    "Conducteur age de 21 ans minimum, permis B valide depuis 2 ans.",
    "Caution restituee au retour du vehicule.",
    "Carburant : plein a plein.",
    "Annulation gratuite jusqu'a 48h avant le depart.",
    "Pour toute question : contact@routh-location.com",
  ];
  for (const c of conditions) {
    doc.text(`- ${c}`, leftX + 3, y);
    y += 5;
  }

  doc.save(`confirmation-${data.reference}.pdf`);
}
