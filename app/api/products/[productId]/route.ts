import Collection from "@/lib/models/Collection";
import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

// GET /api/products/[productId] - Get a product by ID
export const GET = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    // Connect to DB
    await connectToDB();
    // Get product by ID and populate the collection field with the collection data
    // why populate? because the collection field in the product model is a reference to the collection model
    // and we want to get the collection data when we fetch the product
    const product = await Product.findById(params.productId).populate({
      path: "collections",
      model: Collection,
    });
    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        { status: 404 }
      );
    }
    return new NextResponse(JSON.stringify(product), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": `${process.env.ECOMMERCE_STORE_URL}`,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.log("[productId_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// Update a product
export const POST = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    // Get the user ID from the auth function
    const { userId } = auth();
    // If the user is not authenticated, return an unauthorized response
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Connect to DB
    await connectToDB();
    // Get the product by ID
    const product = await Product.findById(params.productId);
    // if the product is not found, return a 404 response
    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        { status: 404 }
      );
    }
    // Destructure the request body
    const {
      title,
      description,
      media,
      category,
      collections,
      tags,
      sizes,
      colors,
      price,
      expense,
    } = await req.json();
    // Check if the required fields are present
    if (!title || !description || !media || !category || !price || !expense) {
      return new NextResponse(
        "Title, description, media, category, price, and expense are required",
        { status: 400 }
      );
    }
    // Update the product with the new data
    const addedCollections = collections.filter(
      // filter the collections that are not in the product collections
      (collectionId: string) => !product.collections.includes(collectionId)
    );

    const removedCollections = product.collections.filter(
      // filter the collections that are not in the collections array
      (collectionId: string) => !collections.includes(collectionId)
    );
    // update collections
    await Promise.all([
      // update added collections with the product
      ...addedCollections.map((collectionId: string) =>
        Collection.findByIdAndUpdate(collectionId, {
          // push the product ID to the products array in the collection
          $push: { products: product._id },
        })
      ),
      // update removed collections without the product
      ...removedCollections.map((collectionId: string) =>
        Collection.findByIdAndUpdate(collectionId, {
          // in this case, we pull the product ID from the products array in the collection
          $pull: { products: product._id },
        })
      ),
    ]);
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        title,
        description,
        media,
        category,
        collections,
        tags,
        sizes,
        colors,
        price,
        expense,
      },
      { new: true }
      // populate the collections field with the collection data
    ).populate({ path: "collections", model: Collection });
    // save the updated product
    await updatedProduct.save();
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (err) {
    console.log("[productId_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDB();
    // Get the product by ID
    const product = await Product.findById(params.productId);

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        { status: 404 }
      );
    }
    // Delete the product
    await Product.findByIdAndDelete(product._id);

    // Update collections after deleting the product
    await Promise.all(
      product.collections.map((collectionId: string) =>
        Collection.findByIdAndUpdate(collectionId, {
          $pull: { products: product._id },
        })
      )
    );

    return new NextResponse(JSON.stringify({ message: "Product deleted" }), {
      status: 200,
    });
  } catch (err) {
    console.log("[productId_DELETE]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
};
export const dynamic = "force-dynamic";