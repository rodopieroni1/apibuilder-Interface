import React, { useEffect, useState } from 'react';
import Table from './Table';
import { capitalize } from './utils';
const TableFromQuery = ({ result }) => {
    const [parsedData, setParsedData] = useState([])
    const [columns, setColumns] = useState([])
    useEffect(() => {
        if (result) {
            const parsedResult = JSON.parse(result)
            if (parsedResult[0]) {
                const columns = Object.keys(parsedResult[0])?.map(e => ({ label: capitalize(e), property: e }))
                setParsedData(parsedResult)
                setColumns(columns)
            }
        } else {
            setParsedData([])
            setColumns([])
        }
    }, [result])
    return (
        <Table columns={columns} data={parsedData} />
    );
};

export default TableFromQuery;