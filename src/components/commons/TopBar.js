import React from 'react';
const TopBar = ({title}) => {
    return (
        <div className='bg-main p-2 w-full h-full flex items-center'>
            <h1 className='font-bold'>{title}</h1>
        </div>
    );
};

export default TopBar;