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

    const width = Math.min(
      params.width || baseImageMetaData.width || 0,
      params.overlayWidth || overlayImageMetaData.width || 0,
    );
    const height = Math.min(
      params.height || baseImageMetaData.height || 0,
      params.overlayHeight || overlayImageMetaData.height || 0,
    );

    const overlayResizedBuffer = await overlayImage
      .resize({
        width,
        height,
      })
      .ensureAlpha()
      .composite([
        {
          input: {
            create: {
              width,
              height,
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

    const baseW = params.width || baseImageMetaData.width || 0;
    const baseH = params.height || baseImageMetaData.height || 0;

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
