#!/usr/bin/env python3
"""Local-only visual text editor for selected Make Sense Data pages."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import html
import hashlib
import json
import re
import threading
import webbrowser


ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = 5500
EDITABLE_PAGES = {
    "/": ROOT / "index.html",
    "/about/": ROOT / "about" / "index.html",
}
EDITABLE_TAGS = ("h1", "h2", "h3", "p")
ELEMENT_RE = re.compile(
    r"<(?P<tag>" + "|".join(EDITABLE_TAGS) + r")(?P<attrs>[^>]*)>"
    r"(?P<content>.*?)</(?P=tag)>",
    re.IGNORECASE | re.DOTALL,
)


EDITOR_ASSETS = r"""
<style id="local-visual-editor-styles">
  #local-editor-bar { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647;
    display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 14px;
    background: #102f35; color: #fff; box-shadow: 0 10px 35px rgba(0,0,0,.25);
    font: 600 14px/1.2 system-ui, sans-serif; }
  #local-editor-bar button { border: 0; border-radius: 9px; padding: 10px 14px;
    cursor: pointer; color: #102f35; background: #fff; font: inherit; }
  #local-editor-bar button[data-action="save"] { background: #f6a28c; }
  #local-editor-bar button[hidden], #local-editor-status[hidden] { display: none; }
  #local-editor-status { padding: 0 5px; font-weight: 500; }
  body.local-editing [data-local-edit-id] { cursor: text; outline: 1px dashed rgba(20,117,119,.55);
    outline-offset: 5px; border-radius: 2px; }
  body.local-editing [data-local-edit-id]:hover { outline: 2px solid #147577; }
  body.local-editing [data-local-edit-id]:focus { outline: 3px solid #f08b73;
    background: rgba(255,255,255,.92); color: #102f35; }
  @media (max-width: 620px) { #local-editor-bar { left: 10px; right: 10px; bottom: 10px;
    justify-content: center; } }
</style>
<div id="local-editor-bar" role="toolbar" aria-label="Local page editor"
  data-page-version="__LOCAL_EDITOR_PAGE_VERSION__"
  data-page-path="__LOCAL_EDITOR_PAGE_PATH__">
  <span id="local-editor-status">Local preview</span>
  <button type="button" data-action="edit">Edit text</button>
  <button type="button" data-action="save" hidden>Save changes</button>
  <button type="button" data-action="cancel" hidden>Cancel</button>
</div>
<script id="local-visual-editor-script">
(() => {
  const fields = [...document.querySelectorAll('[data-local-edit-id]')];
  const bar = document.querySelector('#local-editor-bar');
  const status = document.querySelector('#local-editor-status');
  const editButton = bar.querySelector('[data-action="edit"]');
  const saveButton = bar.querySelector('[data-action="save"]');
  const cancelButton = bar.querySelector('[data-action="cancel"]');
  let editing = false;
  let originals = new Map();

  const cleanText = (value) => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const setStatus = (message) => { status.textContent = message; };
  const setButtons = (isEditing) => {
    editButton.hidden = isEditing;
    saveButton.hidden = !isEditing;
    cancelButton.hidden = !isEditing;
  };

  function startEditing() {
    editing = true;
    originals = new Map(fields.map((field) => [field.dataset.localEditId, {
      html: field.innerHTML, text: cleanText(field.innerText)
    }]));
    document.body.classList.add('local-editing');
    fields.forEach((field) => field.setAttribute('contenteditable', 'plaintext-only'));
    setButtons(true);
    setStatus('Click any outlined heading or paragraph');
  }

  function finishEditing() {
    editing = false;
    document.body.classList.remove('local-editing');
    fields.forEach((field) => field.removeAttribute('contenteditable'));
    setButtons(false);
  }

  function cancelEditing() {
    fields.forEach((field) => {
      const original = originals.get(field.dataset.localEditId);
      if (original) field.innerHTML = original.html;
    });
    finishEditing();
    setStatus('Changes cancelled');
  }

  async function saveEditing() {
    const changes = fields.map((field) => {
      const original = originals.get(field.dataset.localEditId);
      return { id: field.dataset.localEditId, originalText: original.text,
        text: cleanText(field.innerText) };
    }).filter((change) => change.text !== change.originalText);

    if (!changes.length) {
      finishEditing();
      setStatus('No changes to save');
      return;
    }
    if (changes.some((change) => !change.text)) {
      setStatus('Headings and paragraphs cannot be left empty');
      return;
    }

    saveButton.disabled = true;
    setStatus('Saving…');
    try {
      const response = await fetch('/__local_editor/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes,
          pageVersion: bar.dataset.pageVersion,
          pagePath: bar.dataset.pagePath
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save');
      finishEditing();
      setStatus(`${result.saved} change${result.saved === 1 ? '' : 's'} saved — refreshing preview…`);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setStatus(error.message);
    } finally {
      saveButton.disabled = false;
    }
  }

  editButton.addEventListener('click', startEditing);
  cancelButton.addEventListener('click', cancelEditing);
  saveButton.addEventListener('click', saveEditing);
  fields.forEach((field) => field.addEventListener('paste', (event) => {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
  }));
  window.addEventListener('beforeunload', (event) => {
    if (!editing) return;
    event.preventDefault();
    event.returnValue = '';
  });
  document.addEventListener('keydown', (event) => {
    if (!editing) return;
    if (event.key === 'Escape') cancelEditing();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault(); saveEditing();
    }
  });
})();
</script>
"""


def normalized_text(raw):
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()


def editable_matches(source):
    """Only expose plain-text headings/paragraphs; nested markup stays untouched."""
    return [match for match in ELEMENT_RE.finditer(source) if "<" not in match.group("content")]


def add_editor(source, page_path):
    matches = editable_matches(source)
    pieces = []
    cursor = 0
    for position, match in enumerate(matches):
        pieces.append(source[cursor:match.start()])
        opening = match.group(0)[:match.group(0).find(">")]
        pieces.append(opening + f' data-local-edit-id="{position}">' + match.group("content")
                      + f'</{match.group("tag")}>')
        cursor = match.end()
    pieces.append(source[cursor:])
    rendered = "".join(pieces)
    page_version = hashlib.sha256(source.encode("utf-8")).hexdigest()
    editor_assets = EDITOR_ASSETS.replace("__LOCAL_EDITOR_PAGE_VERSION__", page_version)
    editor_assets = editor_assets.replace("__LOCAL_EDITOR_PAGE_PATH__", page_path)
    return rendered.replace("</body>", editor_assets + "\n</body>", 1)


def canonical_page_path(request_path):
    path = urlparse(request_path).path
    if path in ("/", "/index.html"):
        return "/"
    if path in ("/about", "/about/", "/about/index.html"):
        return "/about/"
    return None


def apply_changes(source, changes, trust_positions=False):
    matches = editable_matches(source)
    replacements = []
    used_positions = set()
    used_starts = set()
    for change in changes:
        try:
            position = int(change["id"])
            new_text = re.sub(r"\s+", " ", str(change["text"])).strip()
            expected = str(change["originalText"])
        except (KeyError, TypeError, ValueError):
            raise ValueError("The editor sent an invalid change.")
        if position in used_positions or position < 0 or not new_text:
            raise ValueError("The editor sent an invalid change.")
        used_positions.add(position)
        match = matches[position] if position < len(matches) else None
        if match is None or (not trust_positions and normalized_text(match.group("content")) != expected):
            # A separate edit elsewhere can change which plain-text elements are
            # eligible and therefore shift their temporary browser positions.
            # Recover only when the original target is still uniquely identifiable.
            candidates = [
                candidate for candidate in matches
                if normalized_text(candidate.group("content")) == expected
                and candidate.start() not in used_starts
            ]
            if len(candidates) != 1:
                raise ValueError(
                    "This text changed outside the visual editor. Refresh the page and try again."
                )
            match = candidates[0]
        raw = match.group("content")
        leading = re.match(r"^\s*", raw).group(0)
        trailing = re.search(r"\s*$", raw).group(0)
        replacement = leading + html.escape(new_text, quote=False) + trailing
        if match.start() in used_starts:
            raise ValueError("The editor sent the same text area more than once.")
        used_starts.add(match.start())
        replacements.append((match.start("content"), match.end("content"), replacement))
    for start, end, replacement in sorted(replacements, reverse=True):
        source = source[:start] + replacement + source[end:]
    return source


class LocalEditorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _is_local(self):
        host = self.headers.get("Host", "").split(":", 1)[0].lower()
        return self.client_address[0] in ("127.0.0.1", "::1") and host in ("127.0.0.1", "localhost")

    def do_GET(self):
        page_path = canonical_page_path(self.path)
        if page_path:
            if not self._is_local():
                self.send_error(403, "This editor is available only on this computer.")
                return
            page_file = EDITABLE_PAGES[page_path]
            body = add_editor(
                page_file.read_text(encoding="utf-8"),
                page_path,
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/__local_editor/save" or not self._is_local():
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 100_000:
                raise ValueError("Invalid request size.")
            payload = json.loads(self.rfile.read(length))
            changes = payload.get("changes", [])
            page_version = payload.get("pageVersion", "")
            page_path = payload.get("pagePath", "")
            if not isinstance(changes, list) or not changes:
                raise ValueError("There are no changes to save.")
            if page_path not in EDITABLE_PAGES:
                raise ValueError("This page is not available in the visual editor.")
            page_file = EDITABLE_PAGES[page_path]
            source = page_file.read_text(encoding="utf-8")
            current_version = hashlib.sha256(source.encode("utf-8")).hexdigest()
            updated = apply_changes(
                source,
                changes,
                trust_positions=(page_version == current_version),
            )
            page_file.write_text(updated, encoding="utf-8")
            self._json(200, {"saved": len(changes)})
        except (ValueError, json.JSONDecodeError) as error:
            self._json(400, {"error": str(error)})

    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), LocalEditorHandler)
    print(f"Visual editor ready at http://localhost:{PORT}")
    print("Press Control-C to stop it.")
    threading.Timer(0.4, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nVisual editor stopped.")
