// Opens the Paddle checkout for a buy page.
//
// Paddle Billing has no hosted checkout page of its own — the checkout is an
// overlay drawn by Paddle.js on a domain Paddle has approved. So "the checkout
// link" the app opens is a page here, and this script is what makes it a
// checkout rather than a dead end.
//
// Nothing is configured in this file. Each buy page carries its own
// environment, client-side token and price ids as data- attributes on <body>,
// which is what keeps the sandbox page and the live page from ever sharing a
// value by accident. The client-side token is public by design: it can open a
// checkout and do nothing else.

const ITEMS = {
  licence: { price: 'priceLicence', quantity: 1 },
  seat: { price: 'priceSeat', quantity: null },
};

const MAX_SEATS = 8;

function config() {
  const data = document.body.dataset;
  return {
    environment: data.paddleEnv,
    token: data.paddleToken,
    successUrl: data.successUrl,
    prices: { priceLicence: data.priceLicence, priceSeat: data.priceSeat },
  };
}

// `?item=seat&qty=3`. An unknown item is the licence: someone who followed a
// mangled link still wants to buy Hutch, and a checkout is a better answer
// than an error.
function requested() {
  const params = new URLSearchParams(window.location.search);
  const item = ITEMS[params.get('item')] ? params.get('item') : 'licence';
  const asked = parseInt(params.get('qty') || '1', 10);
  const quantity = Number.isFinite(asked) ? Math.min(Math.max(asked, 1), MAX_SEATS) : 1;
  return { item, quantity: ITEMS[item].quantity ?? quantity };
}

function fail(message) {
  const status = document.getElementById('buy-status');
  if (status) {
    status.hidden = false;
    status.textContent = message;
  }
}

function openCheckout() {
  const { prices, successUrl } = config();

  // Paddle's default payment link points here. When Paddle builds a link for
  // an existing transaction — an invoice, a shared payment link, a retried
  // payment — it appends `_ptxn` and expects this page to open *that*
  // transaction rather than starting a fresh one. Opening by price instead
  // would bill a second time for something already invoiced.
  const transactionId = new URLSearchParams(window.location.search).get('_ptxn');
  if (transactionId) {
    Paddle.Checkout.open({ transactionId, settings: { displayMode: 'overlay', theme: 'dark' } });
    return;
  }

  const { item, quantity } = requested();
  const priceId = prices[ITEMS[item].price];

  if (!priceId) {
    fail('This page is missing its price. Email us and we will take the payment by hand.');
    return;
  }

  Paddle.Checkout.open({
    items: [{ priceId, quantity }],
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      // Paddle appends `_ptxn` to this, which is what the thanks page trades
      // for the licence key. Without it the buyer waits on the email alone.
      successUrl,
    },
  });
}

function start() {
  const { environment, token } = config();

  if (typeof Paddle === 'undefined' || !token) {
    fail('The checkout could not load. Try again, or email us and we will send a payment link.');
    return;
  }

  // Sandbox must be set before Initialize, or the token is checked against the
  // wrong Paddle and every checkout fails to open.
  if (environment === 'sandbox') Paddle.Environment.set('sandbox');
  Paddle.Initialize({ token });

  document.getElementById('buy-open')?.addEventListener('click', openCheckout);
  openCheckout();
}

document.addEventListener('DOMContentLoaded', start);
