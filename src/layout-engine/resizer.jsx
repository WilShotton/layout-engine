import React from 'react'
import './resizer.scss'

export default ({

    index,
    style,
    onMouseDown

}) => {

    return (
        <div {...{
            className: 'resizer',
            style,
            onMouseDown: e => onMouseDown({...e, payload:{ index }})
        }} />
    )
}
