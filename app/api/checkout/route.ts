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
    // first we get the cart items and the customer data from the request body
    const { cartItems, customer } = await req.json();
    if (!cartItems || !customer) {
      return new NextResponse("Cart items and customer data are required", {
        status: 400,
      });
    }
    // then we create a new checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "DE", "GB", "FR", "IT", "ES"],
      },
      shipping_options: [
        { shipping_rate: "shr_1PCElBRv5nV0ahQXA23Gv823" },
      ],
      // information about the customer who is checking out
      line_items: cartItems.map((cartItem: any) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: cartItem.item.title,
            // metadata if we want to store additional information
            metadata: {
              productId: cartItem.item._id,
              ...(cartItem.size && { size: cartItem.size }),
              ...(cartItem.color && { color: cartItem.color }),
              dateAdded: (typeof cartItem.dateAdded === 'string' && !isNaN(Date.parse(cartItem.dateAdded))) ? cartItem.dateAdded : undefined,
            },
          },
          // calculate 10% of the item price and convert it to cents
          unit_amount: Math.round(cartItem.item.price * 10),
        },
        quantity: cartItem.quantity,
      })),
      // reference to the customer
      client_reference_id: customer.clerkId,
      // success and cancel URLs when the payment is successful or canceled
      success_url: `${process.env.ECOMMERCE_STORE_URL}/payment_success`,
      cancel_url: `${process.env.ECOMMERCE_STORE_URL}/cart`,
    });
    // return the session to the client to redirect to the checkout page
    return NextResponse.json(session, { headers: corsHeaders });
  } catch (err) {
    console.log("[checkout_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500, headers: corsHeaders});
  }
}
