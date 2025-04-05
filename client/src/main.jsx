// main.jsx (updated)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Layout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CustomerList from "./pages/CustomerList.jsx";
import LeadStage from "./pages/LeadStage.jsx";
import CreateUser from "./pages/CreateUser.jsx";
import PendingCustomer from "./pages/PendingCustomer.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import CustomerSummary from "./pages/CustomerSummary.jsx";
import Home from "./pages/Home.jsx"; // Import your new Home component

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      // Public home page route
      {
        path: "/",
        Component: Home, // Set your Home component as the root route
      },
      // Protected dashboard routes - moved to /details
      {
        path: "/details",
        Component: ProtectedRoute,
        children: [
          {
            path: "",
            Component: Layout,
            children: [
              { path: "", Component: Dashboard },
              { path: "leadstage", Component: LeadStage },
              { path: "new", Component: CreateUser },
              { path: "customers", Component: CustomerList },
              { path: "quote-shared", Component: CustomerList },
              { path: "await-booking", Component: PendingCustomer },
              {
                path: "customers/:id/customer-summary",
                Component: CustomerSummary,
              },
            ],
          },
          {
            path: "customers-summery",
            Component: CustomerSummary,
          },
        ],
      },
      {
        path: "/",
        Component: PublicRoute,
        children: [
          { path: "login", Component: Login },
          { path: "register", Component: Register },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
