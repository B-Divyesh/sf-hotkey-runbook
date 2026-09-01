export function demoBannerTemplate(active: boolean): string {
  if (!active) return "";
  return `<aside class="demo-banner" aria-label="Demo mode"><span><strong>Demo</strong> — bundled sample only; your real runbooks and history are not read or changed.</span><span><button class="text-button" data-action="reset-demo">Reset demo</button><button class="text-button" data-action="start-real">Start for real</button></span></aside>`;
}
