import React from 'react'

const About = () => {
  return (
    <div className="bg-gray-50 min-h-screen px-6 py-12">

      {/* HEADER */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About ElectroShop</h1>
        <p className="text-gray-600 text-lg">
          Your trusted destination for the latest electronic devices and accessories.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">

        {/* TEXT */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Who We Are</h2>
          <p className="text-gray-600 mb-4">
            ElectroShop is an online electronics store providing high-quality gadgets
            such as laptops, smartphones, headphones, smart watches, and accessories.
          </p>
          <p className="text-gray-600 mb-4">
            Our mission is to deliver the best technology at affordable prices with
            fast delivery and secure payment options.
          </p>

          <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Latest electronic products</li>
            <li>Affordable pricing</li>
            <li>Secure payments</li>
            <li>Fast & reliable delivery</li>
            <li>24/7 customer support</li>
          </ul>
        </div>

        {/* IMAGE / CARD */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-3">Our Vision</h3>
          <p className="text-gray-600">
            To become a leading e-commerce platform for electronics by providing
            excellent customer experience and innovative products.
          </p>
        </div>

      </div>
    </div>
  )
}

export default About
