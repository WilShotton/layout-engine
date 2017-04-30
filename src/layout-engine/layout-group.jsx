import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'
import RxComponent from '../utils/rx-component'
import BoundsResizer from './bounds-resizer'
import Resizer from './resizer'
import './layout-group.scss'

const MIN_MEASURE = 24

class LayoutGroup extends RxComponent{

    constructor(props) {

        super(props)

        this.createHandlers(['resizeContent', 'resizeBounds'])

        this.state = {
            bounds: {},
            isResizing: false,
            metrics: {}
        }
    }

    componentDidMount() {

        const bounds$ = Rx.Observable
            .merge(

                this.propAsStream('bounds')
                    .map(bounds => () => {

                        return {snapshot: bounds, bounds}
                    }),

                this.event('resizeBounds')
                    .map(() => current => {

                        return {...current, snapshot: current.bounds}
                    }),

                this.event('resizeBounds')
                    .switchMap(({iX, iY}) => {

                        return Rx.Observable.fromEvent(document, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(document, 'mouseup'))
                            .map(e => {

                                return {
                                    dX: e.clientX - iX,
                                    dY: e.clientY - iY
                                }
                            })
                    })
                    .map(update => current => {

                        return {...current, bounds: {...current.bounds, ..._.pickBy({
                            width: Math.max(
                                current.snapshot.width + update.dX,
                                MIN_MEASURE
                            ),
                            height: Math.max(
                                current.snapshot.height + update.dY,
                                MIN_MEASURE
                            )
                        }, _.isFinite)}}
                    })

            )
            .scan((acc, update) => update(acc), {})
            .pluck('bounds')
            .map(bounds => ({bounds}))

        const metrics$ = Rx.Observable
            .merge(

                this.props$
                    .map(({bounds, layout}) => () => {

                    console.log('bounds', bounds)

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

                        const offset = y / (_.size(values) - index - 1)

                        const targetMeasure = Math.max(
                            snapshot[index].measure + y,
                            MIN_MEASURE
                        )

                        return {
                            snapshot,
                            values: _.map(values, (value, i) => {

                                if (i < index) {
                                    return value
                                }

                                if (i === index) {

                                    return {
                                        ...value,
                                        measure: targetMeasure
                                    }
                                }

                                if (targetMeasure === MIN_MEASURE) {
                                    return value
                                }

                                // console.log('???', targetMeasure === MIN_MEASURE)

                                const measure = snapshot[i].measure

                                const foo = measure - offset

                                // console.log('offset', offset)
                                // console.log('foo', foo)
                                // console.log(' ')

                                return {
                                    ...value,
                                    // measure: i === index ? measure + y : measure - offset

                                    measure: Math.max(
                                        foo,
                                        MIN_MEASURE
                                    )

                                    //measure: foo
                                }
                            })
                        }
                    })
            )
            .scan((acc, update) => update(acc), {})
            .pluck('values')
            .map(metrics => ({metrics}))

        const resizeStart$ = Rx.Observable.merge(
            this.event('resizeContent'),
            this.event('resizeBounds')
        )

        const resizeFinish$ = resizeStart$.flatMap(() => {
            return Rx.Observable.fromEvent(document, 'mouseup').take(1)
        })

        const isResizing$ = Rx.Observable
            .merge(resizeStart$.mapTo(true), resizeFinish$.mapTo(false))
            .startWith(false)
            .map(isResizing => ({isResizing}))

        this.addDisposables(

            bounds$.subscribe(this.stateObserver),
            isResizing$.subscribe(this.stateObserver),
            metrics$.subscribe(this.stateObserver)
        )
    }

    render() {

        const { layout } = this.props

        const { bounds, isResizing, metrics } = this.state

        return (
            <div className="layout-group" style={{
                ...bounds,
                userSelect: isResizing ? 'none' : 'auto'
            }}>

                {_(metrics).chain()
                    .map((metric, index) => {

                        return [
                            React.createElement(layout.children[index].factory, {
                                key: index,
                                style: {
                                    height: metric.measure,
                                    width: bounds.width
                                }
                            }),
                            React.createElement(Resizer, {
                                index,
                                key: `resizer-${index}`,
                                onMouseDown: this.on.resizeContent
                            })
                        ]
                    })
                    .flatten()
                    .initial()
                    .value()
                }

            </div>
        )
    }
}

LayoutGroup.defaultProps = {

    bounds: {width: 300, height: 300}
}

export default LayoutGroup

// <BoundsResizer {...{
//     style: {bottom: 6, right: 0, top: 0, width: 6},
//     onResize: e => this.on.resizeBounds({iX: e.clientX})
// }}/>
//
// <BoundsResizer {...{
//     style: {top: (bounds.height || 0) - 6, right: 6, left: 0, height: 6},
//     onResize: e => this.on.resizeBounds({iY: e.clientY})
// }}/>
