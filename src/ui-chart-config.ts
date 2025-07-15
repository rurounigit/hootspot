// src/ui-chart-config.ts

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