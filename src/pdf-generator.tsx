// src/pdf-generator.tsx

import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReportPdfDocument } from './components/ReportPdfDocument';

const generatePdf = async (event: MessageEvent) => {
  console.log('SANDBOX: Message received from parent window.');

  if (event.origin !== window.location.origin) {
    console.warn("SANDBOX: Message rejected from unknown origin:", event.origin);
    return;
  }

  const { type, data } = event.data;
  if (type !== 'GENERATE_PDF') return;

  console.log('SANDBOX: Received GENERATE_PDF command with data:', data);

  // CORRECTED: Destructure the 'translations' object from the data prop
  const {
    analysis,
    sourceText,
    highlightData,
    chartImages,
    profileData,
    patternColorMap,
    translations, // <<< THIS WAS MISSING
  } = data;

  try {
    console.log('SANDBOX: Starting PDF generation with @react-pdf/renderer...');
    const blob = await pdf(
      <ReportPdfDocument
        analysis={analysis}
        sourceText={sourceText}
        highlightData={highlightData}
        chartImages={chartImages}
        profileData={profileData}
        patternColorMap={patternColorMap}
        translations={translations} // <<< THIS WAS MISSING
      />
    ).toBlob();

    console.log('SANDBOX: PDF generation successful. Sending blob back to parent.');
    window.parent.postMessage({ type: 'PDF_GENERATED', blob }, '*');

  } catch (error) {
    console.error("SANDBOX: PDF Generation Failed! Error:", error);
    window.parent.postMessage({ type: 'PDF_ERROR', error: error.message }, window.location.origin);
  }
};

window.addEventListener('message', generatePdf);