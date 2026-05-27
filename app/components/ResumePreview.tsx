/**
 * @file ResumePreview.tsx
 * @description Client component that renders the first page of a PDF resume
 * using react-pdf. Must be loaded with next/dynamic (ssr: false) because
 * pdf.js requires browser APIs.
 */

"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Renders the first page of a PDF at the given URL.
 * @param {{ url: string }} props - Public URL of the PDF file to preview
 * @returns {JSX.Element} A single-page PDF preview at 600px width
 */
export default function ResumePreview({ url }: { url: string }) {
  return (
    <Document file={url}>
      <Page pageNumber={1} width={600} />
    </Document>
  );
}