import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'
import RxComponent from '../utils/rx-component'
import Resizer from './resizer'
import './layout-group.scss'

const MIN_MEASURE = 12

class LayoutGroup extends RxComponent{

    constructor(props) {

        super(props)

        this.createHandlers(['resizeContent', 'resizeWidth'])

        this.state = {
            isResizing: false,
            metrics: {},
            width: 0
        }
    }

    componentDidMount() {

        const width$ = Rx.Observable
            .merge(

                this.propAsStream('bounds')
                    .pluck('width')
                    .map(update => current => {

                        return {snapshot: update, value: update}
                    }),

                this.event('resizeWidth')
                    .map(update => current => {

                        return {...current, snapshot: current.value}
                    }),

                this.event('resizeWidth')
                    .pluck('clientX')
                    .switchMap(initial => {

                        return Rx.Observable.fromEvent(document, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(document, 'mouseup'))
                            .pluck('clientX')
                            .map(current => {

                                return current - initial
                            })
                    })
                    .map(update => current => {

                        return {...current, value: Math.max(
                            current.snapshot + update,
                            MIN_MEASURE
                        )}
                    })

            )
            .scan((acc, update) => update(acc), {})
            .pluck('value')
            .map(width => ({width}))

        const metrics$ = Rx.Observable
            .merge(

                this.props$
                    .map(({bounds, layout}) => current => {

                        const childHeight = bounds.height / _.size(layout.children)

                        return {values: _.map(layout.children, child => {

                            return {
                                measure: childHeight
                            }
                        })}
                    }),

                this.event('resizeContent')
                    .map(({index}) => ({values}) => {

                        return {snapshot:_.map(values, value => ({...value})), values}
                    }),

                this.event('resizeContent')
                    .switchMap(({index, clientX, clientY}) => {

                        const iX = clientX
                        const iY = clientY

                        return Rx.Observable.fromEvent(document, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(document, 'mouseup'))
                            .map(e => {

                                return {
                                    index,
                                    x: e.clientX - iX,
                                    y: e.clientY - iY
                                }
                            })
                    })
                    .map(({index, x, y}) => ({snapshot, values}) => {

                        values[index].measure = Math.max(
                            snapshot[index].measure + y,
                            MIN_MEASURE
                        )

                        return {snapshot, values}
                    })
            )
            .scan((acc, update) => update(acc), {})
            .pluck('values')
            .map(metrics => ({metrics}))

        const resizeStart$ = Rx.Observable.merge(
            this.event('resizeContent'),
            this.event('resizeWidth')
        )

        const resizeFinish$ = resizeStart$.flatMap(() => {
            return Rx.Observable.fromEvent(document, 'mouseup').take(1)
        })

        const isResizing$ = Rx.Observable
            .merge(resizeStart$.mapTo(true), resizeFinish$.mapTo(false))
            .startWith(false)
            .map(isResizing => ({isResizing}))

        this.addDisposables(

            isResizing$.subscribe(this.stateObserver),
            metrics$.subscribe(this.stateObserver),
            width$.subscribe(this.stateObserver)
        )
    }

    render() {

        const { bounds, layout } = this.props

        const { isResizing, metrics, width } = this.state

        return (
            <div className="layout-group" style={{
                ...bounds,
                width,
                userSelect: isResizing ? 'none' : 'auto'
            }}>

                {_(metrics).chain()
                    .map((metric, index) => {

                        return [
                            React.createElement(layout.children[index].factory, {
                                key: index,
                                style: {
                                    height: metric.measure,
                                    width
                                }
                            }),
                            React.createElement(Resizer, {
                                index,
                                key: `resizer-${index}`,
                                onMouseDown: e => this.on.resizeContent({...e, index})
                            })
                        ]
                    })
                    .flatten()
                    .initial()
                    .value()
                }

                <div {...{

                    style: {
                        position: 'absolute',
                        bottom: 6,
                        right: 0,
                        top: 0,
                        width: 6,
                        cursor: 'pointer',
                        background: '#ccc',
                        opacity: 0.5
                    },

                    onMouseDown: this.on.resizeWidth

                }} />

            </div>
        )
    }
}

LayoutGroup.defaultProps = {

    bounds: {width: 300, height: 300}
}

export default LayoutGroup

