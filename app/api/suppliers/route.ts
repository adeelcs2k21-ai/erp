import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("suppliers").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newSupplier = {
    id: Date.now().toString(),
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address || null,
    contact_person: body.contactPerson || body.contact_person || null,
    business_type: body.businessType || body.business_type || null,
    image_url: body.imageUrl || body.image_url || null,
    
    // Additional Contact Details
    alternate_phone: body.alternatePhone || body.alternate_phone || null,
    whatsapp_number: body.whatsappNumber || body.whatsapp_number || null,
    website: body.website || null,
    contact_person_designation: body.contactPersonDesignation || body.contact_person_designation || null,
    
    // Business & Legal Info
    company_registration_number: body.companyRegistrationNumber || body.company_registration_number || null,
    ntn: body.ntn || null,
    strn: body.strn || null,
    license_number: body.licenseNumber || body.license_number || null,
    
    // Financial Details
    bank_name: body.bankName || body.bank_name || null,
    bank_account_number: body.bankAccountNumber || body.bank_account_number || null,
    iban: body.iban || null,
    payment_terms: body.paymentTerms || body.payment_terms || null,
    credit_limit: body.creditLimit || body.credit_limit || null,
    currency: body.currency || 'PKR',
    
    // Supply Capabilities
    materials_supplied: body.materialsSupplied || body.materials_supplied || null,
    minimum_order_quantity: body.minimumOrderQuantity || body.minimum_order_quantity || null,
    lead_time: body.leadTime || body.lead_time || null,
    delivery_areas: body.deliveryAreas || body.delivery_areas || null,
    
    // Logistics Info
    delivery_method: body.deliveryMethod || body.delivery_method || null,
    transport_charges_policy: body.transportChargesPolicy || body.transport_charges_policy || null,
    warehouse_location: body.warehouseLocation || body.warehouse_location || null,
    
    // Performance & Internal Use
    supplier_rating: body.supplierRating || body.supplier_rating || null,
    reliability_score: body.reliabilityScore || body.reliability_score || null,
    notes: body.notes || null,
    status: body.status || 'Active',
    
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("suppliers").insert(newSupplier).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const updatedSupplier = {
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address || null,
    contact_person: body.contactPerson || body.contact_person || null,
    business_type: body.businessType || body.business_type || null,
    image_url: body.imageUrl || body.image_url || null,
    
    // Additional Contact Details
    alternate_phone: body.alternatePhone || body.alternate_phone || null,
    whatsapp_number: body.whatsappNumber || body.whatsapp_number || null,
    website: body.website || null,
    contact_person_designation: body.contactPersonDesignation || body.contact_person_designation || null,
    
    // Business & Legal Info
    company_registration_number: body.companyRegistrationNumber || body.company_registration_number || null,
    ntn: body.ntn || null,
    strn: body.strn || null,
    license_number: body.licenseNumber || body.license_number || null,
    
    // Financial Details
    bank_name: body.bankName || body.bank_name || null,
    bank_account_number: body.bankAccountNumber || body.bank_account_number || null,
    iban: body.iban || null,
    payment_terms: body.paymentTerms || body.payment_terms || null,
    credit_limit: body.creditLimit || body.credit_limit || null,
    currency: body.currency || 'PKR',
    
    // Supply Capabilities
    materials_supplied: body.materialsSupplied || body.materials_supplied || null,
    minimum_order_quantity: body.minimumOrderQuantity || body.minimum_order_quantity || null,
    lead_time: body.leadTime || body.lead_time || null,
    delivery_areas: body.deliveryAreas || body.delivery_areas || null,
    
    // Logistics Info
    delivery_method: body.deliveryMethod || body.delivery_method || null,
    transport_charges_policy: body.transportChargesPolicy || body.transport_charges_policy || null,
    warehouse_location: body.warehouseLocation || body.warehouse_location || null,
    
    // Performance & Internal Use
    supplier_rating: body.supplierRating || body.supplier_rating || null,
    reliability_score: body.reliabilityScore || body.reliability_score || null,
    notes: body.notes || null,
    status: body.status || 'Active',
    
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .update(updatedSupplier)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("suppliers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
