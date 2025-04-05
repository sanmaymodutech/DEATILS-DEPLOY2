import { useEffect, useState } from "react";
import { Menu, MenuButton } from "@headlessui/react";
import { Pencil, Trash, Eye } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { Link } from "react-router";
import { toast } from "react-toastify";
import api from "../utils/api";

export default function TableComponent() {
  const { customers, setCustomers, loading, error, step, viewQuote, prevStep } =
    useAuth();
  const [sortOrder, setSortOrder] = useState("desc");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // const sortedCustomers = [...customers].sort((a, b) =>
  //   sortOrder === "asc"
  //     ? a.customerName?.localeCompare(b.customerName)
  //     : b.customerName?.localeCompare(a.customerName)
  // );

  const handleDelete = async (id, name) => {
    // Create a toast with buttons for confirmation
    toast.info(
      ({ closeToast }) => (
        <div className="w-full">
          <p className="pt-8 mb-2 font-semibold">
            Are you sure you want to delete {name} quotation?
          </p>
          <div className=" flex justify-end gap-2">
            <button
              onClick={closeToast}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                closeToast();
                performDelete(id);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        position: "top-center",
        closeOnClick: false,
        style: { width: "600px", height: "130px", maxWidth: "100%" },
        draggable: false,
        closeButton: false,
      }
    );
  };

  // Separate function to perform the actual deletion
  const performDelete = async (id) => {
    try {
      setDeleteLoading(true);

      // Optimistically update the UI
      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer) => customer._id !== id)
      );

      // API call
      const response = await api.delete(`/quotations/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete quotation");
      }

      toast.success("Quotation deleted successfully");
    } catch (error) {
      console.error(
        "Error deleting quotation:",
        error.response?.data?.message || error.message
      );
      toast.error(
        error.response?.data?.message ||
          "Failed to delete quotation. Please try again."
      );

      // Revert state on error
      const deletedCustomer = customers.find((customer) => customer._id === id);
      if (deletedCustomer) {
        setCustomers((prevCustomers) => [...prevCustomers, deletedCustomer]);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <p className="text-center text-gray-700">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th
                className="py-3 px-6 text-left cursor-pointer"
                // onClick={() =>
                //   setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                // }
              >
                <Menu>
                  <MenuButton className="text-gray-700 font-semibold">
                    Name {sortOrder === "desc" ? "▲" : "▼"}
                  </MenuButton>
                </Menu>
              </th>

              <th className="py-3 px-6 text-left text-gray-700 font-semibold">
                Email
              </th>
              <th className="py-3 px-6 text-left text-gray-700 font-semibold">
                Number
              </th>
              <th className="py-3 px-6 text-left text-gray-700 font-semibold">
                Property Name
              </th>
              <th className="py-3 px-6 text-left text-gray-700 font-semibold">
                Location
              </th>
              <th className="py-3 px-6 text-left text-gray-700 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer._id || index}
                className="border-t hover:bg-gray-100 transition"
              >
                <td className="py-3 px-6">{customer.customerName}</td>
                <td className="py-3 px-6">{customer.email}</td>
                <td className="py-3 px-6">{customer.mobileNumber}</td>
                <td className="py-3 px-6">{customer.propertyName}</td>
                <td className="py-3 px-6">{customer.location}</td>
                <td className="py-3 px-6 flex space-x-3">
                  <Link
                    target="_blank"
                    to={`${customer?._id}/customer-summary`}
                  >
                    <button className="text-blue-500  cursor-pointer hover:text-blue-700">
                      <Eye size={18} />
                    </button>
                  </Link>
                  <button
                    onClick={() => viewQuote(customer?._id)}
                    className="text-green-500  cursor-pointer hover:text-green-700"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(customer?._id, customer.customerName)
                    }
                    disabled={deleteLoading}
                    className="text-red-500 cursor-pointer hover:text-red-700"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
