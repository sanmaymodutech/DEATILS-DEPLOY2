import * as React from "react";
import { Outlet } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";

import logo from "../assets/images/Dtales-logo.png"

export default function Layout() {

  function CustomAppTitle() {
    return (
      <img src={logo} className="w-14"   alt="Dtale" />
    );
  }
  
  return (
    <DashboardLayout  slots={{
      appTitle: CustomAppTitle
    }}>
      <div className="px-10 py-4">
        <Outlet />
      </div>
    </DashboardLayout>
  );
}
