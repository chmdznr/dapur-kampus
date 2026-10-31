<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All price math lives in src/lib/pricing.ts as pure functions; UI and server functions only call them (single source of truth, tested in pricing.test.ts).
- Anonymous order creation and status lookup go through server functions in src/lib/orders.functions.ts (prices recomputed server-side); anon has no direct access to the orders table.
- Order status transitions are enforced by a DB trigger; the first registered user is auto-granted admin via user_roles.
- Online payment uses Shopify Storefront cart checkout (src/lib/shopify.ts); Shopify products are matched to menus by exact name, so keep names identical in both places.
