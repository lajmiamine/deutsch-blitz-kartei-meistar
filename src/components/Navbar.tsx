
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("isAdmin") === "true";
  });

  const toggleAdmin = () => {
    const newValue = !isAdmin;
    localStorage.setItem("isAdmin", String(newValue));
    setIsAdmin(newValue);
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex space-x-0.5">
            <div className="w-5 h-5 bg-german-black rounded-sm"></div>
            <div className="w-5 h-5 bg-german-red rounded-sm"></div>
            <div className="w-5 h-5 bg-german-gold rounded-sm"></div>
          </div>
          <span className="text-xl font-bold">GermanLearner</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link to="/flashcards">
            <Button variant="ghost">Flashcards</Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost">Admin Panel</Button>
            </Link>
          )}
          <Button 
            variant={isAdmin ? "destructive" : "outline"} 
            size="sm" 
            onClick={toggleAdmin}
          >
            {isAdmin ? "Exit Admin" : "Admin Mode"}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
