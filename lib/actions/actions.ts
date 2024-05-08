import Customer from "../models/Customer";
import Order from "../models/Order";
import { connectToDB } from "../mongoDB";

export const getTotalSales = async () => {
  await connectToDB();
  // we  find all the orders
  const orders = await Order.find();
  const totalOrders = orders.length;
  // we calculate the total revenue by summing up the total amount of all orders
  const totalRevenue = orders.reduce(
    (acc, order) => acc + order.totalAmount,
    0
  );
  return { totalOrders, totalRevenue };
};

export const getTotalCustomers = async () => {
  await connectToDB();
  // we find all the customers
  const customers = await Customer.find();
  const totalCustomers = customers.length;
  // we return the total number of customers
  return totalCustomers;
};
export const getSalesPerMonth = async () => {
  await connectToDB();
  // we find all the orders
  const orders = await Order.find();
  // we group the orders by month
  const salesPerMonth = orders.reduce((acc, order) => {
    const monthIndex = new Date(order.createdAt).getMonth();
    acc[monthIndex] = (acc[monthIndex] || 0) + order.totalAmount;
    return acc;
  }, {});

  const grapthData = Array.from({ length: 12 }, (_, i) => {
    // i means the month index
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      new Date(0, i)
    );
    return { name: month, sales: salesPerMonth[i] || 0 };
  });
  return grapthData;
};
