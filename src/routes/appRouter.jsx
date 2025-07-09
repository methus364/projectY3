import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "../page/user/Home";
import Login from "../page/user/Login";
import Register from "../page/user/Register";

// รวม Router สำหรับเปลี่ยนไปหน้าต่างๆ
const router = createBrowserRouter([
  // {
  //   // router ฝั่ง admin
  //   path: "/admin",
  //   element: <LayoutAdmin />,
  //   children: [
  //     { index: true, element: <Product /> },
  //     { path: "coures", element: <Coures /> },
  //     { path: "addproduct", element: <Addproduct /> },
  //     { path: "addcoures", element: <Addcoures /> },
  //     { path: "addcategory", element: <Addnewcategory /> },
  //   ],
  // },
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
