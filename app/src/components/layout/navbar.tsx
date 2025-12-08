import { Link } from "react-router";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-4">
      <Link to="/">Home</Link>
      <div>
        <Link to="/about">About</Link>
      </div>
    </div>
  );
};
export default Navbar;
