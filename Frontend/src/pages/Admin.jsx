import React, { useEffect, useState } from "react";

const Admin = () => {

  const token = localStorage.getItem("token");

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
    category: "",
    stock: ""
  });

  const [editId, setEditId] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();
    setProducts(data);
  };

  // Fetch users (admin only)
  const fetchUsers = async () => {
    const res = await fetch("http://localhost:5000/api/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or Update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      // Update
      await fetch(`http://localhost:5000/api/products/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      alert("Product Updated ✅");
      setEditId(null);
    } else {
      // Add
      await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      alert("Product Added ✅");
    }

    setForm({
      name: "",
      price: "",
      image: "",
      description: "",
      category: "",
      stock: ""
    });

    fetchProducts();
  };

  // Delete product
  const deleteProduct = async (id) => {
    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert("Product Deleted");
    fetchProducts();
  };

  // Edit product
  const editProduct = (product) => {
    setForm(product);
    setEditId(product._id);
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-10">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 w-full" />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" className="border p-2 w-full" />
        <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="border p-2 w-full" />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border p-2 w-full" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="border p-2 w-full" />
        <input name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" className="border p-2 w-full" />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {editId ? "Update Product" : "Add Product"}
        </button>
      </form>

      {/* Product List */}
      <h2 className="text-2xl font-bold mb-4">Products</h2>

      {products.map((product) => (
        <div key={product._id} className="border p-4 flex justify-between mb-3">
          <div>
            {product.name} - ₹{product.price}
          </div>

          <div className="space-x-2">
            <button
              onClick={() => editProduct(product)}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>

            <button
              onClick={() => deleteProduct(product._id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* User List */}
      <h2 className="text-2xl font-bold mt-10 mb-4">Users</h2>

      {users.map((user) => (
        <div key={user._id} className="border p-3 mb-2">
          {user.name} - {user.email} {user.isAdmin && "(Admin)"}
        </div>
      ))}

    </div>
  );
};

export default Admin;
