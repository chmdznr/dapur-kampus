// Pembayaran online lewat Shopify (Storefront API). Produk Shopify dicocokkan dengan menu berdasarkan nama persis.
const SHOPIFY_API_VERSION = "2026-10";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "dapur-kampus-delivery-0uz0s-rqcdh5rc.myshopify.com";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = "ef6c406cf7e24be22925b8686b2c50d8";

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (response.status === 402) {
    throw new Error("Toko Shopify perlu paket berbayar aktif untuk menerima pembayaran.");
  }
  if (!response.ok) throw new Error(`Shopify error ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(data.errors.map((e: { message: string }) => e.message).join(", "));
  return data;
}

const PRODUCTS_QUERY = `
  query { products(first: 100) { edges { node { title variants(first: 1) { edges { node { id availableForSale } } } } } } }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

/** Buat keranjang Shopify untuk satu pesanan dan kembalikan URL pembayaran. */
export async function createCheckoutForOrder(args: {
  menuName: string;
  quantity: number;
  promoCode: string;
  orderCode: string;
}): Promise<string> {
  const products = await storefrontApiRequest(PRODUCTS_QUERY);
  type Edge = { node: { title: string; variants: { edges: { node: { id: string; availableForSale: boolean } }[] } } };
  const match = (products.data.products.edges as Edge[]).find((e) => e.node.title === args.menuName);
  const variant = match?.node.variants.edges[0]?.node;
  if (!variant || !variant.availableForSale) throw new Error("Menu ini belum bisa dibayar online");

  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: {
      lines: [{ quantity: args.quantity, merchandiseId: variant.id }],
      discountCodes: args.promoCode ? [args.promoCode] : [],
      attributes: [{ key: "Kode order", value: args.orderCode }],
      note: `Kode order DapurKampus: ${args.orderCode}`,
    },
  });
  const errs = data.data.cartCreate.userErrors;
  if (errs.length > 0) throw new Error(errs[0].message);
  return formatCheckoutUrl(data.data.cartCreate.cart.checkoutUrl);
}
