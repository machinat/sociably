import React from 'react';
import neons from './neons.module.css'

const platforms = [
  'facebook',
  'telegram',
  'slack',
  'whatsApp',
  'twitter',
  'email',
];

function NeonWords({children}) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(
    () => {
      const timeout = setTimeout(() => {
        setIdx(idx < platforms.length - 1 ? idx + 1 : 0);
      }, 1500);
      return () => clearTimeout(timeout);
    },
    [idx]
  );

  const platform = platforms[idx];
  return <span className={neons[platform]}>{children}</span>
}

export default NeonWords;
