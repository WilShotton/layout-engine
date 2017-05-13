import React from 'react'
import styles from './component.scss'

export default ({

    className,
    style

}) => {

    return (
        <div className={`${styles.component} ${styles[className]}`} style={style}>Third</div>
    )
}
