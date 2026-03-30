import { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-4 mt-4">
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-blue-600"
            >
              Overview
            </Link>
            <Link
              href="/admin/quotes"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-blue-600"
            >
              Supplier Quotes
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
