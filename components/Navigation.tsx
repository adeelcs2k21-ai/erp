"use client";

import { Box, Button, Burger } from "@mantine/core";
import { useEffect, useState } from "react";

const pages = ["Dashboard", "Finance", "BOM", "Inventory", "Manufacturing", "Documentation", "Website", "CRM", "HR"];

const routes: { [key: string]: string } = {
  Dashboard: "/dashboard",
  CRM: "/crm",
  BOM: "/bom",
  Purchase: "/bom",
  Manufacturing: "/manufacturing",
  HR: "/hr",
  Finance: "/finance",
  Inventory: "/inventory",
  Documentation: "/documentation",
  Website: "/website",
};

interface NavigationProps {
  currentPage: number;
}

export function Navigation({ currentPage }: NavigationProps) {
  const [visiblePages, setVisiblePages] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    if (user.role === "superadmin" || user.role === "admin") {
      setVisiblePages(pages);
    } else {
      let userModules = Array.isArray(user.modules) ? user.modules : [user.module];
      userModules = userModules.map((m: string) => m === "Purchase" ? "BOM" : m);
      setVisiblePages(userModules);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: transform 0.3s ease;
        }
        
        .sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .sidebar-logo {
          max-width: 100%;
          height: auto;
          max-height: 60px;
        }
        
        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
          overflow-y: auto;
        }
        
        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid #e0e0e0;
        }
        
        .nav-item {
          display: block;
          padding: 12px 20px;
          color: #666;
          font-size: 14px;
          font-weight: 400;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
          background: #f8f9fa;
          color: #000;
        }
        
        .nav-item.active {
          color: #000;
          font-weight: 600;
          background: #f0f0f0;
          border-left-color: #000;
        }
        
        .logout-btn {
          width: 100%;
          padding: 10px 16px;
          background: #f8f9fa;
          color: #dc3545;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .logout-btn:hover {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }
        
        .mobile-menu-button {
          display: none;
        }
        
        .mobile-menu-overlay {
          display: none;
        }
        
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .mobile-menu-button {
            display: block !important;
          }
          .mobile-menu-overlay {
            display: block !important;
          }
        }
      `}</style>
      
      {/* Mobile Menu Button */}
      <div
        className="mobile-menu-button"
        style={{
          position: "fixed",
          left: "20px",
          top: "20px",
          zIndex: 101,
          display: "none",
        }}
      >
        <Burger
          opened={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          size="md"
          color="#000"
        />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
            display: "none",
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img 
            src="/images-removebg-preview.png" 
            alt="Logo" 
            className="sidebar-logo"
          />
        </div>
        
        <nav className="sidebar-nav">
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => {
                window.location.href = routes[page];
                setMobileMenuOpen(false);
              }}
              className={`nav-item ${currentPage === pages.indexOf(page) ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
