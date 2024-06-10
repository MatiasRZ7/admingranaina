import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Define the CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS method for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST method to create a new checkout session
export async function POST(req: NextRequest) {
  try {
    // Get the cart items and the customer data from the request body
    const { cartItems, customer } = await req.json();
    console.log("[checkout_POST] Cart Items:", cartItems);
    if (!cartItems || !customer) {
      return new NextResponse("Cart items and customer data are required", {
        status: 400,
      });
    }
    cartItems.forEach((cartItem: any, index: number) => {
      console.log(`[checkout_POST] Cart Item ${index + 1} dateAdded:`, cartItem.dateAdded);
    });
    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "DE", "GB", "FR", "IT", "ES"],
      },
      shipping_options: [
      ],
      line_items: cartItems.map((cartItem: any) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: cartItem.item.title,
            metadata: {
              productId: cartItem.item._id,
              ...(cartItem.size && { size: cartItem.size }),
              ...(cartItem.color && { color: cartItem.color }),
              ...(cartItem.childrenQuantity && { childrenQuantity: cartItem.childrenQuantity }),
              ...(cartItem.hotelName && { hotelName: cartItem.hotelName }),
              ...(cartItem.pickupTime && { pickupTime: cartItem.pickupTime }),
              dateAdded: cartItem.dateAdded ? new Date(cartItem.dateAdded).toISOString() : new Date().toISOString(),
            },
          },
          unit_amount: Math.round(cartItem.item.price),
        },
        quantity: cartItem.quantity,
      })),
      client_reference_id: customer.clerkId,
      success_url: `${process.env.ECOMMERCE_STORE_URL}/payment_success`,
      cancel_url: `${process.env.ECOMMERCE_STORE_URL}/cart`,
    });
    console.log("[checkout_POST] Created Session:", session);

    return NextResponse.json(session, { headers: corsHeaders });
  } catch (err) {
    console.log("[checkout_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500, headers: corsHeaders });
  }
}