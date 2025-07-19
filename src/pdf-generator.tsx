// src/pdf-generator.tsx

import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { pdf } from '@react-pdf/renderer';
import { ReportPdfDocument } from './components/pdf/ReportPdfDocument';

const generatePdf = async (event: MessageEvent) => {
  // --- FOOLPROOF DEBUGGING ---
  const logs: any[] = [];
  const sendDebugMessage = (title: string, data: any) => {
    try {
      logs.push(`[${title}]: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      logs.push(`[${title}]: Could not stringify data.`);
    }
  };
  // --- END DEBUGGING ---

  if (event.origin !== window.location.origin) return;

  const { type, data } = event.data;
  if (type !== 'GENERATE_PDF') return;

  sendDebugMessage("START", "GENERATE_PDF message received.");
  sendDebugMessage("DATA_PAYLOAD", data);
  sendDebugMessage("ANALYSIS_OBJECT", data ? data.analysis : "Data or Analysis is NULL");
  sendDebugMessage("FINDINGS_BY_CATEGORY", data && data.analysis ? data.analysis.findingsByCategory : "Analysis or FindingsByCategory is NULL");

  try {
    const blob = await pdf(
      <ReportPdfDocument
        analysis={data.analysis}
        sourceText={data.sourceText}
        highlightData={data.highlightData}
        chartImage={data.chartImage}
        patternColorMap={data.patternColorMap}
        translations={data.translations}
        rebuttal={data.rebuttal}
      />
    ).toBlob();

    window.parent.postMessage({ type: 'PDF_GENERATED', blob }, '*');

  } catch (error: any) {
    // ON CRASH, SEND ALL LOGS BACK
    window.parent.postMessage({
      type: 'PDF_CRASH_REPORT',
      payload: {
        errorMessage: error.message,
        logs: logs
      }
    }, '*');
  }
};

window.addEventListener('message', generatePdf);
window.parent.postMessage({ type: 'PDF_SANDBOX_READY' }, '*');
