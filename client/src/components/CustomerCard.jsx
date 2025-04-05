import React from "react";
import { useAuth } from "../context/Authcontext";
import { Link } from "react-router";

const CustomerCard = () => {
  const { quotation, loading, costSummary, twoDdata } = useAuth();

  if (loading)
    return <div className="text-center text-gray-500">Loading...</div>;
  if (!quotation)
    return <div className="text-center text-red-500">No quotation found</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm  mb-5">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Customer Details
      </h3>
      <p className="text-gray-600 mb-2">
        <span className="font-bold">ID:</span> {quotation._id}
      </p>
      <p className="text-gray-600 mb-2">
        <span className="font-bold">Name:</span> {quotation.customerName}
      </p>
      <p className="text-gray-600 mb-2">
        <span className="font-bold">Email:</span> {quotation.email}
      </p>
      {/* <p className="text-gray-600 mb-2">  
        <span className="font-bold">propertyName:</span> {quotation.propertyName}
      </p>
      <p className="text-gray-600 mb-2">
        <span className="font-bold">location:</span> {quotation.location}
      </p>
      <p className="text-gray-600 mb-2">
        <span className="font-bold">BHK:</span> {quotation.bhk}
      </p> */}

      <p className="text-gray-600 mb-2">
        <span className="font-bold">Estimate:</span> ₹
        {Math.round(quotation?.totalPrice).toLocaleString("en-IN")}
      </p>
      <Link target="_blank" to={`${quotation._id}/customer-summary`}>
        <button className="bg-blue-500 text-white px-4 py-2 rounded me-4 cursor-pointer">
          view Quotation
        </button>
      </Link>
    </div>
  );
};

export default CustomerCard;
