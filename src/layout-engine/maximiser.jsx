import React from 'react'
import './maximiser.scss'


export default class Maximiser extends React.PureComponent {

    displayName = 'Maximiser'

    onDoubleClick = () => {

        this.props.onDoubleClick({index: this.props.index})
    }

    render() {

        return (
            <div {...{
                children: <div className="options"/>,
                className: 'maximiser',
                onDoubleClick: this.onDoubleClick
            }} />
        )
    }
}
