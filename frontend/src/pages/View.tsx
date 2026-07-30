import React from "react";

const certificate = {
  institution: "StellarCert Institute",
  credentialId: "STC-2026-00023",
  title: "Certificate of Excellence",
  recipient: "Jordan Lewis",
  course: "Advanced Digital Credentialing",
  issued: "January 12, 2026",
  signer: "Dr. Amina Rivera",
  verificationUrl: "/verify",
};

export default function View(): React.JSX.Element {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Placeholder for future PDF generation
    alert("PDF download will be available soon.");
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            View Certificate
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Preview exactly how your certificate will appear when exported or
            printed.
          </p>
        </div>

        <div className="no-print flex gap-3">
          <button
            onClick={handlePrint}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
          >
            🖨 Print
          </button>

          <button
            onClick={handleDownload}
            className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 font-medium text-white transition hover:bg-white/10"
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {/* Certificate */}
      <div className="print-certificate certificate-text rounded-3xl border border-white/15 bg-white p-10 shadow-2xl">

        {/* Top */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {certificate.institution}
          </span>

          <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-700">
            {certificate.credentialId}
          </span>
        </div>

        {/* Badge */}
        <div className="mt-10 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-400 bg-amber-100 text-5xl">
            🏅
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-8 text-center text-4xl font-bold text-slate-900">
          {certificate.title}
        </h3>

        <p className="mt-6 text-center text-base text-slate-600">
          This certifies that
        </p>

        {/* Recipient */}
        <p className="mt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-center text-4xl font-extrabold text-transparent">
          {certificate.recipient}
        </p>

        <p className="mt-6 text-center text-base text-slate-600">
          has successfully demonstrated outstanding proficiency in
        </p>

        <p className="mt-3 text-center text-2xl font-semibold text-slate-800">
          {certificate.course}
        </p>

        {/* Footer */}
        <div className="mt-12 grid gap-8 border-t border-slate-200 pt-8 md:grid-cols-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Issued
            </p>

            <p className="mt-2 text-base font-medium text-slate-800">
              {certificate.issued}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Signed By
            </p>

            <p className="mt-2 text-base font-medium text-slate-800">
              {certificate.signer}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Verification
            </p>

            <a
              href={certificate.verificationUrl}
              className="mt-2 block text-base font-medium text-indigo-600 hover:underline"
            >
              Verify Certificate
            </a>
          </div>

          {/* QR Placeholder */}
          <div className="flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
              QR
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Scan to Verify
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="no-print rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <h4 className="font-semibold text-blue-300">
          Printing Tips
        </h4>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>Use your browser's print dialog for the best layout.</li>
          <li>Enable background graphics for accurate colors.</li>
          <li>Choose "Save as PDF" to export digitally.</li>
          <li>Headers and footers are hidden during printing.</li>
        </ul>
      </div>
    </section>
  );
}