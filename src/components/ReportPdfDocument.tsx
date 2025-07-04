// src/components/ReportPdfDocument.tsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { GeminiFinding } from '../types';

// Define a type for our color map object for clarity
type ColorInfo = { hex: string; border: string; text: string };
type PatternColorMap = Record<string, ColorInfo>;

// --- STYLESHEET UPDATES ---
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
    borderRadius: 4, // Add rounded corners
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
    backgroundColor: '#fecaca', // This is the light red highlight color from your screenshot
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
    // borderWidth is now set dynamically
    borderRadius: 6, // Add rounded corners
    marginBottom: 12,
    breakInside: 'avoid',
    overflow: 'hidden', // Important for rounded corners to clip content
  },
  findingHeader: {
    padding: 10,
    // borderBottomWidth is now set dynamically
  },
  findingPatternName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  findingBody: {
    padding: 12,
    backgroundColor: '#f9fafb', // A light gray for the body
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
    // borderLeftWidth is now set dynamically
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


// --- PROPS INTERFACE UPDATE ---
interface ReportPdfDocumentProps {
  analysis: {
    analysis_summary: string;
    findingsByCategory: Record<string, GeminiFinding[]>;
  };
  sourceText: string | null;
  highlightData: { start: number; end: number }[];
  chartImages: Record<string, string>;
  profileData: any[];
  patternColorMap: PatternColorMap; // Add the new prop
}

// Helper component to render highlighted text
const HighlightedSourceTextView: React.FC<{ text: string, highlights: { start: number; end: number }[] }> = ({ text, highlights }) => {
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    if (!highlights) return <Text style={styles.sourceText}>{text}</Text>;

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

// --- MAIN COMPONENT WITH DYNAMIC STYLING ---
export const ReportPdfDocument: React.FC<ReportPdfDocumentProps> = ({ analysis, sourceText, highlightData, chartImages, profileData, patternColorMap }) => {
  // A default color object for safety in case a pattern isn't in the map
  const defaultColor: ColorInfo = { hex: '#f3f4f6', border: '#d1d5db', text: '#1f2937' };

  return (
    <Document title="HootSpot AI Analysis Report" author="HootSpot AI">
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>HootSpot AI Analysis Report</Text>

        <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Analysis Summary</Text>
            <Text style={styles.summaryText}>{analysis.analysis_summary}</Text>
        </View>

        {sourceText && (
            <View>
                <Text style={styles.sectionTitle}>Highlighted Source Text</Text>
                <View style={styles.sourceTextContainer}>
                    <HighlightedSourceTextView text={sourceText} highlights={highlightData} />
                </View>
            </View>
        )}

        {profileData.some(s => s.hasFindings) && (
            <View break>
                <Text style={styles.sectionTitle}>Manipulation Profile</Text>
                {profileData.map(section => (
                    section.hasFindings && chartImages[section.title] ? (
                        <Image key={section.title} src={chartImages[section.title]} style={styles.chartImage} />
                    ) : null
                ))}
            </View>
        )}

        <View break>
          <Text style={styles.sectionTitle}>Detected Patterns</Text>
          {Object.entries(analysis.findingsByCategory).map(([category, findings]) => (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {findings.map((finding, index) => {
                // Get the color for this specific pattern from the map
                const color = patternColorMap[finding.pattern_name] || defaultColor;

                return (
                  <View key={index} style={[styles.findingCard, { border: `1px solid ${color.border}` }]}>
                    <View style={[styles.findingHeader, { backgroundColor: color.hex, borderBottom: `1px solid ${color.border}` }]}>
                      <Text style={[styles.findingPatternName, { color: color.text }]}>{finding.pattern_name}</Text>
                    </View>
                    <View style={styles.findingBody}>
                      <Text style={styles.findingQuoteLabel}>Specific Quote</Text>
                      <Text style={[styles.findingQuote, { backgroundColor: color.hex, borderLeftColor: color.border, borderLeftWidth: 3 }]}>
                        <Text style={{ color: color.text }}>"{finding.specific_quote}"</Text>
                      </Text>
                      <Text style={styles.findingExplanationLabel}>Explanation</Text>
                      <Text>{finding.explanation}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};