/**
 * Download Venture Design draft as standalone HTML portfolio page.
 * @param {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} draft
 * @param {string} squadName
 */
export function downloadVentureDesignHtml(draft, squadName) {
  const activePersonalities = Object.entries(draft.step4.personality)
    .filter(([, on]) => on)
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
    .join(', ');

  const uvp = `We help ${draft.step3.synthesisA || '[Target]'} achieve ${draft.step3.synthesisB || '[Transformation]'} through ${draft.step3.synthesisC || '[Mechanism]'}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Venture Design — ${draft.step4.name || squadName}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1c1917; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #fafaf9; }
    .header { text-align: center; border-bottom: 3px solid #8B0000; padding-bottom: 30px; margin-bottom: 40px; }
    h1 { color: #8B0000; margin: 0 0 10px; font-size: 36px; }
    .tagline { color: #ca8a04; font-size: 20px; font-style: italic; }
    .uvp-box { background: #8B0000; color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
    .box { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e7e5e4; border-top: 4px solid #1c1917; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#78716c">Financial Entrepreneurship Canvas — Draft 1</p>
    <h1>${escapeHtml(draft.step4.name || 'Untitled Venture')}</h1>
    <p class="tagline">"${escapeHtml(draft.step4.tagline || '')}"</p>
    <p><strong>Prepared by:</strong> ${escapeHtml(squadName)}</p>
  </div>
  <div class="uvp-box"><p style="font-size:24px;font-weight:bold;margin:0">${escapeHtml(uvp)}</p></div>
  <div class="grid">
    <div class="box"><h3>Target Customer</h3><p>${escapeHtml(draft.step1.customer)}</p><p>${escapeHtml(draft.step1.problem)}</p></div>
    <div class="box"><h3>Transformation</h3><p>Before: ${escapeHtml(draft.step2.beforeFeeling)}</p><p>After: ${escapeHtml(draft.step2.afterFeeling)}</p></div>
  </div>
  <div class="box"><h3>Brand</h3><p>${escapeHtml(activePersonalities)}</p><p>${escapeHtml(draft.step4.clientFeeling)}</p></div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Venture_Design_${(draft.step4.name || squadName).replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** @param {string} value */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
