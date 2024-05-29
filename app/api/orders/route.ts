import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";


// GET method to get all orders
export const GET = async (req: NextRequest) => {
  try {
    await connectToDB();
    const orders = await Order.find().sort({ createdAt: "desc" });
    // Get the customer information for each order
    const ordersDetails = await Promise.all(orders.map( async(order) => {
        const customer = await Customer.findOne({ clerkId: order.customerClerkId });
        // info to create the response
        return {
            _id: order._id,
            customer: customer.name,
            products: order.products.length,
            totalAmount: order.totalAmount,
            createdAt: format(order.createdAt, "MMM dd, yyyy"),
            dateAdded: format(order.dateAdded, "MMM dd, yyyy"),
        }
    }));

    return NextResponse.json(ordersDetails, { status: 200 });
  } catch (err) {
    console.log("[orders_GET]", err);
    return new NextResponse("An error occurred", { status: 500 });
  }
};

export const dynamic = "force-dynamic";
