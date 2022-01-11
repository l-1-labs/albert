import React from "react";
import "./Header.css";

interface HeaderProps {
  children?: React.ReactNode;
}

function HeaderLeft({ children }: HeaderProps) {
  return <div className="Left">{children}</div>;
}

function HeaderRight({ children }: HeaderProps) {
  return <div className="Right">{children}</div>;
}

function Header({ children }: HeaderProps) {
  return <div className="Header">{children}</div>;
}

Header.Left = HeaderLeft;
Header.Right = HeaderRight;

export default Header;
