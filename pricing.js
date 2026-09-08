// Localized prices on the pricing page.
//
// Paddle.js PricePreview asks Paddle what this visitor would actually pay —
// their currency, their tax. Someone in Berlin sees €, not a dollar figure
// they have to mentally convert and then get surprised by at checkout.
//
// Configuration lives on <body> as data- attributes, the same as buy.js, so
// the sandbox and live pages can't share a token or a price id by accident.

// The page ships with the USD figures already in the markup. If Paddle.js is
// blocked — ad blockers take it often, and content blockers are near-universal
// among the people who buy Mac utilities — the page still reads correctly and
// just isn't localized. A pricing page showing a spinner where the price goes
// is worse than one showing the wrong currency.
async function localizePrices() {
  const data = document.body.dataset;
  if (typeof Paddle === 'undefined' || !data.paddleToken) return;

  if (data.paddleEnv === 'sandbox') Paddle.Environment.set('sandbox');
  Paddle.Initialize({ token: data.paddleToken });

  const items = [
    { priceId: data.priceLicence, quantity: 1 },
    { priceId: data.priceSeat, quantity: 1 },
  ].filter((item) => item.priceId);
  if (!items.length) return;

  let preview;
  try {
    preview = await Paddle.PricePreview({ items });
  } catch (error) {
    return; // Keep the markup's USD figures.
  }

  const byPrice = new Map(
    (preview?.data?.details?.lineItems ?? []).map((line) => [line.price.id, line]),
  );

  for (const element of document.querySelectorAll('[data-price-for]')) {
    const line = byPrice.get(element.dataset.priceFor);
    // `total` rather than `subtotal`: these prices are tax-exclusive, so the
    // subtotal is not what anyone is charged. Quoting it would understate the
    // price to every customer in a country that adds VAT at checkout.
    const formatted = line?.formattedTotals?.total;
    if (formatted) element.textContent = formatted;
  }

  const note = document.getElementById('tax-note');
  if (note && byPrice.size) note.hidden = false;
}

document.addEventListener('DOMContentLoaded', localizePrices);
