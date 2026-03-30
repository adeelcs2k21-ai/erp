import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function logHistory(entry: object) {
  await supabaseAdmin.from("product_history").insert({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    created_at: new Date().toISOString(),
    ...entry,
  });
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = Date.now().toString();
  const product = {
    id,
    name: body.name,
    description: body.description || "",
    specification: body.specification || "",
    category: body.category || "",
    price: body.price || 0,
    stock: body.stock || 0,
    unit: body.unit || "pieces",
    images: body.images || [],
    created_by: body.createdBy || "unknown",
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("products").insert(product).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logHistory({
    product_id: id,
    product_name: body.name,
    action: "added",
    quantity_change: body.stock || 0,
    stock_before: 0,
    stock_after: body.stock || 0,
    note: `Product added with initial stock of ${body.stock || 0} ${body.unit || "pieces"}`,
    created_by: body.createdBy || "unknown",
    snapshot_image: (body.images || [])[0] || null,
    snapshot_price: body.price || 0,
    snapshot_unit: body.unit || "pieces",
  });

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data: current } = await supabaseAdmin.from("products").select("price, unit, images, stock").eq("id", body.id).single();

  // Stock adjustment
  if (body.action === 'adjust_stock') {
    const stockBefore = current?.stock || 0;
    const stockAfter = stockBefore + body.adjustment;
    const { data, error } = await supabaseAdmin.from("products").update({ stock: stockAfter }).eq("id", body.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logHistory({
      product_id: body.id,
      product_name: body.productName,
      action: body.adjustment > 0 ? "stock_in" : "stock_out",
      quantity_change: Math.abs(body.adjustment),
      stock_before: stockBefore,
      stock_after: stockAfter,
      note: body.note || "",
      created_by: body.updatedBy || "unknown",
      snapshot_image: current?.images?.[0] || null,
      snapshot_price: current?.price || 0,
      snapshot_unit: current?.unit || "pieces",
    });
    return NextResponse.json(data);
  }

  // Price update
  if (body.action === 'update_price') {
    const { data, error } = await supabaseAdmin.from("products").update({ price: body.price }).eq("id", body.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logHistory({
      product_id: body.id,
      product_name: body.productName,
      action: "price_updated",
      quantity_change: 0,
      stock_before: current?.stock ?? null,
      stock_after: current?.stock ?? null,
      note: `Price changed from PKR ${current?.price} to PKR ${body.price}`,
      created_by: body.updatedBy || "unknown",
      snapshot_image: current?.images?.[0] || null,
      snapshot_price: body.price,
      snapshot_unit: current?.unit || "pieces",
    });
    return NextResponse.json(data);
  }

  // Default: edit name/description/specification/category/images
  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ name: body.name, description: body.description, specification: body.specification, category: body.category, images: body.images || [] })
    .eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logHistory({
    product_id: body.id,
    product_name: body.name,
    action: "edited",
    quantity_change: 0,
    stock_before: current?.stock ?? null,
    stock_after: current?.stock ?? null,
    note: `Product details updated by ${body.updatedBy || "unknown"}`,
    created_by: body.updatedBy || "unknown",
    snapshot_image: (body.images || [])[0] || current?.images?.[0] || null,
    snapshot_price: current?.price || 0,
    snapshot_unit: current?.unit || "pieces",
  });

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id, deletedBy } = await request.json();
  const { data: product } = await supabaseAdmin.from("products").select("*").eq("id", id).single();

  await logHistory({
    product_id: id,
    product_name: product?.name || "Unknown",
    action: "deleted",
    quantity_change: product?.stock || 0,
    stock_before: product?.stock || 0,
    stock_after: 0,
    note: `Product "${product?.name}" deleted. Had ${product?.stock} ${product?.unit} in stock.`,
    created_by: deletedBy || "unknown",
    snapshot_image: (product?.images || [])[0] || null,
    snapshot_price: product?.price || 0,
    snapshot_unit: product?.unit || "pieces",
  });

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
