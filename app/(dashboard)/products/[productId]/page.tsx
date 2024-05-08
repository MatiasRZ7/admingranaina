"use client";
import { useEffect, useState } from "react";

import Loader from "@/components/custom ui/Loader";

import React from "react";
import ProductForm from "@/components/products/ProductForm";

const ProductDetails = ({ params }: { params: { productId: string } }) => {
    const [loading, setLoading] = useState(true);
    const [productsDetails, setProductDetails] = useState<ProductType | null>(null);
    // This function will make a GET request to the server to get the product details
    // using the productId from the params
    const getProductDetails = async () => { 
        try {
            setLoading(true);
            const res = await fetch(`/api/products/${params.productId}`, {
                method: "GET",
            });
            const data = await res.json();
            setProductDetails(data);
            setLoading(false);
        } catch (err) {
            console.log("[productId_GET]", err);
        }
    };
    useEffect(() => {
        getProductDetails();
    }, []);
  return loading ? <Loader/> : (
  <ProductForm initialData={productsDetails}/>
)
};

export default ProductDetails;
