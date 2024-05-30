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
    // check the type of the event
    if (event.type === "checkout.session.completed") {
      // Get the session object from the event
      const session = event.data.object;
      console.log("[webhooks_POST]", session);

      // extract the date from the session object
      const selectedDate =
        session?.metadata?.dateAdded || new Date().toISOString();
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
      // Get the items from the session object
      const retrieveSession = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["line_items.data.price.product"],
        }
      );
      // Get the line items from the session object
      const lineItems = await retrieveSession?.line_items?.data;
      // Map the line items to get the product IDs
      const orderItems = lineItems?.map((item: any) => {
        return {
          product: item.price.product.metadata.productId,
          color: item.price.product.metadata.color || "N/A",
          size: item.price.product.metadata.size || "N/A",
          quantity: item.quantity,
        };
      });
      await connectToDB();
      // newOrder contains the customer clerk ID, the products, the shipping address and the total amount
      const newOrder = new Order({
        customerClerkId: customerInfo.clerkId,
        products: orderItems,
        shippingAddress,
        shippingRate: session?.shipping_cost?.shipping_rate,
        // we divide the total amount by 100 to get the amount in dollars
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
        // we get the date of the order
        dateAdded: new Date(selectedDate),
      });
      // save the order to the database
      await newOrder.save();

      let customer = await Customer.findOne({ clerkId: customerInfo.clerkId });
      if (customer) {
        // if the customer exists, we push the order to the customer's orders array
        customer.orders.push(newOrder._id);

        // if the customer does not exist, we create a new customer with the order
      } else {
        customer = new Customer({
          // spread the customerInfo object and add the orders array
          ...customerInfo,
          orders: [newOrder._id],
        });
      }
      await customer.save();
    }
    // return a success response
    return new NextResponse("Order created successfully", { status: 200 });
  } catch (err) {
    console.log("[webhooks_POST]", err);
    return new NextResponse("Failed to create the order", { status: 500 });
  }
};
