// src/config/chart.ts

/**
 * Configuration file for visual aspects of the interactive bubble chart in the UI.
 * This provides a central place to tweak the appearance of the main chart display.
 */
export const UI_CHART_CONFIG = {
  /**
   * Padding between the text and the edge of the bubble.
   * This is a factor of the radius. 0.9 means the text can occupy 90% of the
   * bubble's diameter, leaving a 5% padding on all sides.
   * To increase padding, make this value smaller (e.g., 0.85).
   */
  BUBBLE_TEXT_PADDING_FACTOR: 0.80,

  /**
   * Maximum font size for the labels inside the bubbles.
   * The algorithm will never choose a font size larger than this.
   */
  BUBBLE_MAX_FONT_SIZE: 24,

  /**
   * Minimum font size for the labels inside the bubbles.
   */
  BUBBLE_MIN_FONT_SIZE: 6,

  /**
   * Border size (stroke width) of the category hulls.
   */
  HULL_BORDER_SIZE: 2,

  /**
   * "Zoom level" for the overall chart's viewBox.
   * This is a padding value added around the entire bubble group within the SVG.
   * A larger value "zooms out" (more empty space), a smaller value "zooms in".
   */
  VIEWBOX_ZOOM_PADDING: 20,

  /**
   * Stroke width for an active (clicked) bubble.
   */
  ACTIVE_BUBBLE_STROKE_WIDTH: 4,

  /**
   * Text shadow for bubble labels to improve readability.
   */
  BUBBLE_TEXT_SHADOW: '0px 1px 2px rgba(0,0,0,0.5)',
};

/**
 * Configuration file for visual aspects of the PDF generation.
 * This provides a central place to tweak the appearance of the bubble chart image.
 */

// ADDED: Default text values for the PDF header and title.
export const PDF_HEADER_TEXT = 'HootSpot';
export const PDF_TITLE_TEXT = 'AI Analysis Report';

export const PDF_CHART_CONFIG = {
  /**
   * Padding between the text and the edge of the bubble.
   * This is a factor of the radius. 0.9 means the text
   * can occupy 90% of the bubble's diameter, leaving a 5% padding on all sides.
   * TO INCREASE PADDING, MAKE THIS VALUE SMALLER (e.g., 0.85).
   */
  BUBBLE_TEXT_PADDING_FACTOR: 0.80,

  /**
   * Maximum font size for the labels inside the bubbles.
   * The algorithm will never choose a font size larger than this.
   */
  BUBBLE_MAX_FONT_SIZE: 28,

  /**
   * Minimum font size for the labels inside the bubbles.
   */
  BUBBLE_MIN_FONT_SIZE: 6,

  /**
   * Border size (stroke width) of the category hulls.
   */
  HULL_BORDER_SIZE: 2,

  /**
   * "Zoom level" for the overall chart.
   * This is a padding value (in pixels) around the entire bubble group.
   * A larger value "zooms out" (more empty space), a smaller value "zooms in".
   */
  CHART_ZOOM_PADDING: 50,

  /**
   * Background color for the generated chart image.
   * Use any valid CSS color string (e.g., '#FFFFFF', 'transparent').
   */
  CHART_BACKGROUND_COLOR: '#FFFFFF',

  /**
   * Resolution/Scaling factor for the chart image.
   * This is passed to html2canvas as the 'scale' option. A higher value creates a
   * higher-resolution image, resulting in a clearer PDF but a larger file size.
   * A value of 2 is a good balance for high-DPI (Retina) screens.
   */
  CHART_IMAGE_SCALE: 2,
};
