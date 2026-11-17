import React from "react";

const ProductCard = ({ product, addToCart }) => {

  if (!product) return null;

  return (
    <div className="bg-white shadow-md rounded p-4 w-64 text-center">

      <h3 className="text-lg font-semibold">{product.name || "No Name"}</h3>
      <p className="text-blue-600 font-bold">
        ₹{product.price || "0"}
      </p>

      <button
        onClick={() => addToCart(product._id)}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add to Cart
      </button>

    </div>
  );
};

export default ProductCard;
