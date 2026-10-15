import { redirect } from "next/navigation";

import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { deleteAddressAction, saveAddressAction } from "@/features/account/actions";
import { addressService } from "@/lib/api/addresses";
import { getSessionUser } from "@/lib/session";

export default async function AccountAddressesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const addresses = await addressService.list(user.id);
  return (
    <>
      <h1 className="customer-dashboard-title mb-8">Addresses</h1>
      <ul className="mb-10 space-y-4">
        {addresses.length === 0 ? <p className="text-sm text-text-sub">No saved addresses yet.</p> : null}
        {addresses.map((item) => (
          <li key={item.id} className="customer-order-card">
            <p className="customer-order-card-id">{item.label}</p>
            <p className="text-sm">
              {item.full_name}, {item.address}, {item.city} {item.postal_code}
            </p>
            <p className="text-sm text-text-sub">{item.phone}</p>
            {item.is_default ? <p className="mt-2 text-xs uppercase tracking-[0.14em]">Default</p> : null}
            <form action={deleteAddressAction} className="mt-3">
              <input type="hidden" name="id" value={item.id} />
              <ConfirmSubmit className="cart-item-link" message="Remove this address?" label="Remove" />
            </form>
          </li>
        ))}
      </ul>
      <form action={saveAddressAction} className="checkout-form max-w-md space-y-4">
        <h2 className="text-sm tracking-[0.18em] uppercase">Add address</h2>
        <input name="label" placeholder="Label" defaultValue="Home" className="auth-input" />
        <input name="fullName" required placeholder="Full name" defaultValue={user.name} className="auth-input" />
        <input name="phone" required placeholder="Phone" className="auth-input" />
        <input name="address" required placeholder="Address" className="auth-input" />
        <input name="city" required placeholder="City" className="auth-input" />
        <input name="postalCode" required placeholder="Postal code" className="auth-input" />
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="isDefault" defaultChecked={addresses.length === 0} />
          Default address
        </label>
        <button type="submit" className="luxury-button-solid">
          Save address
        </button>
      </form>
    </>
  );
}
