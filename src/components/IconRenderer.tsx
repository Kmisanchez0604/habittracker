import React from 'react';
import * as FaIcons from 'react-icons/fa';

type Props = {
  name?: string | null;
  size?: number;
};

const IconRenderer: React.FC<Props> = ({ name, size = 20 }) => {
  if (!name) return null;
  // look up FontAwesome icon by name (e.g., 'FaUtensils')
  // @ts-ignore
  const Icon = (FaIcons as any)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
};

export default IconRenderer;
