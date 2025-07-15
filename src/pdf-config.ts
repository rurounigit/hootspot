// src/pdf-config.ts

/**
 * Configuration file for visual aspects of the PDF generation.
 * This provides a central place to tweak the appearance of the bubble chart image.
 */
export const PDF_CONFIG = {
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
  CHART_ZOOM_PADDING: 30,

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