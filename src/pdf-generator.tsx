// src/pdf-generator.tsx

import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReportPdfDocument } from './components/ReportPdfDocument';

const generatePdf = async (event: MessageEvent) => {
  console.log('SANDBOX: Message received from parent window.'); // LOG 1

  if (event.origin !== window.location.origin) {
    console.warn("SANDBOX: Message rejected from unknown origin:", event.origin);
    return;
  }

  const { type, data } = event.data;
  if (type !== 'GENERATE_PDF') return;

  console.log('SANDBOX: Received GENERATE_PDF command with data:', data); // LOG 2

  const { analysis, sourceText, highlightData, chartImages, profileData } = data;

  try {
    console.log('SANDBOX: Starting PDF generation with @react-pdf/renderer...'); // LOG 3
    const blob = await pdf(
      <ReportPdfDocument
        analysis={analysis}
        sourceText={sourceText}
        highlightData={highlightData}
        chartImages={chartImages}
        profileData={profileData}
      />
    ).toBlob();

    console.log('SANDBOX: PDF generation successful. Sending blob back to parent.'); // LOG 4
    window.parent.postMessage({ type: 'PDF_GENERATED', blob }, window.location.origin);

  } catch (error) {
    console.error("SANDBOX: PDF Generation Failed! Error:", error); // LOG 5
    window.parent.postMessage({ type: 'PDF_ERROR', error: error.message }, window.location.origin);
  }
};

window.addEventListener('message', generatePdf);