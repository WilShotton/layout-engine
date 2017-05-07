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
                children: <div className="options" style={this.props.style} />,
                className: `maximiser ${this.props.className}`,
                onDoubleClick: this.onDoubleClick
            }} />
        )
    }
}
