import { connectToDB } from "@/lib/mongoDB";
import Collection from "@/lib/models/Collection";
import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import Product from "@/lib/models/Product";

// GET /api/collections/[collectionId]
export const GET = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    // Connect to DB
    await connectToDB();
    // Get collection by ID
    const collection = await Collection.findById(params.collectionId).populate({
      path: "products",
      model: Product,
    });
    if (!collection) {
      return new NextResponse(
        JSON.stringify({ message: "Collection not found" }),
        { status: 404 }
      );
    }
    return NextResponse.json(collection, { status: 200 });
  } catch (err) {
    console.log("[collectionId_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
// Update a collection
export const POST = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Connect to DB
    await connectToDB();
    // Get collection by ID
    let collection = await Collection.findById(params.collectionId);
    // destructuring the request body
    const { title, description, image } = await req.json();
    if (!title || !image) {
      return new NextResponse("Title and image are required", { status: 400 });
    }
    // Update collection
    collection = await Collection.findByIdAndUpdate(
      params.collectionId,
      {
        title,
        description,
        image,
      },
      { new: true }
    );
    await collection.save();
    return NextResponse.json(collection, { status: 200 });
  } catch (err) {
    console.log("[collectionId_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// This function deletes a collection from the database.
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Connect to DB
    await connectToDB();
    // Delete collection
    await Collection.findByIdAndDelete(params.collectionId);
    // Remove the collection from the products
    await Product.updateMany(
      { collections: params.collectionId },
      { $pull: { collections: params.collectionId } }
    );

    return new NextResponse("Collection deleted successfully", { status: 200 });
  } catch (err) {
    console.log("[collectionId_DELETE]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
export const dynamic = "force-dynamic"