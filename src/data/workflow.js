export const workflowMedia = '/assets/workflow/';

export const chapters = [
  { id: 'stock', time: 5, title: 'Add stock', detail: 'Create a product, enter the quantity and choose its storage location. Find it later by name, SKU or barcode.' },
  { id: 'record-sale', time: 14, title: 'Record an online sale', detail: 'For a sale made elsewhere, find the item in Remove Stock and enter its sale price.' },
  { id: 'till', time: 29, title: 'Sell at the till', detail: 'Scan an item, then record cash or confirm payment on your existing card terminal.' },
  { id: 'storefront', time: 45, title: 'Set up a Mi Marché shop', detail: 'Connect stock, preview the storefront and try a seller test purchase. Public checkout is currently closed.' },
  { id: 'dispatch', time: 61, title: 'Import, crop and print labels', detail: 'Forward supported label emails to your workspace, review the crop and print from the packing queue.' },
  { id: 'reordering', time: 88, title: 'Reorder and receive stock', detail: 'Set a minimum and a target quantity. Mark the order received and put the new units away.' },
  { id: 'receipts', time: 106, title: 'Upload receipts and invoices', detail: 'Attach a receipt to an expense or review scanned details in the Invoice Inbox before saving.' },
  { id: 'production', time: 124, title: 'Make finished stock', detail: 'Use recipes and material batches to plan production and add finished goods.' },
];

export const screenCaptures = {
  resellers: [
    { file: 'stock-overview', title: 'Workspace overview', alt: 'InventoryOS overview with active products, stock locations and sales totals.' },
    { file: 'dispatch-centre', title: 'Dispatch Centre', alt: 'Dispatch Centre with label file import, email import and the packing queue.' },
    { file: 'invoice-inbox', title: 'Invoice Inbox', alt: 'Expenses screen showing a sample invoice ready to review in the Invoice Inbox.' },
  ],
  manufacturing: [
    { file: 'materials', title: 'Materials & packaging', alt: 'Production workspace showing soy wax, cotton wicks and amber jars with their available quantities.' },
    { file: 'recipes', title: 'Recipes', alt: 'Product recipe listing the wax, wick and jar needed to make one cedar candle.' },
    { file: 'production', title: 'Finish & store', alt: 'Production screen showing a completed batch of 12 cedar candles stored on Shelf A1.' },
  ],
  retail: [
    { file: 'sales-till', title: 'Till basket', alt: 'InventoryOS till showing a scanned sample product, basket total and Cash and Card buttons.' },
    { file: 'sale-receipt', title: 'Till receipt', alt: 'InventoryOS till showing a completed sample sale and its receipt.' },
    { file: 'reorder', title: 'Reordering', alt: 'Reordering screen with an ordered item and its quantity and cost.' },
  ],
};

export const workflowMap = [
  { title: 'Add and organise stock', steps: ['stock'] },
  { title: 'Record the sale', steps: ['record-sale', 'till', 'storefront'] },
  { title: 'Pack and dispatch', steps: ['dispatch'] },
  { title: 'Restock and track costs', steps: ['reordering', 'receipts'] },
];
