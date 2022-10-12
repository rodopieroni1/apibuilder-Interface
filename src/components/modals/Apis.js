import React, { useState, useEffect } from 'react';
import Alert from '../libraries/Alert';
import { MdClose, MdDelete, MdDone, MdRemove } from "react-icons/md";
import useUpdateEffect from "../../hooks/useUpdateEffect"
import Loader from '../Loader'
import TableFromQuery from '../libraries/TableFromQuery';
import { capitalize } from '../libraries/utils';
import {Form, Input, InputMultiSelect, InputSelect, SqlEditor} from '../form';
import { Portal } from 'react-portal';
import Table from '../libraries/Table';
const dataTypeIndetifier = (data) => {
    const dateRegex =  /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/
    if (dateRegex.exec(data)){
      return 'date'
    }
    if(!isNaN(Number(data))){
      return 'number'
    }
   return 'text'
}
const formaters = {
  singleParams : ({data, symbol}) => `${symbol} ${data}`,
  dualParams : ({field, data, symbol}) => `${field} ${symbol} ${data}`,
  tripleParams : ({field, data:[data1, data2], symbol}) => `${field} ${symbol} ${data1} AND ${data2}` 
}
const formatOptions= (array, property, display_name) => {
  return array.map(e => {
    const data = e[property]?.trim() || e
    const name = e[display_name]
    return {value: data, label: name ||  capitalize(data).replaceAll('_', ' ')}
  })
}
const Apis = ({isOpen, setIsOpen, setLoading, loading, id, setId}) => {
  // toggles
  const [closing, setClosing] = useState(false)
  const [resetMainSelects, setResetMainSelects] = useState(false)
  const [resetSecondarySelects, setResetSecondarySelects] = useState(false)
  const [advancedQuery, setAdvancedQuery] = useState(false)
  const [tableHasBeenSelected, setTableHasBeenSelected] = useState(false)
  // User for edit
  const [edit, setEdit] = useState({})
  // Athena
  const [dataBases, setDataBases] = useState([])
  const [dataBase, setDataBase] = useState('')
  const [tables, setTables] = useState([])
  const [table, setTable] = useState('')
  const [columns, setColumns] = useState([])
  const [column, setColumn] = useState('')
  // Filters
  const [methods, setMethods] = useState([])
  const [filters, setFilters] = useState([])
  const [queryFilters, setQueryFilters] = useState([])
  const [filtersString, setFiltersString] = useState([])
  
  // Query
  const [result, setResult] = useState('')
  const [query, setQuery] = useState('SELECT * FROM')
  const [queryErrors, setQueryErrors] = useState('')
  // Tab manager
  const [tabIndex, setTabIndex] = useState(0)
  

  const tabs = [
    {
      label: 'Table',
      component: <pre className='bg-main border h-56 p-3 border-bg overflow-x-auto rounded-lg mt-2'><TableFromQuery result={result}/></pre> 
    },
    {
      label: 'JSON',
      component: <pre className='bg-bg h-56 overflow-y-auto p-3 rounded-lg  mt-2'>{result || 'Waiting for test'}</pre>
    },
  ]
  const URL = process.env.REACT_APP_BASE_URL
  const form = document.getElementsByTagName('form')[0]

  const handleQueryChange = (query) => {
    if (!query || !tables.length) return
    
    setResult('')
    if ((!tableHasBeenSelected && !queryErrors.length ) && !edit.query) return
    const errors = []
    const splittedQuery = query?.split(' ') || []
    const [option1,option2,option3,option4] = splittedQuery
    const flatTables = tables.map(e => e.value)
    if(option2?.toUpperCase() === 'FROM') errors.push('Necesitas seleccionar algo')
    if(option1?.toUpperCase() !== 'SELECT') errors.push('SELECT?')
    if(option3?.toUpperCase() !== 'FROM') errors.push('FROM?')
    if (!flatTables.includes(option4)){
      setTable(option4 || '')
      errors.push(`Debes seleccionar datos de una tabla válida. Ej: ${flatTables[0]}`)
    } else {
      setTable(option4)
    }
    setQueryErrors(errors[0] || '')
    setQuery(query)
  }

  const resetForm= (localForm) => {
    localForm?.reset() || form.reset()
    setResetMainSelects(!resetMainSelects)
    setResetSecondarySelects(!resetSecondarySelects)
    setQueryFilters([])
    setQueryErrors('')
    setQuery('')
    setQueryFilters([])
    setTables([])
    setTable('')
    setDataBase('')
    setColumns([])
    setColumn([])
    setFilters([])
  }
  
  const handleClose = (name) => {
    if (name === 'close') {
      // Reset value
      resetForm()
      setAdvancedQuery(false)
      cancelEdit(form)
    }
    setClosing(true)
    setTimeout(()=> {
      setIsOpen(false)
      setClosing(false)
    },200)
  }

  const cancelEdit = () => {
      setEdit({})
      setTables([])
      setTable('')
      setDataBase('')
      setId('')
      setResult('')
      setQuery('')
      resetForm()
      setFilters([])
  }

  const testQuery = (sql) => {
    setLoading(true)
    fetch(`${URL}/athena/query`, {
      method: 'POST', 
      body: JSON.stringify({sql, db: dataBase}), 
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(response => {
      setLoading(false)
      if(response.items.length) {
        setResult(JSON.stringify(response.items, null, 2))
      } else {
        Alert.fire("¡Ops!", 'No se encontraron resultados', "error");
      }
    });
  }
  
  const functions = {
    'main-submit': (data, form) =>  {
      setLoading(true)

      fetch(`${URL}/apis/${id}`, {
        method: id ? 'PATCH' : 'POST', 
        body: JSON.stringify({...data, query}), 
        headers:{
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
      .catch(({message}) => {
        Alert.fire("¡Ops!", message, "error");
      })
      .then(({success, msg, item}) => {
        if(success){
          resetForm(form)
          setResult('')
          setQuery('')
          cancelEdit()
          console.log(item)
          fetch(`${URL}/filters/many`, {
            method: 'POST', 
            body: JSON.stringify(filters.map(e => ({...e, api_id: item.id}))), 
            headers:{
              'Content-Type': 'application/json'
            }
          }).then(res => res.json())
          .catch(({message}) => {
            Alert.fire("¡Ops!", message, "error");
          })
          Alert.fire("¡Perfecto!", msg, "success");
        } else {
          Alert.fire("¡Ops!", msg, "error");
        }
        setLoading(false)
      });
    },
    'test-submit': (data) => {
      data.query ? testQuery(data.query+` LIMIT ${data.limit || 10}`) : Alert.fire("¡Ops!", 'Tienes que escribir una peticion primero', "error");
    }
  }

  const mainSubmit = (values, form) => {
    functions[document.activeElement.id](values, form)
  }
  const secondarySubmit = (values, form) => {
    setFilters(prev => [...prev, values])
    form.reset()
    setResetSecondarySelects(!resetSecondarySelects)
  }

  useUpdateEffect(()=> {
    resetForm()
    if(id) {
      fetch(`${URL}/apis/${id}`).then(res => res.json())
      .catch(error => console.error('Error:', error))
      .then(({item}) => {
        setDataBase(item.database)
        setTable(item.table)
        getTablesFromDatabase(item.database)
        setResult('')
        setEdit(item)

        setQuery(item.query)
      })
    }
  },[id])

  useUpdateEffect(()=> {
    handleQueryChange(query)
  },[tables])


  const handleChangeTable = (value) => {
    setTable(value)
    setColumns([])
    setColumn([])
    setFilters([])
    setResult('')
    setQueryFilters([])
    setQuery(prev => {
      if (prev.length) {
        const splittedQuery = prev.split(' ')
        splittedQuery[3] = value
        return splittedQuery.join(' ')
      }
      return `SELECT * FROM ${value}`
    })

    if(!value) return

    // const sql = `DESCRIBE ${value}`
    // const sql = `SELECT COLUMN_NAME,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${value}'`
    const sql = `SELECT * FROM ${value} LIMIT 1`
    fetch(`${URL}/athena/query`, {
      method: 'POST', 
      body: JSON.stringify({sql, db: dataBase}), 
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(response => {
      setLoading(false)
      if(response.items.length) {
        const columns = Object.keys(response.items[0]).map(e => {
          return {field: e, type: dataTypeIndetifier(response.items[0][e])}
        })
        setColumns(columns)
      } else {
        Alert.fire("¡Ops!", 'Algo salio mal', "error");
      }
    });

    setQueryErrors('')
    setTableHasBeenSelected(true)
  }
  const handleChangeColumn = (values) => {
      setResult('')
      setQuery(prev => {
            if (prev?.length) {
              const splittedQuery = prev.split(' ')
              splittedQuery[1] = values.length ? values : '*'
              return splittedQuery.join(' ')
            }
            return prev
          })
  }

  const getTablesFromDatabase= (db) => {
    setResult('')
    setTables([])
    setTable('')
    setFilters([])
    setQueryFilters([])
    setColumns([])
    setColumn([])

    setDataBase(db)
   
    fetch(`${URL}/athena/tables/${db}`).then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(response => {
      setTables(formatOptions(response.items, 'tab_name'))
      handleQueryChange(query)
    })
  }

  useEffect(()=> {

    fetch(`${URL}/athena/databases`).then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(response => {
      setDataBases(formatOptions(response.items.filter( ({database_name}) => database_name !== 'default'), 'database_name'))
    })

    fetch(`${URL}/filters/methods`).then(res => res.json())
    .catch(error => console.error('Error:', error))
    .then(response => {
      setMethods(response.item)
    })

  },[URL])

  const tableColumns = [
    {
      label:'Nombre',
      property: 'name'
    },
    {
      label:'Campo',
      property: 'field'
    },
    {
      label:'Operador',
      property: 'operator',
      cell : (data) => methods.object[data].display_name
    },
    {
      label: 'Dato',
      className: 'hover:bg-main',
      cell: (data,i) => {
        const method = methods.object[data.operator]
        const type = columns.find(({field}) => field === data.field).type
        const formater = formaters[method.formater]
          const handleChange= ({name}) => {
            if(!queryFilters.find(e => e.name === name)) return
            setQueryFilters(prev => prev.filter(e => e.name !== name))
          }
          const onSubmit= (values) => {
            if(queryFilters.find(e => e.name === data.name)) return
            if(!values[data.name]) return
            const value = values[data.name]
            const filter= {
              name: data.name,
              data: values[data.name],
              query: formater({...method, data: type === 'text' ? `'${value}'` : value, field: data.field})
            }
            setQueryFilters(prev => [...prev, filter])
          }
          return (
            <Form  onSubmit={onSubmit}>
              <div className='flex rounded-lg bg-bg px-2 w-full'>
                <input type={type} defaultValue={queryFilters[i]?.data} className='bg-bg w-full focus:outline-none' onChange={({target}) => handleChange(target)} placeholder='Escribe aquí' name={data.name}/>
                <button className='bg-bg border-l border-main pl-1' type='submit'><MdDone/></button>
              </div>
            </Form>
          )
      }
    },
    {
      label: 'Acciones',
      center: true,
      cell: (data) => <button onClick={()=> deleteFilter(data)} className='px-5 py-2 w-full h-full flex justify-center text-danger items-center' type='button'>Borrar <MdDelete/></button>
    }
  ]
  const deleteFilter = ({name}) => {
    setFilters(prev => prev.filter(e=> name !== e.name))
    setQueryFilters(prev => prev.filter(e => e.name !== name))
  }
  
  useUpdateEffect(()=>{
    setFiltersString((queryFilters.map((e, i) => (!i ? ' WHERE ' : '') + e.query ).join(' AND ')))
    setResult('')
  },[queryFilters])

  return (
    <div className={`animate__animated ${isOpen ? ( closing ? 'animate__fadeOut' : 'animate__fadeIn') : 'hidden'} w-screen h-screen flex flex-col items-center justify-center absolute bg-bg top-0 right-0 bg-opacity-90 z-10 p-5`}>
      <div className={`animate__animated ${closing ? 'animate__zoomOut' : 'animate__zoomIn' } h-full my-10 w-4/6 bg-main rounded-lg overflow-y-auto `}>
        <Form name='form' onSubmit={mainSubmit} className='p-5'>
          <div className='flex w-fit absolute right-5'>
            <button onClick={(e)=> handleClose(e.currentTarget.name)} type='button' name='minimize' className=' font-extrabold p-2 hover:bg-bg rounded-lg'><MdRemove/></button>
            <button onClick={(e)=> handleClose(e.currentTarget.name)} type='button' name='close' className=' font-extrabold p-2 hover:bg-bg rounded-lg'><MdClose/></button>
          </div>
          <button onClick={(e)=> handleClose(e.currentTarget.name)} type='button' name='close' className='absolute right-5 font-extrabold p-2 hover:bg-bg rounded-lg'><MdClose/></button>
          <button onClick={(e)=> handleClose(e.currentTarget.name)} type='button' name='close' className='absolute right-5 font-extrabold p-2 hover:bg-bg rounded-lg'><MdClose/></button>
          <h1 className='font-bold m-3 text-lg self-start'>{id ? 'Editar API' : 'Nueva API'}</h1>

          <div className='border-t border-b border-bg py-2 mx-2'>
            <h2 className='font-bold mx-3 text-base self-start'>Configurar tabla</h2>
            <div className={`grid grid-cols-1 ${advancedQuery ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-2 w-full`}>
              <InputSelect reset={resetMainSelects} onSelect={e => {getTablesFromDatabase(e.value)}} defaultValue={edit?.database} options={dataBases} type='text' required label='Base de datos' name='database' placeholder='Elije una opcion' />
              <InputSelect reset={resetMainSelects} onSelect={e => {handleChangeTable(e.value)}} defaultValue={table || edit?.table} options={tables} type='text' required label='Tabla' name='table' placeholder='Elije una opcion' />
              {!advancedQuery && <InputMultiSelect reset={resetMainSelects} onSelect={values => {handleChangeColumn(values)}} defaultValue={column} options={formatOptions(columns, 'field')} type='text' required label='Columnas' name='columns' placeholder='Todas' />}
            </div>
          </div>

          <div  id='sub_form'/>
          

          <div className='flex flex-col mt-2'>
            <h2 className='font-bold mx-5 text-base self-start py-2'>Editor Sql</h2>
            {queryErrors && <span className='text-danger bg-danger-light rounded-lg font-medium px-2'>{queryErrors}</span>}
            <div className='bg-bg p-1 rounded-lg my-2'>
              <div className='flex items-center bg-bg rounded-lg focus:outline-none px-3  py-1 w-fit'>
                <input onChange={e => setAdvancedQuery(e.target.checked)} type="checkbox" />
                <label className='text-sm font font-semibold mx-1'>Consulta avanzada</label>
              </div>
              <div className='h-56 overflow-y-auto overflow-x-hidden'>
                <SqlEditor readOnly={!advancedQuery} query={query + (advancedQuery ? '' : filtersString)} table={table} onChange={handleQueryChange} name='query'/>
              </div>
            </div>
          </div>


          <div className='flex flex-col md:flex-row w-full'>
            <Input type='number' name='limit' placeholder="Es 10 por defecto" defaultValue={edit?.limit} label='Limite' />
            <Input type='text' required={result}  name='author'placeholder="ej: Daniel" defaultValue={edit?.author} label='Autor' />
          </div>


          <div className='mb-4'>
            {
              tabs[tabIndex].component
            }
            <div className='mx-4'>
              {
                tabs.map((e,i) => <button key={e.label+i} type='button' onClick={()=> setTabIndex(i)} className={`px-4 border-b border-x rounded-b-lg border-bg text-sm hover:text-primary ${i === tabIndex && 'font-bold'}`}>{e.label}</button>)
              }
            </div>
          </div>

          <div className='border-t border-bg py-2 my-2'> 
            <h2 className='font-bold mx-3 text-base self-start'>Datos endpoint</h2>
            <div className='flex flex-col md:flex-row w-full'>
              <Input type='text' required={result} name='name' placeholder='ej: Productions' defaultValue={edit?.name} label='Nombre' />
              <Input type='text' required={result} name='endpoint' placeholder='ej: /productions' template='/' defaultValue={edit?.endpoint} label='Ruta de contexto' />
            </div>
          </div>

          <div className='flex w-full justify-end'>
            {id && <button onClick={cancelEdit} className='btn-bg' type='button'>Cancel Edit</button>}
            <button 
              disabled={queryErrors} 
              className={`${queryErrors ? 'btn-bg' : 'btn-primary'} flex items-center justify-center`} 
              type='submit' 
              id={result ? 'main-submit' : 'test-submit' }>
                {result ? (id ? 'Guardar': 'Crear') : 'Probar query'} {loading && <Loader size={5}/>}
            </button>
          </div>

        </Form>

        {(!advancedQuery && table && !queryErrors) ? 
          <Portal node={document && document.getElementById('sub_form')}>
            <div className='border-b border-bg my-2 py-2'>
              <Form  onSubmit={secondarySubmit}>
                <div className='m-2'> 
                  <h2 className='font-bold mx-3 text-base self-start'>Agregar filtros</h2>
                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-2 w-full'>
                    <InputSelect reset={resetSecondarySelects} options={formatOptions(methods.array, 'name', 'display_name')} required type='text' label='Metodo' name='operator' placeholder='Elije una opcion' />
                    <InputSelect reset={resetSecondarySelects} options={formatOptions(columns, 'field')} required type='text' label='Columna' name='field' placeholder='Elije una opcion' />
                    <Input name='name' label='Nombre' required placeholder='Ej: buscar-provincia'/>
                  </div>
                  <div className='flex w-full justify-end'>
                  <button className={`btn-primary flex items-center justify-center`} type='submit'>Añadir filtro{loading && <Loader size={5}/>}</button>
                  </div>
                </div>
                
              </Form> 
              <div className='bg-main border h-56 border-bg overflow-x-auto rounded-lg my-2 py-2'>
                <Table data={filters} columns={tableColumns}/>
              </div>
            </div>
          </Portal>
        : null}
       
      </div>
    </div>
  );
};

export default Apis;