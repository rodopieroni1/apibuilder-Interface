import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'
import routes from './routes'
import TopBar from '../components/commons/TopBar';

const ComponentWrapper = ({ Component, title }) => (
    <div className='col-span-10 xl:col-span-11 grid grid-rows-14 h-screen'>
      <div className='row-span-1'>
        <TopBar title={title} />
      </div>
      <div className='row-span-13 p-5'>
        <Component/>
      </div>
    </div>
  )

const Router = () => {
    return (
          <Routes>
              {routes.map(({route, as, Component, params, title}) => (
                  <Route key={as} path={route + params} element={<ComponentWrapper {...{Component, title}} />} />
              ))}
              <Route path="*" element={<Navigate to={routes[0].route} replace />} />
          </Routes>
    );
};

export default Router;