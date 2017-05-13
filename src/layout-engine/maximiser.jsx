import React from 'react'
import styles from './maximiser.scss'


export default class Maximiser extends React.PureComponent {

    displayName = 'Maximiser'

    onDoubleClick = () => {

        this.props.onDoubleClick({index: this.props.index})
    }

    render() {

        return (
            <div {...{
                children: <div className={styles.options} style={this.props.style} />,
                className: `${styles.maximiser} ${this.props.className}`,
                onDoubleClick: this.onDoubleClick
            }} />
        )
    }
}
