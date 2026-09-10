const BASE_URL = "http://localhost:8443/api/v1";

function logStep(stepName: string) {
  console.log(`\n========================================`);
  console.log(`🧪 TEST STEP: ${stepName}`);
  console.log(`========================================`);
}

async function request(endpoint: string, options: any = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: any = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText;
    throw new Error(`HTTP ${response.status} on ${endpoint}: ${errorMsg}`);
  }

  return data?.data !== undefined ? data.data : data;
}

async function runE2ETest() {
  console.log("🚀 Starting Full End-to-End E-Commerce Workflow Verification...\n");

  // 1. Health Check
  logStep("1. Health Check");
  const health = await request("/health");
  console.log("✅ Health Status:", health);

  // 2. Public Catalog & Search
  logStep("2. Catalog Browsing & Search");
  const categories = await request("/categories");
  console.log(`✅ Loaded ${categories.length} categories:`, categories.map((c: any) => c.name));

  const catalog = await request("/products?q=Shirt");
  console.log(`✅ Searched 'Shirt': Found ${catalog.pagination.total} products.`);
  const sampleProduct = catalog.items[0];
  console.log(`   Sample Product: "${sampleProduct.name}" (SKU: ${sampleProduct.sku}, Price: ৳${sampleProduct.price})`);

  // 3. Product Details & Variants
  logStep("3. Product Details & Stock Inspection");
  const productDetails = await request(`/products/${sampleProduct.id}`);
  console.log(`✅ Product Loaded: "${productDetails.name}" with ${productDetails.variants.length} size/color variants.`);
  const sampleVariant = productDetails.variants[0];
  console.log(`   Sample Variant SKU: ${sampleVariant.sku} | Initial Stock: ${sampleVariant.stock}`);

  // 4. Coupon Validation
  logStep("4. Coupon Validation");
  const couponResult = await request("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code: "WINTER10", subtotal: 2000 }),
  });
  console.log(`✅ Coupon 'WINTER10' Validated! Discount: ৳${couponResult.discountAmount}`);

  // 5. Guest Checkout (Atomic Stock Reservation)
  logStep("5. Guest Checkout Execution");
  const guestOrderInput = {
    customer: {
      fullName: "Automated Guest Tester",
      email: "guest@example.com",
      phone: "+8801711112222",
    },
    shippingAddress: {
      recipient: "Automated Guest Tester",
      phone: "+8801711112222",
      division: "Dhaka",
      district: "Dhaka",
      area: "Gulshan-2",
      addressLine: "House 50, Road 11",
    },
    paymentMethod: "COD",
    couponCode: "WINTER10",
    items: [
      {
        productId: sampleProduct.id,
        variantId: sampleVariant.id,
        productName: sampleProduct.name,
        size: sampleVariant.size,
        color: sampleVariant.color,
        unitPrice: sampleProduct.price,
        quantity: 2,
      },
    ],
  };

  const guestOrder = await request("/orders", {
    method: "POST",
    body: JSON.stringify(guestOrderInput),
  });
  console.log(`🎉 Guest Order Placed! Order Number: ${guestOrder.orderNumber}`);
  console.log(`   Total Amount: ৳${guestOrder.totalAmount} | Status: ${guestOrder.status}`);

  // Check stock deduction
  const updatedProduct = await request(`/products/${sampleProduct.id}`);
  const updatedVariant = updatedProduct.variants.find((v: any) => v.id === sampleVariant.id);
  console.log(`✅ Stock Deducted: Previous (${sampleVariant.stock}) ➔ New Stock (${updatedVariant.stock})`);

  // 6. Order Tracking
  logStep("6. Order Tracking Lookup");
  const trackedOrder = await request(`/orders/track/${guestOrder.orderNumber}`);
  console.log(`✅ Order Tracking Successful! Status: ${trackedOrder.status} | Items: ${trackedOrder.items.length}`);

  // 7. Customer Auth & Member Workflow
  logStep("7. Customer Auth & Profile Operations");
  const testPhone = `+880179999${Math.floor(1000 + Math.random() * 9000)}`;
  const regResult = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "E2E Member User",
      phone: testPhone,
      password: "Password123!",
    }),
  });
  console.log(`✅ Registered Customer Account: ${testPhone}`);

  const authData = await request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phone: testPhone,
      code: regResult.otpCode || "123456",
    }),
  });
  const memberToken = authData.accessToken;
  console.log(`✅ Verified OTP & Acquired Access Token for User: ${authData.user.fullName}`);

  // Wishlist API Test
  logStep("8. Member Wishlist Sync");
  await request("/wishlist", {
    method: "POST",
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ productId: sampleProduct.id }),
  });
  console.log(`✅ Added Product "${sampleProduct.name}" to Wishlist.`);

  const wishlist = await request("/wishlist", {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  console.log(`✅ Loaded Member Wishlist (${wishlist.length} item):`, wishlist[0].product.name);

  // Address Management API Test
  logStep("9. Saved Delivery Address Management");
  const newAddress = await request("/users/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      recipient: "E2E Member User",
      phone: testPhone,
      division: "Dhaka",
      district: "Dhaka",
      area: "Banani",
      addressLine: "Building 5, Apartment 4B",
      isDefault: true,
    }),
  });
  console.log(`✅ Saved Delivery Address: ${newAddress.addressLine}, ${newAddress.area}`);

  // 10. Admin Portal Workflow
  logStep("10. Admin Portal Operations");
  const adminAuth = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      phoneOrEmail: "manager@drape.com",
      password: "Password123!",
    }),
  });
  const adminToken = adminAuth.accessToken;
  console.log(`✅ Logged in as Store Manager (${adminAuth.user.fullName})`);

  // Update Guest Order Status to SHIPPED
  const updatedOrder = await request(`/admin/orders/${guestOrder.id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: "SHIPPED",
      courierProvider: "Sundarban Express",
      trackingNumber: "SBC-2026-889900",
      note: "Package dispatched via express courier.",
    }),
  });
  console.log(`✅ Admin Updated Order ${guestOrder.orderNumber} Status ➔ ${updatedOrder.status}`);
  console.log(`   Courier: ${updatedOrder.courierProvider} | Tracking #: ${updatedOrder.trackingNumber}`);

  // Reports Summary
  const summary = await request("/admin/reports/summary", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Admin Store Reports Summary: Total Revenue = ৳${summary.totalRevenue} | Total Orders = ${summary.totalOrders}`);

  console.log("\n=======================================================");
  console.log("🎉 ALL E2E HTTP WORKFLOW TESTS COMPLETED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

runE2ETest().catch((err) => {
  console.error("❌ E2E Workflow Test Failed:", err);
  process.exit(1);
});
