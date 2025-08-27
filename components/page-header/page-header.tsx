import React from 'react';

interface HeaderProps {
  title: string; // This prop will be used to pass the title of the header
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="text-lg p-4">
      <h1>{title}</h1>
    </header>
  );
};

export default Header;