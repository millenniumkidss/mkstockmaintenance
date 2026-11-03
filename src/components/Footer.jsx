import React from "react";
import "./Layout.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        © {new Date().getFullYear()} Millennium Kidss. All Rights Reserved.
      </div>

      <div className="footer-right">Stock Management System</div>
    </footer>
  );
}

export default Footer;
