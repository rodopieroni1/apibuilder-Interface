import React, { useEffect, useState } from 'react';
import { capitalize } from './utils';
const Table = ({ data, columns }) => {
  const [stateColumns, setStateColumns] = useState(columns)
  useEffect(()=> {
    if(!columns && data.length) setStateColumns(Object.keys(data[0])?.map(e => ({ label: capitalize(e), property: e }))) 
  },[data, columns])
  return (
    !data.length ? <p className='w-full h-full justify-center flex items-center'>No hay datos</p> :
    
    <table className='w-full'>
      <thead>
        <tr className='border-b border-bg'>
          {(columns || stateColumns)?.map(({ label, center }, i) => <th key={label + i} className={`px-5 py-2 ${center ? 'text-center flex justify-center' : 'text-left'} hover:bg-bg`}>{label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((e,index)=> (
          <tr key={e.id + 'row' + index} className='border-b border-bg'>
            {(columns || stateColumns)?.map(({ property, cell, max_length, center, label, className }, i) => {
              if (property) {
                const data = cell ? cell(e[property], index) : e[property]
                return (
                  <td key={property + i} className={`${className || 'px-5 py-2 hover:bg-bg'}  ${center ? 'text-center flex justify-center' : 'text-left'}`}>{data.length > max_length ? data.slice(0, max_length) + '..' : data}</td>
                )
              } else {
                return <td key={label + i} className={`${className || 'hover:bg-bg'} ${center ? 'text-center' : 'text-left'}`}>{cell(e,index)}</td>
              }
            })}
          </tr>
        ))}
      </tbody>
    </table>

  );
};

export default Table;


  // const data= [
  //   {name: 'Transporte', endpoint: '/j', query: 'SELECT * FROM batch_transport', author: 'Guille'},
  //   {name: 'Personas', endpoint: '/predro', query: 'SELECT * FROM batch_person', author: 'Guille'},
  //   {name: 'Transporte', endpoint: '/j', query: 'SELECT * FROM batch_transport', author: 'Guille'},
  //   {name: 'Personas', endpoint: '/predro', query: 'SELECT * FROM batch_person', author: 'Guille'},
  // ]
  // const columns = [
  //   {
  //     label: 'Nombre',
  //     property: 'name', // works with nested items too, person.data.name
  //     cell: (data) => <p>{data}</p> //optional, for specify the render of this particular cell
  //   },
  //   {
  //     label: 'Ruta de contexto',
  //     property: 'endpoint'
  //   },
  //   {
  //     label: 'Creador',
  //     property: 'author'
  //   },
  //   {
  //     label: 'Query',
  //     property: 'query'
  //   },
  // ]