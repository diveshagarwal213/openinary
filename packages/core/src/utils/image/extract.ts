import sharp from "sharp";

/**
 * Resolve an offset value to pixels.
 *
 * - number → used directly as pixel offset
 * - string ending with "p" (e.g. "30p") → percentage of the given dimension
 * - other string → parsed as integer pixel value
 */
const resolveOffset = (value: number | string, dimension: number): number => {
  if (typeof value === "string" && value.endsWith("p")) {
    const pct = parseFloat(value) / 100;
    return Math.round(pct * dimension);
  }
  return typeof value === "number" ? value : parseInt(value, 10);
};

/**
 * Extract a region from an image at specific x,y coordinates.
 * Used when c_crop is combined with x/y parameters for position-based cropping.
 *
 * - Pixel values: x=100, y=50 → extract at (100, 50)
 * - Percentage strings: x="30p", y="20p" → 30% of width, 20% of height
 * - The extraction region is clamped to image bounds to prevent errors.
 */
export const applyExtract = async (
  image: sharp.Sharp,
  x: number | string,
  y: number | string,
  width: number,
  height: number,
): Promise<sharp.Sharp> => {
  const metadata = await image.metadata();
  const imgWidth = metadata.width || 0;
  const imgHeight = metadata.height || 0;

  if (imgWidth === 0 || imgHeight === 0) {
    return image;
  }

  // Resolve percentage/pixel values
  let left = resolveOffset(x, imgWidth);
  let top = resolveOffset(y, imgHeight);

  // Clamp origin to image bounds
  left = Math.max(0, Math.min(left, imgWidth - 1));
  top = Math.max(0, Math.min(top, imgHeight - 1));

  // Clamp width/height so extraction stays within image bounds
  const extractWidth = Math.min(width, imgWidth - left);
  const extractHeight = Math.min(height, imgHeight - top);

  if (extractWidth <= 0 || extractHeight <= 0) {
    return image; // Nothing valid to extract
  }

  return image.extract({
    left,
    top,
    width: extractWidth,
    height: extractHeight,
  });
};
