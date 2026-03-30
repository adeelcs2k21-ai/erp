# ERP Application

This is a comprehensive ERP (Enterprise Resource Planning) application built with [Next.js](https://nextjs.org) that manages suppliers, BOMs (Bill of Materials), quotes, and procurement processes.

## Features

### Supplier Management
- **Enhanced Supplier Dashboard**: View all suppliers with comprehensive BOM and quote statistics
- **BOM Tracking**: Track BOMs sent to suppliers with status monitoring
- **Quote Management**: Suppliers can submit detailed quotes for BOMs with item-level pricing
- **Response Rate Analytics**: Monitor supplier responsiveness and quote submission rates

### BOM & Quote System
- **BOM Distribution**: Send BOMs to multiple suppliers for competitive quoting
- **Interactive Quote Submission**: Suppliers can add quotes with:
  - Item-level pricing and lead times
  - Quote validity periods
  - Additional notes and specifications
- **Quote Comparison**: Side-by-side comparison of supplier quotes with:
  - Price analysis (lowest, highest, average)
  - Item-level breakdowns
  - Lead time comparisons
  - Visual indicators for best prices

### Key Pages
- `/suppliers` - Enhanced supplier management with BOM/quote overview
- `/supplier/dashboard` - Supplier portal for viewing BOMs and submitting quotes
- `/bom` - BOM creation and management
- `/admin` - Administrative functions

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
erp-app/
├── app/                    # Next.js app directory
│   ├── suppliers/         # Supplier management pages
│   ├── supplier/          # Supplier portal
│   ├── bom/              # BOM management
│   ├── api/              # API routes
│   └── ...
├── components/           # Reusable React components
├── lib/                 # Utility libraries and database functions
├── data/               # JSON data files
│   ├── suppliers.json
│   ├── bom_sends.json
│   ├── bom_rates.json
│   └── ...
└── ...
```

## Recent Enhancements

### Supplier Page Improvements
- **Visual Statistics Dashboard**: Overview cards showing total suppliers, BOMs sent, quotes received, and response rates
- **Enhanced Table View**: Improved supplier table with:
  - Contact information grouping
  - BOM and quote count badges
  - Response rate indicators with color coding
  - Action buttons for viewing BOMs and adding quotes

### BOM Quote Comparison
- **Advanced Comparison Modal**: Select any BOM to compare quotes from multiple suppliers
- **Price Analysis**: Automatic calculation of lowest, highest, and average quotes
- **Visual Indicators**: Best price highlighting and quote status badges
- **Detailed Breakdowns**: Item-level pricing and lead time information

### Quote Submission System
- **Interactive Forms**: Suppliers can submit detailed quotes with:
  - Per-item pricing and lead times
  - Quote validity dates
  - Additional notes and specifications
- **Real-time Calculations**: Automatic total calculation as items are priced
- **Status Tracking**: Visual indicators for quote submission status

### User Experience
- **Toast Notifications**: Success/error feedback for quote submissions
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Proper loading indicators throughout the application

## API Endpoints

- `GET/POST /api/suppliers` - Supplier CRUD operations
- `GET/POST /api/supplier/boms` - BOM retrieval for suppliers
- `GET/POST /api/supplier/quotes` - Quote submission and retrieval
- `GET/POST /api/bom-sends` - BOM distribution tracking
- `GET/POST /api/bom-rates` - BOM rate management

## Data Models

### Supplier
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt?: string;
}
```

### BOM Send
```typescript
{
  id: string;
  bomId: string;
  bomNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  sentAt: string;
  items: BOMItem[];
}
```

### Supplier Quote
```typescript
{
  id: string;
  bomSendId: string;
  supplierId: string;
  supplierName: string;
  bomNumber: string;
  items: QuoteItem[];
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  submittedAt: string;
  status: string;
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
