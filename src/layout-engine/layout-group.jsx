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
                    // .do(() => {
                    //
                    //     const min = 20
                    //     const items = [40, 80, 10]
                    //     const total = 100
                    //
                    //
                    //     const add = (a, b) => a + b
                    //
                    //
                    //     const freeItems = _.filter(items, item => item > min)
                    //     const freeItemCount = _.size(freeItems)
                    //     const freeItemTotal = _.reduce(freeItems, add, 0)
                    //
                    //     const fixed = (_.size(items) - freeItemCount) * min
                    //
                    //     const outstanding = total - fixed
                    //
                    //     const out = _.map(items, item => {
                    //
                    //         return Math.max(min, item / freeItemTotal * outstanding)
                    //     })
                    //
                    //
                    // })
                    .withLatestFrom(
                        this.propAsStream('bounds'),
                        ({index, x, y}, {width, height}) => ({snapshot, values}) => {

                            // const foo = () => {
                            //
                            //     const add = (acc, {measure}) => acc + measure
                            //
                            //     const initial = _.slice(values, 0, index + 1)
                            //     // console.log('initial', initial)
                            //
                            //     const sliced = _.slice(values, index + 1)
                            //     // console.log('sliced', sliced)
                            //


                            //     const freeItems = _.filter(sliced, item => item.measure > MIN_MEASURE)
                            //     // console.log('freeItems', freeItems)
                            //
                            //     const freeItemCount = _.size(freeItems)
                            //     // console.log('freeItemCount', freeItemCount)
                            //
                            //     const freeItemTotal = 600 - _.reduce(_.slice(snapshot, 0, index + 1), add, 0) - y
                            //
                            //     // const freeItemTotal = _.reduce(freeItems, add, 0)
                            //     // console.log('freeItemTotal', freeItemTotal)
                            //
                            //     const fixed = (_.size(sliced) - freeItemCount) * MIN_MEASURE
                            //     // console.log('fixed', fixed)
                            //
                            //     const outstanding = _.reduce(sliced, add, 0) - fixed
                            //     // console.log('outstanding', outstanding)
                            //
                            //     return _.concat(initial, _.map(sliced, item => {
                            //
                            //         return {
                            //             ...item,
                            //             measure: Math.max(MIN_MEASURE, item.measure / freeItemTotal * outstanding)
                            //         }
                            //     }))
                            //
                            //
                            // }
                            //
                            // console.log('out', foo())

                            const bar = () => {

                                const add = (acc, {measure}) => acc + measure


                                const before = _.slice(values, 0, index)

                                const current = {
                                    ...values[index],
                                    measure: Math.max(
                                        snapshot[index].measure + y,
                                        MIN_MEASURE
                                    )
                                }

                                const after = _.slice(values, index + 1)


                                // const fixed = _.filter(after, item => item.measure <= MIN_MEASURE)
                                //
                                // const fixedCount = _.size(fixed)
                                //
                                // const fixedMeasure = fixedCount * MIN_MEASURE
                                // console.log('fixedMeasure', fixedMeasure)


                                const initialAfterHeight = _.reduce(after, add, 0)

                                const updatedAfterHeight = height - _.reduce(before, add, 0) - current.measure

                                return _.concat(before, current, _.map(after, value => {

                                    return {
                                        ...value,
                                        measure: Math.max(
                                            MIN_MEASURE,
                                            Math.floor(value.measure  / initialAfterHeight * updatedAfterHeight)
                                        )
                                    }
                                }))
                                // .map(item => ({...item, measure: Math.floor(item.measure)}))
                            }

                            const res = () => {

                                const sliced = _.slice(values, index + 1)
                                // console.log('sliced', sliced)

                                const totalHeight = _.reduce(sliced, (acc, {measure}) => {

                                    return acc + measure

                                }, 0)

                                const targetMeasure = Math.max(
                                    snapshot[index].measure + y,
                                    MIN_MEASURE
                                )

                                return {
                                    snapshot,
                                    values: _.map(values, (value, i) => {

                                        if (i < index || targetMeasure === MIN_MEASURE) {
                                            return value
                                        }

                                        if (i === index) {

                                            return {
                                                ...value,
                                                measure: targetMeasure
                                            }
                                        }

                                        const pc = value.measure / totalHeight

                                        return {
                                            ...value,
                                            measure: Math.max(
                                                snapshot[i].measure - (y * pc),
                                                MIN_MEASURE
                                            )
                                        }
                                    })
                                }
                            }

                            // console.log('res', _.map(res().values, 'measure'))
                            console.log('bar', _.map(bar(), 'measure'))

                            const total = _.map(bar(), 'measure').reduce((a, b) => a + b, 0)
                            if (total > 600) {

                                console.warn('bar total', total)
                            }

                            console.log(' ')

                            return {snapshot, values: bar()}
                        }
                    )
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
