import { createBrowserRouter } from "react-router";
import Login from "./Features/Auth/pages/Login";
import Register from "./Features/Auth/pages/Register";
import Protected from "./Features/Auth/components/ProtectedRoute";
import PublicRoute from "./Features/Auth/components/PublicRoute";
import Home from "./Features/Interview/pages/Home";
import Interview from "./Features/Interview/pages/Interview";
import ErrorPage from "./components/ErrorPage";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <PublicRoute><Login /></PublicRoute>,
        errorElement: <ErrorPage />
    },
    {
        path: "/register",
        element: <PublicRoute><Register /></PublicRoute>,
        errorElement: <ErrorPage />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>,
        errorElement: <ErrorPage />
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>,
        errorElement: <ErrorPage />
    }
    ,
    {
        path: "*",
        element: <ErrorPage />
    }
])