import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";
import { useNavigate } from "react-router";

// Validation Schema
const schema = yup.object().shape({
  customerName: yup.string().required("First name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  mobileNumber: yup
    .string()
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  propertyName: yup.string().required("Property name is required"),
  bhk: yup.string().required("BHK type is required"),
  location: yup.string().required("Location is required"),
});

const CreateUser = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { addCustomer, setQuotationId } = useAuth();

  const onSubmit = async (data) => {
    try {
      const response = await api.post(`/quotations`, data);
      setQuotationId(response.data.data._id);
      addCustomer(response.data.data);
      reset();
      toast.success("User created successfully!", { theme: "dark" });
      navigate("/details/customers");
    } catch (error) {
      console.error("Error creating user:", error);

      if (error.response) {
        // Handle API validation errors
        if (error.response.data.errors) {
          Object.values(error.response.data.errors).forEach((errMsg) => {
            toast.error(errMsg, { theme: "dark" });
          });
        } else {
          toast.error(error.response.data.message || "Error creating user.", {
            theme: "dark",
          });
        }
      } else if (error.request) {
        // Handle network errors
        toast.error("Network error. Please check your connection.", {
          theme: "dark",
        });
      } else {
        // Handle unexpected errors
        toast.error("Something went wrong. Please try again.", {
          theme: "dark",
        });
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-3">
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold text-gray-900">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Use a permanent address where you can receive mail.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
              {/* First Name */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-900">
                  First name
                </label>
                <input
                  {...register("customerName")}
                  type="text"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                />
                <p className="text-red-500 text-sm">
                  {errors.customerName?.message}
                </p>
              </div>

              {/* Email */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-900">
                  Email address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                />
                <p className="text-red-500 text-sm">{errors.email?.message}</p>
              </div>

              {/* Phone Number */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-900">
                  Phone Number
                </label>
                <input
                  {...register("mobileNumber")}
                  type="tel"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                />
                <p className="text-red-500 text-sm">
                  {errors.mobileNumber?.message}
                </p>
              </div>

              {/* Property Name */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900">
                  Property Name
                </label>
                <input
                  {...register("propertyName")}
                  type="text"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                />
                <p className="text-red-500 text-sm">
                  {errors.propertyName?.message}
                </p>
              </div>

              {/* BHK Type */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900">
                  Select BHK Type
                </label>
                <select
                  {...register("bhk")}
                  className="block w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-gray-900 border border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
                >
                  <option value="">Select</option>
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK">4 BHK</option>
                  <option value="5BHK">5 BHK</option>
                </select>
                <p className="text-red-500 text-sm">{errors.bhk?.message}</p>
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900">
                  Location
                </label>
                <input
                  {...register("location")}
                  type="text"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                />
                <p className="text-red-500 text-sm">
                  {errors.location?.message}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
