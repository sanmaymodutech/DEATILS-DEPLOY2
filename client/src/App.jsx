// App.jsx (updated)
import * as React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import LogoutIcon from "@mui/icons-material/Logout";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { ToastContainer } from "react-toastify";
import { Outlet, useNavigate } from "react-router";
import logo from "./assets/images/Dtales.png";
import "./index.css";
import { AuthProvider, useAuth } from "./context/Authcontext";

function MainApp() {
  const { user, logout, setStep } = useAuth();
  const navigate = useNavigate();

  const handleCustomersClick = () => {
    setStep(1); // Reset step to 1
  };

  // Update navigation segments to reflect the new /details path
  const navigationItems = [
    {
      kind: "header",
      title: "Main items",
    },
    {
      title: "Dashboard",
      icon: <DashboardIcon />,
      segment: "details", // Updated to point to the new base path
    },
    {
      segment: "details/leadstage", // Updated path
      title: "LeadStage",
      icon: <LeaderboardIcon />,
    },
    {
      segment: "details/customers", // Updated path
      title: "Customers",
      icon: <LeaderboardIcon />,
      onClick: handleCustomersClick,
    },
    {
      segment: "details/new", // Updated path
      title: "New",
      icon: <PersonAddAlt1Icon />,
    },
    {
      segment: "details/quote-shared", // Updated path
      title: "Quote Shared",
      icon: <FolderSharedIcon />,
    },
    {
      segment: "details/await-booking", // Updated path
      title: "Await Booking",
      icon: <PendingActionsIcon />,
    },
    {
      title: "Home",
      icon: <DashboardIcon />,
      segment: "", // Points to the root/home page
    },
  ];

  const [session, setSession] = React.useState({
    user: user,
  });

  // Update session when user changes
  React.useEffect(() => {
    setSession(user ? { user } : null);
  }, [user]);

  const authentication = React.useMemo(() => {
    return {
      signIn: () => {
        setSession({
          user: user,
        });
      },
      signOut: () => {
        logout();
        setSession(null);
      },
    };
  }, [user, logout]);

  const BRANDING = {
    logo: <img src={logo} alt="Dtale" />,
    title: "",
    homeUrl: "/",
  };

  return (
    <ReactRouterAppProvider
      session={session}
      authentication={authentication}
      navigation={navigationItems}
      branding={BRANDING}
    >
      <ToastContainer />
      <Outlet />
    </ReactRouterAppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
