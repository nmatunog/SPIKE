/**
 * FEC canvas projection — role gates for Program Coach delivery tools.
 * @param {string} viewerRole
 */
export function canToggleFecCanvasMode(viewerRole) {
  return viewerRole === 'faculty' || viewerRole === 'mentor';
}
