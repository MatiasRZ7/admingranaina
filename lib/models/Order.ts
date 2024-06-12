import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerClerkId: String,
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      color: String,
      size: String,
      quantity: Number,
    },
  ],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  shippingRate: String,
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  dateAdded: {
    type: Date,
  },
  hotelName: {
    type: String,
  },
  pickupTime: {
    type: String,
  },
  childrenQuantity: {
    type: String,
  },
  adultQuantity: {
    type: String,
  },
});
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
