import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'
import RxComponent from '../utils/rx-component'
import Maximiser from './maximiser'
import Resizer from './resizer'
import styles from './layout-group.scss'


const MIN_MEASURE = 24

export default class LayoutGroup extends RxComponent{

    static propTypes = {
        bounds: React.PropTypes.object,
        doc: React.PropTypes.object,
        layout: React.PropTypes.shape({
            layout: React.PropTypes.oneOf(['vertical', 'horizontal']).isRequired,
            children: React.PropTypes.arrayOf(React.PropTypes.shape({
                factory: React.PropTypes.func.isRequired
            })).isRequired
        }).isRequired
    }

    static defaultProps = {

        bounds: {width: 200, height: 200},
        doc: document
    }

    displayName = 'LayoutGroup'

    constructor(props) {

        super(props)

        this.createHandlers(['maximiseContent', 'resizeContent'])
    }

    state = {

        isResizing: false,
        metrics: {}
    }

    componentDidMount() {

        const measure$ = this.propAsStream('bounds')
            .map(bounds => {

                if (this.props.layout.layout === 'vertical') {
                    return bounds.height
                }

                return bounds.width
            })
            .publishReplay(1)
            .refCount()

        const eventToMeasure = ({clientX, clientY}) => {

            if (this.props.layout.layout === 'vertical') {
                return clientY
            }

            return clientX
        }

        const metrics$ = Rx.Observable
            .merge(

                Rx.Observable
                    .combineLatest(
                        measure$,
                        this.propAsStream('layout'),
                        (measure, layout) => () => {

                            const fixed = _(layout.children)
                                .map('measure')
                                .filter(_.isFinite)
                                .value()

                            const fixedCount = _.size(fixed)

                            const fixedMeasure = _.reduce(fixed, _.add, 0)

                            const defaultMeasure = (measure - fixedMeasure) / (_.size(layout.children) - fixedCount)

                            const minMeasures = _.map(layout.children, child => {
                                return _.isFinite(child.minMeasure)
                                    ? child.minMeasure
                                    : MIN_MEASURE
                            })

                            return {
                                combinedMinMeasure: minMeasures.reduce(_.add, 0),
                                values: _.map(layout.children, (child, index) => {
                                    return {
                                        measure: _.isFinite(child.measure) ? child.measure : defaultMeasure,
                                        minMeasure: minMeasures[index]
                                    }
                                })
                            }
                        }
                    ),

                this.event('maximiseContent')
                    .withLatestFrom(
                        measure$,
                        ({index}, measure) => current => {

                            const aggregatedMinMeasure = current.combinedMinMeasure - current.values[index].minMeasure
                            const maxMeasure = measure - aggregatedMinMeasure

                            const update = _.map(current.values, (item, i) => {
                                return {
                                    ...item,
                                    measure: i === index ? maxMeasure : item.minMeasure,
                                    style: {transition: 'width 200ms, height 200ms'}
                                }
                            })

                            return {...current, snapshot: update, values: update}
                        }
                    ),

                this.event('resizeContent')
                    .map(({index}) => current => {

                        const update = _.map(current.values, value => {
                            return {...value, style: {}}
                        })

                        return {...current, snapshot: update, values: update}
                    }),

                this.event('resizeContent')
                    .map(e => {

                        return {index: e.index, iM: eventToMeasure(e)}
                    })
                    .switchMap(({index, iM}) => {

                        return Rx.Observable.fromEvent(this.props.doc, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(this.props.doc, 'mouseup'))
                            .map(e => {

                                return {
                                    index,
                                    delta: eventToMeasure(e) - iM
                                }
                            })
                    })
                    .withLatestFrom(
                        measure$,
                        ({index, delta}, measure) => current => {

                            const { snapshot, values } = current

                            const add = (acc, {measure}) => acc + measure

                            const before = _.slice(values, 0, index)

                            const beforeMeasure = _.reduce(before, add, 0)

                            const after = _.slice(values, index + 1)

                            const afterMinMeasure = _(after).map('minMeasure').reduce(_.add, 0)
                            const maxMeasure = measure - beforeMeasure - afterMinMeasure

                            const target = {
                                ...values[index],
                                measure: _.clamp(
                                    snapshot[index].measure + delta,
                                    snapshot[index].minMeasure,
                                    maxMeasure
                                )
                            }

                            const initialAfterMeasure = _.reduce(after, add, 0)
                            const updatedAfterMeasure = measure - beforeMeasure - target.measure

                            const update = _.concat(before, target, _.map(after, value => {

                                const measure = Math.floor(value.measure  / initialAfterMeasure * updatedAfterMeasure)

                                return {
                                    ...value,
                                    measure: Math.max(MIN_MEASURE, measure)
                                }
                            }))

                            return {...current, snapshot, values: update}
                        }
                    )
            )
            .scan((acc, update) => update(acc), {})
            .pluck('values')

        const resizeStart$ = this.event('resizeContent').switchMap(() => {
            return Rx.Observable.fromEvent(this.props.doc, 'mousemove').take(1)
        })

        const resizeFinish$ = resizeStart$.switchMap(() => {
            return Rx.Observable.fromEvent(this.props.doc, 'mouseup').take(1)
        })

        const isResizing$ = Rx.Observable
            .merge(resizeStart$.mapTo(true), resizeFinish$.mapTo(false))
            .startWith(false)

        this.addDisposables(

            isResizing$.map(isResizing => isResizing ? 'add' : 'remove')
                .subscribe(action => {

                    this.props.doc.body.classList[action]('resizing')
                }),

            resizeStart$.subscribe(() => this.props.doc.getSelection().removeAllRanges()),

            metrics$.map(metrics => ({metrics}))
                .subscribe(this.stateObserver)
        )
    }

    shouldComponentUpdate(nextProps, nextState) {

        return !_.isEqual(nextProps, this.props)
            || !_.isEqual(nextState, this.state)
    }

    render() {

        const { bounds, layout } = this.props
        const { metrics } = this.state

        return (
            <div className={`${styles.root} ${styles[layout.layout]}`} style={bounds}>

                {_(metrics).chain()
                    .map((metric, index) => {

                        return [
                            React.createElement(Maximiser, {
                                className: layout.layout,
                                index,
                                key: `maximiser-${index}`,
                                style: {
                                    width: layout.layout === 'vertical'
                                        ? bounds.width
                                        : metric.measure
                                },
                                onDoubleClick: this.on.maximiseContent
                            }),
                            React.createElement(layout.children[index].factory, {
                                ...layout.children[index].props,
                                key: index,
                                style: layout.layout === 'vertical'
                                    ? {
                                        ...metric.style,
                                        height: metric.measure,
                                        width: bounds.width
                                    }
                                    : {
                                        ...metric.style,
                                        height: bounds.height,
                                        width: metric.measure
                                    }
                            }),
                            React.createElement(Resizer, {
                                className: layout.layout,
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

