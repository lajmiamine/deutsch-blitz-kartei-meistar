
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("isAdmin") === "true";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for stored preference or system preference
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "dark" || 
      (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Effect to initialize theme on mount and apply it
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleAdmin = () => {
    const newValue = !isAdmin;
    localStorage.setItem("isAdmin", String(newValue));
    setIsAdmin(newValue);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex space-x-0.5">
            <div className="w-5 h-5 bg-german-black rounded-sm"></div>
            <div className="w-5 h-5 bg-german-red rounded-sm"></div>
            <div className="w-5 h-5 bg-german-gold rounded-sm"></div>
          </div>
          <span className="text-xl font-bold dark:text-white">GermanLearner</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" className="dark:text-gray-200 dark:hover:bg-gray-700">Home</Button>
          </Link>
          <Link to="/flashcards">
            <Button variant="ghost" className="dark:text-gray-200 dark:hover:bg-gray-700">Flashcards</Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" className="dark:text-gray-200 dark:hover:bg-gray-700">Admin Panel</Button>
            </Link>
          )}
          
          <div className="flex items-center space-x-2 mr-2">
            <Sun className="h-4 w-4 dark:text-gray-400 text-yellow-500" />
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            <Moon className="h-4 w-4 dark:text-blue-300 text-gray-400" />
          </div>

          <Button 
            variant={isAdmin ? "destructive" : "outline"} 
            size="sm" 
            onClick={toggleAdmin}
            className={isAdmin ? "" : "dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"}
          >
            {isAdmin ? "Exit Admin" : "Admin Mode"}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
