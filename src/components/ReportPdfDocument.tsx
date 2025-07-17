// src/components/ReportPdfDocument.tsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';

type PatternColorMap = Record<string, string>;

/* ---------- PDF-safe color helper ---------- */
const getSafeBackgroundColor = (hslColor: string): string => {
  if (!hslColor || !hslColor.startsWith('hsl')) return '#f3f4f6';
  try {
    const parts = hslColor.match(/hsl\((\d+\.?\d*),\s*(\d+)%,\s*(\d+)%\)/);
    if (!parts) return '#f3f4f6';
    const [, hue, saturation] = parts;
    /* 95 % lightness → very light, opaque, PDF-safe */
    return `hsl(${hue}, ${saturation}%, 95%)`;
  } catch {
    return '#f3f4f6';
  }
};

/* ---------- grouping helper ---------- */
const groupByCategory = (findings: GeminiFinding[]): Record<string, GeminiFinding[]> =>
  findings.reduce<Record<string, GeminiFinding[]>>((acc, f) => {
    const key = f.category || 'Uncategorized';
    (acc[key] ||= []).push(f);
    return acc;
  }, {});

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    backgroundColor: '#FFFFFF',
    color: '#374151',
  },
  // New Header Styles
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerHootspotText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    color: '#1f2937',
  },
  hr: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 15,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#60a5fa',
    padding: 12,
    marginBottom: 24,
    borderRadius: 4,
  },
  summaryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#1d4ed8',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    color: '#1e40af',
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    marginBottom: 16,
    marginTop: 12,
  },
  sourceTextContainer: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
  },
  highlightedText: {
    backgroundColor: '#fecaca',
    color: '#1f2937',
  },
  sourceText: {
    fontSize: 9,
    lineHeight: 1.6,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  findingCard: {
    borderRadius: 6,
    marginBottom: 12,
    padding: 1,
  },
  findingCardInner: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  findingHeader: {
    padding: 10,
  },
  findingPatternName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  findingBody: {
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  findingQuoteLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 4,
    color: '#4b5563',
  },
  findingQuote: {
    fontFamily: 'Helvetica-Oblique',
    padding: 8,
    borderLeftWidth: 3,
    marginBottom: 12,
    borderRadius: 4,
  },
  findingExplanationLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 4,
    color: '#4b5563',
  },
  chartImage: {
    width: '100%',
    height: 'auto',
    marginBottom: 20,
    alignSelf: 'center',
  },
  rebuttalContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#60a5fa',
    padding: 12,
    marginTop: 12,
    borderRadius: 4,
    breakInside: 'avoid',
  },
  rebuttalText: {
    fontSize: 11,
    color: '#1e40af',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#6b7280',
  },
});

/* ---------- highlighted source text ---------- */
const HighlightedSourceTextView = ({
  text,
  highlights,
}: {
  text: string;
  highlights: { start: number; end: number }[];
}): JSX.Element => {
  if (!highlights.length) return <Text style={styles.sourceText}>{text}</Text>;

  const segments: JSX.Element[] = [];
  let last = 0;
  [...highlights]
    .sort((a, b) => a.start - b.start)
    .forEach((h, i) => {
      if (h.start > last) segments.push(<Text key={`t-${i}`}>{text.slice(last, h.start)}</Text>);
      segments.push(
        <Text key={`h-${i}`} style={styles.highlightedText}>
          {text.slice(h.start, h.end)}
        </Text>
      );
      last = h.end;
    });
  if (last < text.length) segments.push(<Text key="end">{text.slice(last)}</Text>);
  return <Text style={styles.sourceText}>{segments}</Text>;
};

/* ---------- main component ---------- */
interface ReportPdfDocumentProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  highlightData: { start: number; end: number }[];
  chartImage: string | null;
  patternColorMap: PatternColorMap;
  rebuttal: string | null;
  translations: {
    reportTitle: string;
    summaryTitle: string;
    highlightedTextTitle: string;
    profileTitle: string;
    detectedPatternsTitle: string;
    rebuttalTitle: string;
    quoteLabel: string;
    explanationLabel: string;
    pageNumber: string;
    categoryNames: Record<string, string>;
  };
}

export const ReportPdfDocument = ({
  analysis,
  sourceText,
  highlightData,
  chartImage,
  translations,
  patternColorMap,
  rebuttal
}: ReportPdfDocumentProps): JSX.Element => {
  const findingsByCategory = groupByCategory(analysis?.findings || []);
  const defaultColor = '#dddddd';

  return (
    <Document title={translations.reportTitle} author="HootSpot AI">
      <Page size="A4" style={styles.page}>
        {/* MODIFIED HEADER */}
        <View>
          <View style={styles.headerSection}>
            <Image style={styles.logo} src="/images/icons/icon.png" />
            <Text style={styles.headerHootspotText}>HootSpot</Text>
          </View>
          <View style={styles.hr} />
          <Text style={styles.title}>{translations.reportTitle}</Text>
        </View>

        {analysis?.analysis_summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>{translations.summaryTitle}</Text>
            <Text style={styles.summaryText}>{analysis.analysis_summary}</Text>
          </View>
        )}

        {sourceText && highlightData?.length && (
          <View>
            <Text style={styles.sectionTitle}>{translations.highlightedTextTitle}</Text>
            <View style={styles.sourceTextContainer}>
              <HighlightedSourceTextView text={sourceText} highlights={highlightData} />
            </View>
          </View>
        )}

        {chartImage && (
          <View break>
            <Text style={styles.sectionTitle}>{translations.profileTitle}</Text>
            <Image src={chartImage} style={styles.chartImage} />
          </View>
        )}

        {Object.keys(findingsByCategory).length > 0 && (
          <View break={!chartImage}>
            <Text style={styles.sectionTitle}>{translations.detectedPatternsTitle}</Text>
            {Object.entries(findingsByCategory).map(([categoryKey, findings]) => (
              <View key={categoryKey} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>
                  {translations.categoryNames[categoryKey] || categoryKey}
                </Text>
                {(findings as GeminiFinding[]).map((finding, idx) => {
                  const color = patternColorMap[finding.pattern_name] || defaultColor;
                  const safeBg = getSafeBackgroundColor(color);
                  return (
                    // WRAPPER FOR PAGE BREAK AVOIDANCE
                    <View key={idx} style={{ breakInside: 'avoid' }}>
                      <View
                        style={[styles.findingCard, { backgroundColor: color }]}
                      >
                        <View style={styles.findingCardInner}>
                          <View style={[styles.findingHeader, { backgroundColor: color }]}>
                            <Text style={styles.findingPatternName}>{finding.display_name}</Text>
                          </View>
                          <View style={styles.findingBody}>
                            <Text style={styles.findingQuoteLabel}>
                              {translations.quoteLabel}
                            </Text>
                            <View
                              style={[
                                styles.findingQuote,
                                { backgroundColor: safeBg, borderLeftColor: color },
                              ]}
                            >
                              <Text>"{finding.specific_quote}"</Text>
                            </View>
                            <Text style={styles.findingExplanationLabel}>
                              {translations.explanationLabel}
                            </Text>
                            <Text>{finding.explanation}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {rebuttal && (
          <View break>
            <Text style={styles.sectionTitle}>{translations.rebuttalTitle}</Text>
            <View style={styles.rebuttalContainer}>
              <Text style={styles.rebuttalText}>{rebuttal}</Text>
            </View>
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            translations.pageNumber
              .replace('{pageNumber}', String(pageNumber))
              .replace('{totalPages}', String(totalPages))
          }
          fixed
        />
      </Page>
    </Document>
  );
};