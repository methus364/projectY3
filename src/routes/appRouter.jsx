import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "../page/user/Home";
import Login from "../page/user/Login";
import Rooms from "../page/admin/Rooms";
import Massage from "../page/admin/Massage";
import Products from "../page/admin/Products";
import Customer from "../page/admin/Customer";
import Bill from "../page/admin/Bill";
import Booking from "../page/admin/Booking";
import Repair from "../page/admin/Repair";
import Register from "../page/user/Register";
import Dashbord from "../page/admin/Dashbord";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Roomuser from "../page/user/Roomuser";
import Roomhistory from "../page/user/Roomhistory";
import Profile from "../page/user/Profile";
import Editprofile from "../page/user/Editprofile";
import Contact from "../page/user/Contact";
import Money from "../page/admin/Money";
import Bookingmanagement from "../page/admin/Bookingmanagement";

// รวม Router สำหรับเปลี่ยนไปหน้าต่างๆ
const router = createBrowserRouter([
  {
    // router ฝั่ง admin
    path: "/admin",
    element: <LayoutAdmin />,
    children: [
      { index: true, element: <Dashbord /> },
      { path: "rooms", element: <Rooms /> },
      { path: "products", element: <Products /> },
      { path: "customers", element: <Customer /> },
      { path: "bill", element: <Bill /> },
      { path: "massage", element: <Massage /> },
      { path: "booking", element: <Booking /> },
      { path: "repair", element: <Repair /> },
      { path: "money", element: <Money /> },
      { path: "bookingmanagement", element: <Bookingmanagement /> },
    ],
  },
// router ฝั่ง user
  {
    path: "/",
    children: [
      { index: true, element: <Home/> },
      { path: "home", element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "roomuser", element: <Roomuser /> },
      { path: "roomhistory", element: <Roomhistory/> },
      { path: "profile", element: <Profile/> },
      { path: "Editprofile", element: <Editprofile/> },
      { path: "contact", element: <Contact/> },

    ],
  },
]);

const AppRouter = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default AppRouter;
