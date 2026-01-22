type Box = { x: number; y: number; width: number; height: number; confidence?: number };

export function describeLocation(box: Box, imgW: number, imgH: number) {
  const cx = box.x;
  const cy = box.y;

  const xNorm = cx / imgW;
  const yNorm = cy / imgH;

  const horiz =
    xNorm < 0.33 ? "left" : xNorm < 0.66 ? "center" : "right";
  const vert =
    yNorm < 0.33 ? "top" : yNorm < 0.66 ? "middle" : "bottom";

  const shelf =
    yNorm < 0.33 ? "top shelf area" : yNorm < 0.66 ? "middle shelf area" : "bottom shelf area";

  const area = (box.width * box.height) / (imgW * imgH);
  const distanceHint =
    area > 0.08 ? "very close" : area > 0.03 ? "close" : area > 0.01 ? "a bit far" : "far";

  return {
    horiz,
    vert,
    shelf,
    distanceHint,
    phrase: `${vert} ${horiz}, ${shelf}`,
  };
}
