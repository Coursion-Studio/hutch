// Licence key delivery — the success page and the "email it to me again" form.
//
// Both talk to the Hutch licensing API on polaris-backend. There is no build
// step for this site, so the base URL lives here as one constant.

// Dev while nothing is for sale. Switch to the production service the same
// day the checkout goes live — a real buyer landing here against dev would be
// told their purchase is "still processing" forever, because the purchase
// happened in a database this URL never reads.
//
//   prod: https://polaris-backend-gnavb7tkza-ew.a.run.app/api/v1/hutch
const API_BASE = 'https://polaris-backend-dev-gnavb7tkza-ew.a.run.app/api/v1/hutch';

// Paddle's redirect can beat its own webhook, so the first claim often comes
// back "not ready". Poll for about half a minute before giving up — long
// enough for a slow webhook, short enough that nobody sits watching a spinner.
const CLAIM_ATTEMPTS = 12;
const CLAIM_INTERVAL_MS = 2500;

async function postJSON(path, body) {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    // A body we can't read is still a status we can act on.
  }
  return { status: response.status, payload };
}

// ─── Success page ──────────────────────────────────────────────────────────

// The page shows one of four outcomes at a time. Driving them off a single
// attribute is what stops it contradicting itself — it used to carry a static
// "your licence key is below" above a paragraph explaining there was no key.
function show(state) {
  document.getElementById('claim')?.setAttribute('data-state', state);
}

function fail(title, note) {
  const heading = document.getElementById('error-title');
  const body = document.getElementById('error-note');
  if (heading) heading.textContent = title;
  if (body) body.textContent = note;
  show('error');
}

async function claimLicence() {
  const page = document.getElementById('claim');
  if (!page) return;

  const working = document.getElementById('working-note');
  const keyField = document.getElementById('claim-key');
  const transactionId = new URLSearchParams(window.location.search).get('_ptxn');

  // The transaction id is a credential of sorts: it's what proves the purchase
  // to the claim endpoint. Take it out of the URL so it doesn't sit in the
  // address bar, browser history, or a Referer header on the next click.
  if (transactionId) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (!transactionId) {
    show('missing');
    return;
  }

  for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt += 1) {
    const { status: code, payload } = await postJSON('license/claim', { transactionId });

    if (code === 200 && payload.key) {
      keyField.value = payload.key;
      show('ready');
      // Grow to the key rather than clipping it. Keys are long enough to wrap
      // to four lines on a narrow window and a scrollbar on the one string the
      // page exists to hand over reads as broken.
      keyField.style.height = 'auto';
      keyField.style.height = `${keyField.scrollHeight}px`;
      return;
    }

    if (code === 403) {
      fail(
        'This licence has been revoked',
        'If that is a surprise, get in touch and we will sort it out.',
      );
      return;
    }

    if (code !== 202) {
      fail(
        'We could not fetch your key',
        'It is also on its way by email. You can request it again below.',
      );
      return;
    }

    // 202 is the normal case for the first second or two: Paddle's redirect
    // regularly beats its own webhook. Say what is happening rather than
    // leaving the buyer to guess whether their money went somewhere.
    if (working && attempt === 1) {
      working.textContent = 'Still preparing your key. This can take a few more seconds.';
    }
    await new Promise((resolve) => setTimeout(resolve, CLAIM_INTERVAL_MS));
  }

  fail(
    'Your key is taking longer than usual',
    'It will arrive by email shortly. You can also request it again below.',
  );
}

function wireCopyButton() {
  const button = document.getElementById('claim-copy');
  const keyField = document.getElementById('claim-key');
  if (!button || !keyField) return;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(keyField.value);
    } catch (error) {
      keyField.select();
      document.execCommand('copy');
    }
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1600);
  });
}

// ─── Resend form ───────────────────────────────────────────────────────────

function wireResendForm() {
  const form = document.getElementById('resend-form');
  if (!form) return;
  const status = document.getElementById('resend-status');
  const button = form.querySelector('button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector('input[type="email"]').value.trim();
    if (!email) return;

    button.disabled = true;
    status.hidden = false;
    status.textContent = 'Sending…';

    const { status: code } = await postJSON('license/resend', { email });

    // The server answers the same way whether or not that address ever bought
    // anything — otherwise this form would be a way to ask "did this person
    // buy Hutch?". So the page says the same thing too.
    status.textContent =
      code === 429
        ? 'That is a lot of requests. Give it a minute and try again.'
        : 'If that address has a Hutch licence, the key is on its way. Check spam if it does not appear.';
    button.disabled = false;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireCopyButton();
  wireResendForm();
  claimLicence();
});
