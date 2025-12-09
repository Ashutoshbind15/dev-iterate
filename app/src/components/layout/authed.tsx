import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Outlet, useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const UnauthenticatedRedirect = () => {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      toast.error("Please sign in to access this page");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return null;
};

const AuthedWrapper = () => {
  return (
    <>
      <AuthLoading>Loading...</AuthLoading>
      <Authenticated>
        <Outlet />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
    </>
  );
};

export default AuthedWrapper;
