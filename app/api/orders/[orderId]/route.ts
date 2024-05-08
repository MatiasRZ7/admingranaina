import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";


// GET method to get the order details by the order ID
export const GET = async (
  req: NextRequest,
  { params }: { params: { orderId: String } }
) => {
  try {
    await connectToDB();
    // Get the order details by the order ID and populate the products
    const orderDetails = await Order.findById(params.orderId).populate({
      path: "products.product",
      model: Product,
    });

    if (!orderDetails) {
      return new NextResponse(JSON.stringify({ message: "Order not found" }), {
        status: 404,
      });
    }
    const customer = await Customer.findOne({
        clerkId: orderDetails.customerClerkId,
        });
        return NextResponse.json({ orderDetails, customer }, { status: 200 });
  } catch (err) {
    console.log("[orderId_GET]", err);
    return new NextResponse("An error occurred", { status: 500 });
  }
};
export const dynamic = "force-dynamic"