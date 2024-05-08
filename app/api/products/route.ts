import { connectToDB } from "@/lib/mongoDB";
import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import Product from "@/lib/models/Product";
import Collection from "@/lib/models/Collection";
export const POST = async (req: NextRequest) => {
  try {
    // Get the user ID
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Connect to the database
    await connectToDB();
    // Get the request body
    const {
      title,
      description,
      media,
      category,
      collections,
      tags,
      size,
      colors,
      price,
      expense,
    } = await req.json();
    if (!title || !media || !category || !price || !expense) {
      return new NextResponse(
        "Title, media, category, price, and expense are required",
        { status: 400 }
      );
    }
    // Create a new product
    const newProduct = await Product.create({
      title,
      description,
      media,
      category,
      collections,
      tags,
      size,
      colors,
      price,
      expense,
    });
    await newProduct.save();
    // Update the collections field of the product
    // If collections are provided
    if (collections) {
      for (const collectionId of collections) {
        const collection = await Collection.findById(collectionId);
        if (collection) {
          collection.products.push(newProduct._id);
          await collection.save();
        }
      }
    }
    return new NextResponse(JSON.stringify(newProduct), { status: 200 });
  } catch (err) {
    console.log("[products_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
// Get function to get the products
export const GET = async (req: NextRequest) => {
  try {
    // Connect to the database
    await connectToDB();
    // Get all products
    const products = await Product.find()
      .sort({ createdAt: "desc" })
      // Populate the collections field to get the collection details
      .populate({ path: "collections", model: Collection });
    return new NextResponse(JSON.stringify(products), { status: 200 });
  } catch (err) {
    console.log("[products_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
export const dynamic = "force-dynamic";