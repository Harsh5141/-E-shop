import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="mt-12 bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <h2 className="mb-3 text-2xl font-bold text-white">E-Shop</h2>
          <p className="text-sm leading-6 text-gray-400">
            Your one-stop shop for the latest electronic gadgets, accessories,
            and dependable delivery.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="transition hover:text-white">Home</Link></li>
            <li><Link to="/about" className="transition hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="transition hover:text-white">Contact</Link></li>
            <li><Link to="/cart" className="transition hover:text-white">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Categories</h3>
          <ul className="space-y-2 text-sm">
            <li className="transition hover:text-white">Laptops</li>
            <li className="transition hover:text-white">Mobiles</li>
            <li className="transition hover:text-white">Headphones</li>
            <li className="transition hover:text-white">Accessories</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Contact Us</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>Location: Valsad, Gujarat, India</p>
            <p>Email: harshpate5141@gmail.com</p>
            <p>Phone: +91 8200793086</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 px-6 py-4 text-center text-sm text-gray-400">
        Copyright 2026 E-Shop. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
