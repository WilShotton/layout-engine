import React from 'react'
import './component.scss'

export default ({

    className,
    style

}) => {

    return (
        <div className={`component ${className}`} style={style}>Third</div>
    )
}
