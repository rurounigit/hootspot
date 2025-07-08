// src/components/ReportPdfDocument.tsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { GeminiFinding } from '../types';

type PatternColorMap = Record<string, string>;

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
  header: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#60a5fa',
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
    breakInside: 'avoid',
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
    breakInside: 'avoid',
    overflow: 'hidden',
    borderWidth: 1,
  },
  findingHeader: {
    padding: 10,
  },
  findingPatternName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#FFFFFF'
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

interface HighlightedTextProps {
    text: string;
    highlights: { start: number; end: number }[];
}

interface ReportPdfDocumentProps {
  analysis: {
    analysis_summary: string;
    findingsByCategory: Record<string, GeminiFinding[]>;
  };
  sourceText: string | null;
  highlightData: { start: number; end: number }[];
  chartImage: string | null;
  patternColorMap: PatternColorMap;
  translations: {
    reportTitle: string;
    summaryTitle: string;
    highlightedTextTitle: string;
    profileTitle: string;
    detectedPatternsTitle: string;
    quoteLabel: string;
    explanationLabel: string;
    pageNumber: string;
    categoryNames: Record<string, string>;
  };
}

const HighlightedSourceTextView = ({ text, highlights }: HighlightedTextProps): JSX.Element => {
    if (!highlights || highlights.length === 0) {
        return <Text style={styles.sourceText}>{text}</Text>;
    }

    // This needs to be an array of JSX.Element, not React.ReactNode for PDF renderer
    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((h, i) => {
      if (h.start > lastIndex) {
        segments.push(<Text key={`text-${i}`}>{text.substring(lastIndex, h.start)}</Text>);
      }
      segments.push(<Text key={`highlight-${i}`} style={styles.highlightedText}>{text.substring(h.start, h.end)}</Text>);
      lastIndex = h.end;
    });

    if (lastIndex < text.length) {
        segments.push(<Text key="text-end">{text.substring(lastIndex)}</Text>);
    }

    return <Text style={styles.sourceText}>{segments}</Text>;
};

export const ReportPdfDocument = ({ analysis, sourceText, highlightData, chartImage, translations, patternColorMap }: ReportPdfDocumentProps): JSX.Element => {
  const defaultColor = '#dddddd';

  return (
    <Document title={translations.reportTitle} author="HootSpot AI">
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{translations.reportTitle}</Text>

        <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>{translations.summaryTitle}</Text>
            <Text style={styles.summaryText}>{analysis.analysis_summary}</Text>
        </View>

        {sourceText && highlightData && highlightData.length > 0 && (
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

        {Object.keys(analysis.findingsByCategory).length > 0 && (
          <View break>
            <Text style={styles.sectionTitle}>{translations.detectedPatternsTitle}</Text>
            {/* DEFINITIVE FIX: Corrected the mapping function's closing tags */}
            {Object.entries(analysis.findingsByCategory).map(([categoryKey, findings]) => (
              <View key={categoryKey} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{translations.categoryNames[categoryKey] || categoryKey}</Text>
                {findings.map((finding, index) => {
                  const color = patternColorMap[finding.pattern_name] || defaultColor;
                  return (
                    <View key={index} style={[styles.findingCard, { borderColor: color }]}>
                      <View style={[styles.findingHeader, { backgroundColor: color, borderBottomColor: color, borderBottomWidth: 1 }]}>
                        <Text style={styles.findingPatternName}>
                          {finding.translated_pattern_name}
                        </Text>
                      </View>
                      <View style={styles.findingBody}>
                        <Text style={styles.findingQuoteLabel}>{translations.quoteLabel}</Text>
                        <Text style={[styles.findingQuote, { backgroundColor: `${color}40`, borderLeftColor: color }]}>
                          "{finding.specific_quote}"
                        </Text>
                        <Text style={styles.findingExplanationLabel}>{translations.explanationLabel}</Text>
                        <Text>{finding.explanation}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${translations.pageNumber.replace('{pageNumber}', String(pageNumber)).replace('{totalPages}', String(totalPages))}`} fixed />
      </Page>
    </Document>
  );
};