import React, { useState } from 'react';
import ProductGrid from '../components/pos/ProductGrid';
import CartPanel from '../components/pos/CartPanel';
import PaymentModal from '../components/pos/PaymentModal';
import HoldSaleModal from '../components/pos/HoldSaleModal';
import ThermalReceipt from '../components/pos/ThermalReceipt';
import BarcodeScannerListener from '../components/common/BarcodeScannerListener';

export default function POS() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const handleBarcodeScan = (barcode) => {
    setScannedBarcode(barcode);
  };

  const handleSaleComplete = (sale) => {
    setLastCompletedSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="flex-1 flex gap-4 h-[calc(100vh-6rem)] overflow-hidden">
      {/* Global USB Barcode Listener */}
      <BarcodeScannerListener onScan={handleBarcodeScan} />

      {/* Main Catalog & Search Section */}
      <ProductGrid barcodeScanQuery={scannedBarcode} />

      {/* Right Billing Cart Panel */}
      <CartPanel
        onOpenPayment={() => setIsPaymentOpen(true)}
        onOpenHoldModal={() => setIsHoldModalOpen(true)}
      />

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSaleComplete={handleSaleComplete}
      />

      <HoldSaleModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
      />

      <ThermalReceipt
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={lastCompletedSale}
      />
    </div>
  );
}
