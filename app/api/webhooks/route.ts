import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const POST = async (req: NextRequest) => {
  try {
    // Get the raw body of the request
    const rawBody = await req.text();
    // Get the Stripe-Signature header to validate the request
    const signature = req.headers.get("Stripe-Signature") as string;
    // Construct the event object from the raw body and the signature to validate it
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // Check the type of the event
    if (event.type === "checkout.session.completed") {
      // Get the session object from the event
      const session = event.data.object;
      console.log("[webhooks_POST] Session:", session);
      // Retrieve the session to get the line items
      const retrieveSession = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["line_items.data.price.product"],
        }
      );
      console.log("[webhooks_POST] Retrieved Session with Line Items:", retrieveSession);

      // Get the line items from the session
      const lineItems = retrieveSession?.line_items?.data;
      console.log("[webhooks_POST] Line Items:", lineItems);

      // Map the line items to get the product IDs
      const orderItems = lineItems
        ? lineItems.map((item: any) => {
            return {
              product: item.price.product.metadata.productId,
              color: item.price.product.metadata.color || "N/A",
              size: item.price.product.metadata.size || "N/A",
              childrenQuantity: item.price.product.metadata.childrenQuantity || "N/A",
              hotelName: item.price.product.metadata.hotelName || "N/A",
              pickupTime: item.price.product.metadata.pickupTime || "N/A",
              quantity: item.quantity,
              dateAdded: item.price.product.metadata.dateAdded,
            };
          })
        : [];

      console.log("[webhooks_POST] Order Items:", orderItems);

      // Rest of your code...
      // Get the customer information from the session object
      const customerInfo = {
        clerkId: session?.client_reference_id,
        name: session?.customer_details?.name,
        email: session?.customer_details?.email,
      };
      // Get the shipping address from the session object
      const shippingAddress = {
        street: session?.shipping_details?.address?.line1,
        city: session?.shipping_details?.address?.city,
        state: session?.shipping_details?.address?.state,
        postalCode: session?.shipping_details?.address?.postal_code,
        country: session?.shipping_details?.address?.country,
      };

      await connectToDB();

      // Create a new order with the customer clerk ID, products, shipping address, and total amount
      const newOrder = new Order({
        customerClerkId: customerInfo.clerkId,
        products: orderItems,
        shippingAddress,
        shippingRate: session?.shipping_cost?.shipping_rate,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
        dateAdded: orderItems.length > 0 ? new Date(orderItems[0].dateAdded) : new Date(),
      });
      // Save the order to the database
      await newOrder.save();

      let customer = await Customer.findOne({ clerkId: customerInfo.clerkId });
      if (customer) {
        // If the customer exists, push the order to the customer's orders array
        customer.orders.push(newOrder._id);
      } else {
        // If the customer does not exist, create a new customer with the order
        customer = new Customer({
          ...customerInfo,
          orders: [newOrder._id],
        });
      }
      await customer.save();
    }
    // Return a success response
    return new NextResponse("Order created successfully", { status: 200 });
  } catch (err) {
    console.log("[webhooks_POST]", err);
    return new NextResponse("Failed to create the order", { status: 500 });
  }
};