import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  let query = supabaseAdmin.from("product_history").select("*").order("created_at", { ascending: false });
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with product details (price, images, category) — works even for deleted products via a separate lookup
  const productIds = [...new Set(data.map((h: any) => h.product_id))];
  const { data: products } = await supabaseAdmin.from("products").select("id, price, images, category, unit").in("id", productIds);
  const productMap: any = {};
  (products || []).forEach((p: any) => { productMap[p.id] = p; });

  return NextResponse.json(data.map((h: any) => ({
    ...h,
    product: productMap[h.product_id] || null,
  })));
}
