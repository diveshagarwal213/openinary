import sharp from "sharp";
import { ImageResizeTransformParams, OverlayTransformParams } from "../../types";
import logger from "../logger";

/**
 * Apply overlay tranforms to Sharp image.
 */
export const applyOverlayImage = async (
  image: sharp.Sharp,
  params: OverlayTransformParams & ImageResizeTransformParams,
): Promise<sharp.Sharp> => {
  if (!params.overlayPath) return image;

  try {
    const overlayImage = sharp(params.overlayPath);
    const baseImageMetaData = await image.metadata();
    const overlayImageMetaData = await overlayImage.metadata();

    const baseW = params.width || baseImageMetaData.width || 0;
    const baseH = params.height || baseImageMetaData.height || 0;
    const ow = overlayImageMetaData.width || 1;
    const oh = overlayImageMetaData.height || 1;
    const overlayAspect = ow / oh;

    // Calculate specified width
    let calcW: number | undefined = undefined;
    if (typeof params.overlayWidth === "number") {
      calcW = params.overlayWidth;
    } else if (typeof params.overlayWidth === "string") {
      const pct = parseFloat(params.overlayWidth.replace("p", "")) / 100;
      calcW = Math.round(baseW * pct);
    }

    // Calculate specified height
    let calcH: number | undefined = undefined;
    if (typeof params.overlayHeight === "number") {
      calcH = params.overlayHeight;
    } else if (typeof params.overlayHeight === "string") {
      const pct = parseFloat(params.overlayHeight.replace("p", "")) / 100;
      calcH = Math.round(baseH * pct);
    }

    // Preserve aspect ratio if only one dimension is specified
    let targetW: number;
    let targetH: number;

    if (calcW !== undefined && calcH !== undefined) {
      targetW = calcW;
      targetH = calcH;
    } else if (calcW !== undefined) {
      targetW = calcW;
      targetH = Math.max(1, Math.round(calcW / overlayAspect));
    } else if (calcH !== undefined) {
      targetH = calcH;
      targetW = Math.max(1, Math.round(calcH * overlayAspect));
    } else {
      targetW = ow;
      targetH = oh;
    }

    // Cap to base image dimensions if needed
    if (baseW > 0) targetW = Math.min(targetW, baseW);
    if (baseH > 0) targetH = Math.min(targetH, baseH);

    const overlayResizedBuffer = await overlayImage
      .resize({
        width: targetW,
        height: targetH,
        fit: "fill",
      })
      .ensureAlpha()
      .composite([
        {
          input: {
            create: {
              width: targetW,
              height: targetH,
              channels: 4,
              background: {
                r: 255,
                g: 255,
                b: 255,
                alpha:
                  params.overlayOpacity != null
                    ? params.overlayOpacity / 100
                    : 0.5,
              },
            },
          },
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();

    let xOffset: number | undefined = undefined;
    if (typeof params.overlayXOffset === "number") {
      xOffset = params.overlayXOffset;
    } else if (typeof params.overlayXOffset === "string") {
      const pct = parseFloat(params.overlayXOffset.replace("p", "")) / 100;
      xOffset = Math.round(baseW * pct);
    }

    let yOffset: number | undefined = undefined;
    if (typeof params.overlayYOffset === "number") {
      yOffset = params.overlayYOffset;
    } else if (typeof params.overlayYOffset === "string") {
      const pct = parseFloat(params.overlayYOffset.replace("p", "")) / 100;
      yOffset = Math.round(baseH * pct);
    }

    const output = await image
      .composite([
        {
          input: overlayResizedBuffer,
          gravity: params.overlayGravity,
          top: yOffset,
          left: xOffset,
          tile: params.overlayTiled,
        },
      ])
      .png()
      .toBuffer();

    return sharp(output);
  } catch (e) {
    logger.error(e);
    throw new Error("Applying overlay to image failed.");
  }
};
