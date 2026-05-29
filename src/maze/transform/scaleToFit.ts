import { rotationScale } from '../core/geometry';
export function scaleToFit(width: number, height: number, rotationAngle: number) { return rotationScale(width, height, rotationAngle); }
