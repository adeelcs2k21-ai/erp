# ERP Application - Next.js

A comprehensive ERP system built with Next.js, Supabase, and Mantine UI.

## Features

- 🔐 User Authentication & Role-based Access Control
- 📊 Dashboard & Analytics
- 👥 CRM - Customer Relationship Management
- 📦 Inventory Management
- 💰 Finance Module
- 🛒 Purchase Orders
- 🏭 Manufacturing
- 📝 Documentation
- 🌐 Website Management
- 👔 HR Management

## Tech Stack

- **Framework**: Next.js 16.2.1 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI Library**: Mantine 8.3
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **PDF Generation**: jsPDF
- **Authentication**: Custom with Supabase

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set Up Database
Run the SQL scripts in your Supabase SQL Editor:
1. `supabase-schema.sql` - Creates all tables
2. `database-updates.sql` - Adds additional columns

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Login
Default credentials:
- **Superadmin**: `superadmin` / `superadmin123`
- **Admin**: `admin` / `admin123`

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Deploy Steps:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Project Structure

```
erp-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin module
│   ├── bom/               # Bill of Materials
│   ├── crm/               # CRM module
│   ├── dashboard/         # Dashboard
│   ├── finance/           # Finance module
│   ├── inventory/         # Inventory management
│   ├── purchase/          # Purchase orders
│   └── ...
├── components/            # Reusable components
├── lib/                   # Utility functions
├── data/                  # JSON data files
├── public/               # Static assets
└── ...
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Modules

### CRM
- Client management
- Order tracking
- Payment workflow
- Order fulfillment

### Inventory
- Product management
- Stock tracking
- Product history
- Receiving records

### Finance
- Client orders
- Payment confirmation
- Invoice generation

### Purchase
- Purchase orders
- Supplier management
- BOM (Bill of Materials)
- Quote management

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `users` - User accounts and roles
- `crm_orders` - Customer orders
- `products` - Product catalog
- `product_history` - Product change history
- `clients` - Customer information
- `suppliers` - Supplier information
- `purchase_orders` - Purchase orders
- `notifications` - System notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
