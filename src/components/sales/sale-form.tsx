"use client";

import { Button } from "@/components/ui/button";
import SaleProductPicker from "@/components/sales/sale-product-picker";
import SaleProfitBreakdown from "@/components/sales/sale-profit-breakdown";
import SaleSelectedProduct from "@/components/sales/sale-selected-product";
import { useSaleForm } from "@/hooks/use-sale-form";

interface Props {
  onClose: () => void;
}

export default function SaleForm({ onClose }: Props) {
  const {
    search,
    selected,
    quantity,
    saving,
    filtered,
    total,
    totalCost,
    totalProfit,
    unitProfit,
    setSearch,
    setSelected,
    setQuantity,
    submitSale,
  } = useSaleForm(onClose);

  return (
    <div className="space-y-4">
      {!selected ? (
        <SaleProductPicker
          products={filtered}
          search={search}
          onSearchChange={setSearch}
          onSelect={setSelected}
        />
      ) : (
        <>
          <SaleSelectedProduct
            product={selected}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onChangeProduct={() => setSelected(null)}
          />

          <SaleProfitBreakdown
            total={total}
            totalCost={totalCost}
            unitProfit={unitProfit}
            totalProfit={totalProfit}
          />

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={submitSale} disabled={saving} className="flex-1">
              {saving ? "Registrando..." : "Registrar Venta"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
