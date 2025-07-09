import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "../page/user/Home";
<<<<<<< HEAD
import Login from "../page/user/Login";
import Register from "../page/user/Register";

=======
import Dashbord from "../page/admin/Dashbord";
import LayoutAdmin from "../layouts/LayoutAdmin";
>>>>>>> 4ed576ee81217a59a8592d2eb81be22cfe86d65f
// รวม Router สำหรับเปลี่ยนไปหน้าต่างๆ
const router = createBrowserRouter([
  {
    // router ฝั่ง admin
    path: "/admin",
    element: <LayoutAdmin />,
    children: [
      { index: true, element: <Dashbord /> },
    ],
  },
// router ฝั่ง user
  {
    path: "/",
    children: [
      { index: true, element: <Home/> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

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
