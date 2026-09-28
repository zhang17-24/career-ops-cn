// Development-only Ego Lite helper. Observe one known public request in page
// memory; never replay requests, read headers/cookies, or write response files.
export function publicCaptureScript(endpoint, { ignoreQueryParams = [] } = {}) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) throw new Error('Expected exact public HTTPS endpoint');
  if (!Array.isArray(ignoreQueryParams) || ignoreQueryParams.length > 4 || new Set(ignoreQueryParams).size !== ignoreQueryParams.length ||
      ignoreQueryParams.some(key => typeof key !== 'string' || !/^[A-Za-z_][\w.-]{0,63}$/.test(key) ||
        /^(?:page|pageNo|pageNum|pageSize|offset|limit|cursor|q|w|keyword|search|filter|sort|id|positionId|jobId|orgId|tenantId|companyId|token|access_token|signature|sign|nonce|authorization)$/i.test(key) ||
        url.searchParams.getAll(key).length !== 1)) throw new Error('Ignored parameters must be explicit observed tracking keys, not paging, identity or authentication');
  return `(${installPublicCapture.toString()})(${JSON.stringify(url.href)},${JSON.stringify(ignoreQueryParams)})`;
}

// Register this with Page.addScriptToEvaluateOnNewDocument in the selected Ego
// tab before navigating. Scope to the exact document and top frame; callers
// remove the CDP registration and stop the in-memory capture in finally.
export function publicCapturePreload(endpoint, documentUrl, options) {
  const doc = new URL(documentUrl);
  if (doc.protocol !== 'https:' || doc.username || doc.password || doc.port) throw new Error('Expected exact public HTTPS document');
  const script = publicCaptureScript(endpoint, options);
  return `if (window === window.top && location.href === ${JSON.stringify(doc.href)}) { ${script}; }`;
}

function installPublicCapture(endpoint, ignoreQueryParams) {
  window.__careerPublicCapture?.stop();
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalFetch = window.fetch;
  const requests = new WeakMap();
  const limit = 2 * 1024 * 1024;
  let claimed = false;
  const matchingKey = value => {
    const u = new URL(value, location.href);
    for (const key of ignoreQueryParams) {
      if (u.searchParams.getAll(key).length !== 1) return null;
      u.searchParams.delete(key);
    }
    return u.href;
  };
  const expected = matchingKey(endpoint);
  const state = { endpoint, ignoreQueryParams, record: null, error: null, stop };
  function claim(url, method, body) {
    const actualUrl = new URL(url, location.href).href;
    if (claimed || matchingKey(actualUrl) !== expected) return false;
    claimed = true;
    if (body != null && typeof body !== 'string') { state.error = 'Unsupported request body'; return false; }
    if (body?.length > 16384) { state.error = 'Request body too large'; return false; }
    state.record = { url: actualUrl, method, body: body || '', status: null, response: null };
    return true;
  }
  function save(status, value) {
    if (typeof value !== 'string' || value.length > limit) { state.error = 'Response unavailable or too large'; return; }
    state.record.status = status;
    state.record.response = value;
  }
  function open(method, url, ...args) {
    requests.set(this, { method, url });
    return originalOpen.call(this, method, url, ...args);
  }
  function send(body) {
    const request = requests.get(this);
    if (request && claim(request.url, request.method, body)) {
      this.addEventListener('loadend', () => {
        try { save(this.status, this.responseType === 'json' ? JSON.stringify(this.response) : this.responseText); }
        catch { state.error = 'Response unreadable'; }
      }, { once: true });
    }
    return originalSend.call(this, body);
  }
  async function fetch(input, init) {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    // Never consume a Request stream merely to inspect it.
    const capture = !(input instanceof Request) && claim(url, init?.method || 'GET', init?.body);
    const response = await originalFetch.call(this, input, init);
    if (capture) {
      const reader = response.clone().body?.getReader();
      if (!reader) state.error = 'Empty response stream';
      else {
        const decoder = new TextDecoder(); let text = ''; let bytes = 0;
        try {
          while (true) {
            const { done, value } = await reader.read(); if (done) break;
            bytes += value.byteLength;
            if (bytes > limit) { void reader.cancel(); throw new Error('Response too large'); }
            text += decoder.decode(value, { stream: true });
          }
          save(response.status, text + decoder.decode());
        } catch (error) { state.error = error.message; }
      }
    }
    return response;
  }
  function stop() {
    if (XMLHttpRequest.prototype.open === open) XMLHttpRequest.prototype.open = originalOpen;
    if (XMLHttpRequest.prototype.send === send) XMLHttpRequest.prototype.send = originalSend;
    if (window.fetch === fetch) window.fetch = originalFetch;
    state.record = null;
    delete window.__careerPublicCapture;
  }
  XMLHttpRequest.prototype.open = open;
  XMLHttpRequest.prototype.send = send;
  window.fetch = fetch;
  window.__careerPublicCapture = state;
  return { installed: true, endpoint };
}
